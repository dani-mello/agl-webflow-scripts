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

    if (!mask || !track || slides.length < 1) return;

    killSplitGalleryTriggers();

    // ---- Tunables (KEEP your desktop feel) ----
    const CARD_W_REM = 60;
    const CARD_H_REM = 60;
    const MIN_SCALE = 0.5;
    const FALLOFF = 0.55;
    const EPS = 0.5;
    const SLOWNESS = 2.0;

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const baseH = CARD_H_REM * rootFont;

    // ---- Normalize/prepare elements ----
    // IMPORTANT: clear any CSS transform hiding the track (like translateY(100%))
    gsap.set(track, { clearProps: "transform" });

    gsap.set(track, {
      position: "relative",
      padding: 0,
      margin: 0,
      willChange: "transform",
    });

    // Slides as cards, flush right
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

      // Support BOTH:
      // A) Webflow Image element (<img>)
      // B) Div with background-image (common in Webflow)
      const imgWrap = slide.querySelector(".c-split-gallery_image") || slide;
      gsap.set(imgWrap, {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      });

      const img = imgWrap.querySelector("img");
      if (img) {
        gsap.set(img, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        });
      } else {
        // If it's a background-image div, enforce cover behavior
        imgWrap.style.backgroundSize = "cover";
        imgWrap.style.backgroundPosition = "center";
        imgWrap.style.backgroundRepeat = "no-repeat";
      }
    });

    function getCenterY() {
      const r = mask.getBoundingClientRect();
      // fallback if mask rect is weird during load
      return r.height ? r.top + r.height / 2 : window.innerHeight / 2;
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

    function solveYForSlide(index) {
      let y = 0;
      gsap.set(track, { y });
      layoutTick();

      for (let k = 0; k < 10; k++) {
        const centerY = getCenterY();
        const rect = slides[index].getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const delta = centerY - mid;
        y += delta;

        gsap.set(track, { y });
        layoutTick();

        if (Math.abs(delta) < 0.5) break;
      }
      return y;
    }

    // First paint
    gsap.set(track, { y: 0 });
    layoutTick();

    // Start/end positions (first & last hero)
    const yStart = solveYForSlide(0);
    const yEnd = solveYForSlide(slides.length - 1);
    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance = Math.ceil(naturalTravel * SLOWNESS);

    const isSmall = window.innerWidth <= BREAKPOINT;

    // If mobile mask has 0 height, show first card anyway and bail
    // (this avoids “blank” while you’re still wrangling layout)
    if (isSmall && mask.clientHeight < 50) {
      gsap.set(track, { y: yStart });
      layoutTick();
      return;
    }

    ScrollTrigger.matchMedia({
      // ===== DESKTOP (LOCKED) =====
      "(min-width: 901px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-desktop",
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            const y = yStart - naturalTravel * self.progress;
            gsap.set(track, { y });
            layoutTick();
          },
        });
      },

      // ===== MOBILE (FIXED) =====
      "(max-width: 900px)": function () {
        // Trigger when the gallery actually reaches the top
        ScrollTrigger.create({
          id: "splitGallery-mobile",
          trigger: mask,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: mask,
          anticipatePin: 1,
          onUpdate(self) {
            const y = yStart - naturalTravel * self.progress;
            gsap.set(track, { y });
            layoutTick();
          },
        });
      },
    });

    // Refresh after images load (mobile often needs this)
    const imgs = Array.from(section.querySelectorAll(".c-split-gallery_image img"));
    if (imgs.length) {
      let pending = 0;
      imgs.forEach((img) => {
        if (!img.complete) {
          pending++;
          img.addEventListener(
            "load",
            () => {
              pending--;
              if (pending === 0) ScrollTrigger.refresh();
            },
            { once: true }
          );
        }
      });
    }

    ScrollTrigger.refresh();
  }

  // init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplitGallery);
  } else {
    initSplitGallery();
  }

  // rebuild on resize
  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(initSplitGallery, 200);
  });
})();
