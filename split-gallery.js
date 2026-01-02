// Requires GSAP + ScrollTrigger already loaded globally
gsap.registerPlugin(ScrollTrigger);

(function initAllSplitGalleries() {
  const sections = Array.from(document.querySelectorAll(".c-split-gallery"));
  if (!sections.length) return;

  sections.forEach((section, index) => {
    // Prevent double init per element
    if (section.dataset.splitGalleryInit === "1") return;
    section.dataset.splitGalleryInit = "1";

    const mask  = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");
    const slides = track ? Array.from(track.querySelectorAll(".c-split-gallery_slide")) : [];
    const imgs   = slides.map(s => s.querySelector("img.c-split-gallery_image")).filter(Boolean);

    if (!mask || !track || !slides.length || !imgs.length) return;

    // --- Tunables ---
    const MIN_SCALE = 0.5;
    const FALLOFF   = 0.55;
    const EPS       = 0.5;
    const SLOWNESS  = 2.0;

    // Use real mask size so:
    // - width touches right edge
    // - max state can be 100vh
    const galleryH = mask.clientHeight || window.innerHeight;
    const galleryW = mask.clientWidth  || section.clientWidth;

    // Slides are sized to the mask (so "scale(1)" = full height)
    const baseH = galleryH;
    const baseW = galleryW;

    // Prepare containers
    gsap.set(track, { position: "relative" });

    slides.forEach((slide) => {
      gsap.set(slide, {
        position: "absolute",
        left: 0,
        width: baseW + "px",
        height: baseH + "px",
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

    // --- Layout function (same logic, but using baseH = galleryH) ---
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

    // Initial paint to get height
    layoutTick();

    // ------------------------------------------------------------------
    // ✅ Start + end on FULL images
    //
    // We can't "force scale(1)" directly (scale is based on viewport center),
    // but we CAN start/end so the first/last slide centers pass through the
    // viewport center at the beginning/end of the scroll.
    //
    // We do that by setting startY and endY based on slide midpoint targets.
    // ------------------------------------------------------------------

    // Helper: slide midpoint in viewport for current track y
    function getSlideMid(i) {
      const r = slides[i].getBoundingClientRect();
      return r.top + r.height / 2;
    }

    const vpCenter = window.innerHeight / 2;

    // Find startY so FIRST slide mid ~= vpCenter
    // We'll do a small search around 0..galleryH range (stable, fast)
    let startY = 0;
    gsap.set(track, { y: 0 });
    layoutTick();

    // Adjust startY by the delta between first mid and vpCenter
    startY += (vpCenter - getSlideMid(0));
    gsap.set(track, { y: startY });
    layoutTick();

    // Now compute endY so LAST slide mid ~= vpCenter
    let endY = startY;
    endY += (vpCenter - getSlideMid(slides.length - 1));
    gsap.set(track, { y: endY });
    layoutTick();

    // Restore to start position
    gsap.set(track, { y: startY });
    layoutTick();

    const travel = Math.abs(endY - startY);
    const pinDistance = Math.ceil(travel * SLOWNESS);

    const isSmall        = window.innerWidth <= 900;
    const triggerElement = isSmall ? mask : section;

    const stId = `splitGallery_${index}`;
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
        const p = self.progress; // 0..1
        const y = startY + (endY - startY) * p;
        gsap.set(track, { y });
        layoutTick();
      }
      // markers: true
    });

    // Rebuild on resize (per instance)
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        // allow re-init
        section.dataset.splitGalleryInit = "0";
        ScrollTrigger.getAll().forEach(st => {
          if (st?.vars?.id === stId) st.kill();
        });
        initAllSplitGalleries();
        ScrollTrigger.refresh();
      }, 150);
    });
  });
})();
