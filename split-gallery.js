// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.
gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  function killSplitGalleryTriggers() {
    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith("splitGallery")) st.kill();
    });
  }

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

    killSplitGalleryTriggers();

    // ---- Tunables (unchanged desktop feel) ----
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
    gsap.set(track, {
      position: "relative",
      padding: 0,
      margin: 0,
      clearProps: "height",
      willChange: "transform",
    });

    // ✅ Flush RIGHT: use right:0 (instead of left:0) + transform origin already right
    slides.forEach((slide) => {
      gsap.set(slide, {
        position: "absolute",
        right: 0,
        left: "auto",
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

    // ---- Helpers ----
    function getCenterY() {
      const r = mask.getBoundingClientRect();
      // fallback if mask height is 0 for any reason
      if (!r.height) return window.innerHeight / 2;
      return r.top + r.height / 2;
    }

    function layoutTick() {
      const centerY = getCenterY();
      const galleryH = mask.clientHeight || window.innerHeight;

      const scales = slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const d = Math.abs(mid - centerY);
        const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
        return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);
      });

      let y = 0;
      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];
        slides[i].style.top = `${y}px`;
        slides[i].style.transform = `scale(${s})`;
        slides[i].style.zIndex = String(1000 + Math.round(s * 1000));
        y += baseH * s - EPS;
      }

      track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;
    }

    // Iteratively solve track.y so slide[index] is centered in the mask
    function solveYForSlide(index) {
      let y = 0;

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

    // Initial layout
    gsap.set(track, { y: 0 });
    layoutTick();

    // ✅ Start/end hero positions (first and last at 100%)
    const yStart = solveYForSlide(0);
    const yEnd = solveYForSlide(slides.length - 1);

    if (!isFinite(yStart) || !isFinite(yEnd)) return;

    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance = Math.ceil(naturalTravel * SLOWNESS);

    const isSmall = window.innerWidth <= BREAKPOINT;

    // ✅ Desktop: pin the whole section (unchanged feel)
    // ✅ Mobile: trigger on section, but pin ONLY the mask (this fixes “not showing” / collapsing)
    ScrollTrigger.create({
      id: "splitGallery-main",
      trigger: section,
      start: isSmall ? "top top" : "top top",
      end: "+=" + pinDistance,
      scrub: true,
      pin: isSmall ? mask : true, // key mobile fix
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefreshInit() {
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

    ScrollTrigger.refresh();
  }

  // Init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplitGallery);
  } else {
    initSplitGallery();
  }

  // Rebuild on resize (debounced)
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      initSplitGallery();
    }, 200);
  });
})();
