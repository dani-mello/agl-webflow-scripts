/* Split Gallery (static slides) — Webflow + GSAP + ScrollTrigger
   Expects:
   .c-split-gallery
     .c-split-gallery_mask
       .c-split-gallery_track
         .c-split-gallery_slide
           img.c-split-gallery_image
*/

gsap.registerPlugin(ScrollTrigger);

(function initSplitGalleries() {
  const sections = Array.from(document.querySelectorAll(".c-split-gallery"));
  if (!sections.length) return;

  sections.forEach((section, idx) => {
    const mask  = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");
    if (!mask || !track) return;

    const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
    const imgs   = slides
      .map(s => s.querySelector("img.c-split-gallery_image"))
      .filter(Boolean);

    if (!slides.length || !imgs.length) return;

    // --- Tunables ---
    const CARD_W_REM = 60;
    const CARD_H_REM = 60;
    const MIN_SCALE  = 0.5;
    const FALLOFF    = 0.55;
    const EPS        = 0.5;
    const SLOWNESS   = 2.0;

    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const baseH    = CARD_H_REM * rootFont;

    // Unique ID for this instance (important if multiple components on a page)
    const stId = `splitGallery_${idx}`;

    // --- Prep (JS owns sizing/position of slides) ---
    gsap.set(track, { position: "relative" });

    slides.forEach((slide) => {
      gsap.set(slide, {
        position: "absolute",
        left: 0,
        width: `${CARD_W_REM}rem`,
        height: `${CARD_H_REM}rem`,
        margin: 0,
        overflow: "hidden",
        display: "block",
        transformOrigin: "right top",
        willChange: "transform, top"
      });
    });

    gsap.set(imgs, {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center"
    });

    // Ensure the mask has a measurable height
    const galleryH = mask.clientHeight || window.innerHeight;

    // Start so first card is visible at MIN_SCALE height
    const startY = Math.max(0, galleryH - baseH * MIN_SCALE);
    gsap.set(track, { y: startY });

    function layoutTick() {
      const vpCenter = window.innerHeight / 2;

      const scales = slides.map(slide => {
        const rect = slide.getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        const d    = Math.abs(mid - vpCenter);
        const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
        return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);
      });

      let y = 0;
      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];
        slides[i].style.top       = `${y}px`;
        slides[i].style.transform = `scale(${s})`;
        slides[i].style.zIndex    = String(1000 + Math.round(s * 1000));
        y += baseH * s - EPS;
      }

      track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;
    }

    // Initial layout to compute real stack height
    layoutTick();

    function buildTrigger() {
      const trackHeight   = track.clientHeight;
      const naturalTravel = Math.max(trackHeight - galleryH, 0);
      const pinDistance   = Math.ceil(naturalTravel * SLOWNESS);

      const isSmall        = window.innerWidth <= 900;
      const triggerElement = isSmall ? mask : section;

      // Kill previous trigger for this instance (safe on re-init)
      ScrollTrigger.getAll().forEach(st => {
        if (st?.vars?.id === stId) st.kill();
      });

      ScrollTrigger.create({
        id: stId,
        trigger: triggerElement,
        start: "top top",
        end: "+=" + pinDistance,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate(self) {
          const p = self.progress;
          const y = startY - naturalTravel * p;
          gsap.set(track, { y });
          layoutTick();
        }
        // markers: true
      });
    }

    buildTrigger();

    // Rebuild on resize (debounced)
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        buildTrigger();
        ScrollTrigger.refresh();
      }, 150);
    });
  });
})();
