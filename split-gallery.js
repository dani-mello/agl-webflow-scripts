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

    const media  = section.querySelector(".c-split-gallery_media"); // in-flow
    const mask   = section.querySelector(".c-split-gallery_mask");
    const track  = section.querySelector(".c-split-gallery_track");
    const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));

    if (!media || !mask || !track || slides.length < 2) return;

    killSplitGalleryTriggers();

    const isSmall = window.innerWidth <= BREAKPOINT;

    // ===== Desktop settings (LOCKED) =====
    const DESKTOP = {
      // ✅ Width is now 100% of parent (mask) instead of fixed rem
      cardWMode: "parent",

      cardHRem: 50,
      minScale: 0.5,
      falloff: 0.55,
      slowness: 3.0,
      eps: 1
    };

    // ===== Mobile settings (only mobile tweaks) =====
    const MOBILE = {
      cardHvh: 72,
      minScale: 0.35,
      falloff: 0.40,
      slowness: 1.6,
      eps: 0.5,

      // NEW: how much of the scroll should “hold” at the start (0..0.2 is typical)
      startHold: 0.07
    };

    const cfg = isSmall ? MOBILE : DESKTOP;

    // Clear the CSS "translateY(100%)" hiding the track
    gsap.set(track, { clearProps: "transform" });
    gsap.set(track, { position: "relative", padding: 0, margin: 0, willChange: "transform" });

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    // Card size
    let cardWpx, cardHpx, baseH;

    // ✅ Measure parent width (mask) safely
    const maskW = mask.clientWidth || mask.getBoundingClientRect().width || window.innerWidth;
    const maskH = mask.clientHeight || mask.getBoundingClientRect().height || window.innerHeight;

    if (!isSmall) {
      // DESKTOP
      // ✅ 100% of parent width
      cardWpx = maskW;

      // Height stays in rem (as you had it)
      cardHpx = cfg.cardHRem * rootFont;
      baseH = cardHpx;
    } else {
      // MOBILE
      cardWpx = maskW;
      cardHpx = Math.round(maskH * (cfg.cardHvh / 100));
      baseH = cardHpx;
    }

    // --- Helper: ensure we end up with a real "painted" image surface ---
    function normalizeSlideMedia(slide) {
      const imageEl = slide.querySelector(".c-split-gallery_image") || slide;

      // Case A: .c-split-gallery_image IS the <img>
      if (imageEl && imageEl.tagName === "IMG") {
        gsap.set(imageEl, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block"
        });
        return;
      }

      // Case B: wrapper containing <img>
      const innerImg = imageEl ? imageEl.querySelector("img") : null;
      if (innerImg) {
        gsap.set(imageEl, { position: "absolute", inset: 0, width: "100%", height: "100%" });
        gsap.set(innerImg, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block"
        });
        return;
      }

      // Case C: background-image div (common in Webflow)
      if (imageEl) {
        imageEl.style.backgroundSize = "cover";
        imageEl.style.backgroundPosition = "center";
        imageEl.style.backgroundRepeat = "no-repeat";
        gsap.set(imageEl, { position: "absolute", inset: 0, width: "100%", height: "100%" });
      }
    }

    // Slides as cards, flush right
    slides.forEach((slide) => {
      gsap.set(slide, {
  position: "absolute",
  right: 0,
  left: 0,                 // ✅ allow full width
  width: "100%",           // ✅ parent width (no measuring)
  height: cardHpx + "px",
  margin: 0,
  overflow: "hidden",
  display: "block",
  transformOrigin: "right top",
  willChange: "transform, top",
  visibility: "visible"
});


    function centerY() {
      const r = mask.getBoundingClientRect();
      return r.height ? (r.top + r.height / 2) : (window.innerHeight / 2);
    }

    function layoutTick() {
      const cy = centerY();
      const galleryH = mask.clientHeight || window.innerHeight;

      const scales = slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        const d    = Math.abs(mid - cy);
        const norm = Math.min(1, d / (window.innerHeight * cfg.fallo*
