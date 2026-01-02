/* ==========================================================================
   Split Gallery (static slides) — Webflow + GSAP + ScrollTrigger
   - Multi-instance safe (can exist multiple times on a page)
   - Boots after DOM + Webflow init (fixes “works in preview, not published”)
   - Expects this structure:

   .c-split-gallery
     .c-split-gallery_mask
       .c-split-gallery_track
         .c-split-gallery_slide
           img.c-split-gallery_image

   ========================================================================== */

(function () {
  // --- Optional debug: uncomment while troubleshooting
  // console.log("split-gallery.js loaded", { gsap: typeof window.gsap, ST: typeof window.ScrollTrigger });

  function runSplitGallery() {
    if (typeof window.gsap === "undefined" || typeof window.ScrollTrigger === "undefined") {
      console.warn("[Split Gallery] GSAP or ScrollTrigger not found on window.");
      return;
    }

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

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

      // --- Tunables (same behaviour as your CodePen) ---
      const CARD_W_REM = 60;
      const CARD_H_REM = 60;
      const MIN_SCALE  = 0.5;
      const FALLOFF    = 0.55;
      const EPS        = 0.5;
      const SLOWNESS   = 2.0;

      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseH    = CARD_H_REM * rootFont;

      const stId = `splitGallery_${idx}`;

      // Kill any previous trigger with same id (safe for re-runs)
      ScrollTrigger.getAll().forEach(st => {
        if (st && st.vars && st.vars.id === stId) st.kill();
      });

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

      // Measure mask height (must be non-zero)
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

        // Keep track height synced with stack
        track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;
      }

      // Initial layout (so we know the real travel distance)
      layoutTick();

      function buildTrigger() {
        // Recalc on rebuild (resize etc.)
        layoutTick();

        const trackHeight   = track.clientHeight;
        const naturalTravel = Math.max(trackHeight - galleryH, 0);
        const pinDistance   = Math.ceil(naturalTravel * SLOWNESS);

        const isSmall        = window.innerWidth <= 900;
        const triggerElement = isSmall ? mask : section;

        // Kill existing trigger for this instance before recreating
        ScrollTrigger.getAll().forEach(st => {
          if (st && st.vars && st.vars.id === stId) st.kill();
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
            const y = startY - naturalTravel * p;
            gsap.set(track, { y });
            layoutTick();
          }
          // markers: true
        });
      }

      buildTrigger();

      // Debounced rebuild on resize
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          buildTrigger();
          ScrollTrigger.refresh(true);
        }, 150);
      });
    });

    // Final refresh after everything is created (helps published sites)
    ScrollTrigger.refresh(true);
  }

  // Boot helper: DOM ready + Webflow ready
  function boot() {
    const onReady = (fn) => {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fn, { once: true });
      } else {
        fn();
      }
    };

    onReady(() => {
      // If Webflow exists, wait until it finishes initializing
      if (window.Webflow && Array.isArray(window.Webflow)) {
        window.Webflow.push(() => {
          runSplitGallery();

          // Extra: rerun after a short delay (fonts/images/layout settle)
          setTimeout(() => {
            runSplitGallery();
          }, 250);
        });
      } else {
        runSplitGallery();
        setTimeout(() => runSplitGallery(), 250);
      }
    });
  }

  boot();
})();
