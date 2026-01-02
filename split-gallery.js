// Requires GSAP + ScrollTrigger loaded on the page
gsap.registerPlugin(ScrollTrigger);

function initSplitGallery() {
  const section = document.querySelector(".c-split-gallery");
  if (!section) return;

  const mask   = section.querySelector(".c-split-gallery_mask");
  const track  = section.querySelector(".c-split-gallery_track");
  const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));
  const imgs   = slides
    .map(s => s.querySelector(".c-split-gallery_image img, img"))
    .filter(Boolean);

  if (!mask || !track || !slides.length || !imgs.length) return;

  // ---- Tunables (same spirit as the CodePen) ----
  const CARD_W_REM = 60;
  const CARD_H_REM = 60;
  const MIN_SCALE  = 0.5;
  const FALLOFF    = 0.55;
  const EPS        = 0.5;
  const SLOWNESS   = 2.0;
  const BREAKPOINT = 900;

  const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const baseH = CARD_H_REM * rootFont;

  // Reset any previous run (important when Webflow re-inits, or on resize)
  ScrollTrigger.getAll().forEach(st => {
    if (st?.vars?.id === "splitGallery") st.kill();
  });

  // Prepare containers
  gsap.set(track, { position: "relative", padding: 0, margin: 0 });

  slides.forEach(slide => {
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

  const galleryH = mask.clientHeight || window.innerHeight;

  // Start so the first card is visible at MIN_SCALE height
  const startY = Math.max(0, galleryH - baseH * MIN_SCALE);
  gsap.set(track, { y: startY });

  function layoutTick() {
    const vpCenter = window.innerHeight / 2;

    const scales = slides.map(slide => {
      const rect = slide.getBoundingClientRect();
      const mid  = rect.top + rect.height / 2;
      const d    = Math.abs(mid - vpCenter);
      const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
      return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm); // 0.5..1..0.5
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

  // Initial paint so track height is real
  layoutTick();

  function buildPin() {
    const trackHeight   = track.clientHeight;
    const naturalTravel = Math.max(trackHeight - galleryH, 0);
    const pinDistance   = Math.ceil(naturalTravel * SLOWNESS);

    const isSmall = window.innerWidth <= BREAKPOINT;

    ScrollTrigger.create({
      id: "splitGallery",
      trigger: isSmall ? mask : section,
      start: "top top",
      end: "+=" + pinDistance,
      scrub: true,
      pin: true,
      anticipatePin: 1,
      onUpdate(self) {
        const p = self.progress;           // 0..1
        const y = startY - naturalTravel * p;
        gsap.set(track, { y });
        layoutTick();
      }
      // markers: true
    });
  }

  buildPin();
}

// Run once
initSplitGallery();

// Re-init on resize (debounced)
let _sgTimer;
window.addEventListener("resize", () => {
  clearTimeout(_sgTimer);
  _sgTimer = setTimeout(() => {
    // Kill our trigger cleanly, then rebuild
    ScrollTrigger.getAll().forEach(st => {
      if (st?.vars?.id === "splitGallery") st.kill();
    });
    initSplitGallery();
    ScrollTrigger.refresh();
  }, 150);
});

