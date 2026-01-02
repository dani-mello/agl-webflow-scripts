// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.
gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  function initSplitGallery() {
    const section = document.querySelector(".c-split-gallery");
    if (!section) return;

    const mask = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");
    const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));
    const imgs = slides
      .map((s) => s.querySelector(".c-split-gallery_image img, img"))
      .filter(Boolean);

    if (!mask || !track || slides.length < 2 || imgs.length < 2) return;

    // Kill only our triggers (avoid nuking other site ScrollTriggers)
    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith("splitGallery")) st.kill();
    });

    // ---- Tunables ----
    const CARD_W_REM = 60;
    const CARD_H_REM = 60;
    const MIN_SCALE = 0.5;
    const FALLOFF = 0.55;
    const EPS = 0.5;
    const SLOWNESS = 2.0;

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const baseH = CARD_H_REM * rootFont;

    // Prep containers
    gsap.set(track, { position: "relative", padding: 0, margin: 0, clearProps: "height" });

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
        willChange: "transform, top",
      });
    });

    gsap.set(imgs, {
      position: "absolute",
      inset: 0,
      width: "100%",
      height: "100%",
      objectFit: "cover",
      objectPosition: "center",
    });

    // Use mask center for scaling (more stable than viewport center, esp. when pinned)
    function getCenterY() {
      const r = mask.getBoundingClientRect();
      return r.top + r.height / 2;
    }

    function scaleForSlide(slideRectMid, centerY) {
      const d = Math.abs(slideRectMid - centerY);
      const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
      return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);
    }

    function layoutTick() {
      const centerY = getCenterY();

      const scales = slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        return scaleForSlide(mid, centerY);
      });

      let y = 0;
      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];
        slides[i].style.top = `${y}px`;
        slides[i].style.transform = `scale(${s})`;
        slides[i].style.zIndex = String(1000 + Math.round(s * 1000));
        y += baseH * s - EPS;
      }

      const galleryH = mask.clientHeight || window.innerHeight;
      track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;
    }

    // Iteratively solve track.y so slide[index] is centered in the mask
    function solveYForSlide(index) {
      const galleryH = mask.clientHeight || window.innerHeight;
      let y = 0;

      // Start from a guess: put slide roughly in view
      y = Math.max(0, galleryH * 0.25);

      gsap.set(track, { y });
      layoutTick();

      for (let k = 0; k < 10; k++) {
        const centerY = getCenterY();
        const rect = slides[index].getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const delta = centerY - mid; // +delta means move it DOWN
        y += delta;

        gsap.set(track, { y });
        layoutTick();

        if (Math.abs(delta) < 0.5) break;
      }

      return y;
    }

    // Make sure layout has run at least once
    gsap.set(track, { y: 0 });
    layoutTick();

    // ✅ Start/end Y values that guarantee 100% hero moments
    const yStart = solveYForSlide(0);
    const yEnd = solveYForSlide(slides.length - 1);

    // If something weird happens (e.g. heights 0), bail safely
    if (!isFinite(yStart) || !isFinite(yEnd)) return;

    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance = Math.ceil(naturalTravel * SLOWNESS);

    const isSmall = window.innerWidth <= BREAKPOINT;
    const triggerElement = isSmall ? mask : section;

    // Build ScrollTrigger
    ScrollTrigger.create({
      id: "splitGallery-main",
      trigger: triggerElement,
      start: "top top",
      end: "+=" + pinDistance,
      scrub: true,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit() {
        // Re-solve positions on refresh for accuracy
        gsap.set(track, { y: 0 });
        layoutTick();
      },
      onUpdate(self) {
        const p = self.progress; // 0..1
        const y = yStart - naturalTravel * p; // yStart -> yEnd
        gsap.set(track, { y });
        layoutTick();
      },
    });

    // Final refresh to lock measurements
    ScrollTrigger.refresh();
  }

  // --- init once DOM is ready ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplitGallery);
  } else {
    initSplitGallery();
  }

  // --- rebuild on resize (debounced) ---
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      initSplitGallery();
    }, 200);
  });
})();
