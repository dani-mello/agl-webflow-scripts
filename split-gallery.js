// split-gallery.js
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

    const media = section.querySelector(".c-split-gallery_media");
    const mask  = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");
    const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));

    if (!media || !mask || !track || slides.length < 2) return;

    killSplitGalleryTriggers();

    const isSmall = window.innerWidth <= BREAKPOINT;

    // Desktop locked
    const DESKTOP = {
      cardWRem: 60,
      cardHRem: 60,
      minScale: 0.5,
      falloff: 0.55,
      slowness: 2.0,
      eps: 0.5
    };

    // Mobile tuned
    const MOBILE = {
      cardHvh: 72,
      minScale: 0.35,
      falloff: 0.40,
      slowness: 1.6,
      eps: 0.5,

      // ✅ New: hold the first “hero” moment a little
      // 0.06 = first ~6% of scroll progress stays on slide 1 at 100%
      startHold: 0.06
    };

    const cfg = isSmall ? MOBILE : DESKTOP;

    // Clear CSS hiding transform
    gsap.set(track, { clearProps: "transform" });
    gsap.set(track, { position: "relative", padding: 0, margin: 0, willChange: "transform" });

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    let cardWpx, cardHpx, baseH;

    if (!isSmall) {
      cardWpx = cfg.cardWRem * rootFont;
      cardHpx = cfg.cardHRem * rootFont;
      baseH = cardHpx;
    } else {
      const mW = mask.clientWidth || window.innerWidth;
      const mH = mask.clientHeight || window.innerHeight;
      cardWpx = mW;
      cardHpx = Math.round(mH * (cfg.cardHvh / 100));
      baseH = cardHpx;
    }

    function normalizeSlideMedia(slide) {
      const imageEl = slide.querySelector(".c-split-gallery_image") || slide;

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

      if (imageEl) {
        imageEl.style.backgroundSize = "cover";
        imageEl.style.backgroundPosition = "center";
        imageEl.style.backgroundRepeat = "no-repeat";
        gsap.set(imageEl, { position: "absolute", inset: 0, width: "100%", height: "100%" });
      }
    }

    // Slides/cards (flush right)
    slides.forEach((slide) => {
      gsap.set(slide, {
        position: "absolute",
        right: 0,
        left: "auto",
        width: cardWpx + "px",
        height: cardHpx + "px",
        margin: 0,
        overflow: "hidden",
        display: "block",
        transformOrigin: "right top",
        willChange: "transform, top",
        visibility: "visible"
      });

      normalizeSlideMedia(slide);
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
        const norm = Math.min(1, d / (window.innerHeight * cfg.falloff));
        return cfg.minScale + (1 - cfg.minScale) * (1 - norm);
      });

      let y = 0;
      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];
        slides[i].style.top       = `${y}px`;
        slides[i].style.transform = `scale(${s})`;
        slides[i].style.zIndex    = String(1000 + Math.round(s * 1000));
        y += baseH * s - cfg.eps;
      }

      track.style.height = `${Math.max(y + cfg.eps, galleryH + 1)}px`;
    }

    function solveYForSlide(index) {
      let y = 0;
      gsap.set(track, { y });
      layoutTick();

      for (let k = 0; k < 10; k++) {
        const cy = centerY();
        const rect = slides[index].getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        const delta = cy - mid;
        y += delta;

        gsap.set(track, { y });
        layoutTick();

        if (Math.abs(delta) < 0.5) break;
      }
      return y;
    }

    // Initial paint
    gsap.set(track, { y: 0 });
    layoutTick();

    // Solve hero positions
    const yStart = solveYForSlide(0);
    const yEnd   = solveYForSlide(slides.length - 1);

    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance   = Math.ceil(naturalTravel * cfg.slowness);

    // Force first frame to exactly yStart
    gsap.set(track, { y: yStart });
    layoutTick();

    if (isSmall && mask.clientHeight < 50) return;

    // ---- Progress mapper with optional “start hold” (mobile only) ----
    function mapProgress(p) {
      if (!isSmall) return p;

      const hold = cfg.startHold || 0;
      if (hold <= 0) return p;

      // First `hold` portion of progress stays at 0,
      // remaining portion maps 0..1
      if (p <= hold) return 0;
      return (p - hold) / (1 - hold);
    }

    ScrollTrigger.matchMedia({

      // DESKTOP (LOCKED)
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
          }
        });
      },

      // MOBILE (smoother start)
      "(max-width: 900px)": function () {
        const st = ScrollTrigger.create({
          id: "splitGallery-mobile",
          trigger: media,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: media,
          pinSpacing: true,
          anticipatePin: 1,

          // ✅ Ensure first frame is yStart BEFORE the first scrub update
          onEnter() {
            gsap.set(track, { y: yStart });
            layoutTick();
          },
          onEnterBack() {
            gsap.set(track, { y: yStart });
            layoutTick();
          },
          onRefresh() {
            gsap.set(track, { y: yStart });
            layoutTick();
          },

          onUpdate(self) {
            const p = mapProgress(self.progress);
            const y = yStart - naturalTravel * p;
            gsap.set(track, { y });
            layoutTick();
          }
        });

        // Extra safety: snap to start immediately after creation
        gsap.set(track, { y: yStart });
        layoutTick();

        return st;
      }

    });

    // Refresh after images load
    const imgEls = Array.from(section.querySelectorAll("img"));
    let pending
