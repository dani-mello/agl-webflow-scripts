console.log("split-gallery new v1");
// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.
gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  // ---- Polite refresh (prevents thrashing other pinned sections like hero)
  let refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        refreshQueued = false;
        ScrollTrigger.refresh(true);
      });
    });
  }

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

    const DESKTOP = {
      cardWMode: "parent",
      cardWRemFallback: 50,
      cardHRem: 50,
      minScale: 0.5,
      falloff: 0.55,
      slowness: 3.0,
      eps: 1
    };

    const MOBILE = {
      cardHvh: 72,
      minScale: 0.35,
      falloff: 0.40,
      slowness: 1.6,
      eps: 0.5,
      startHold: 0.07
    };

    const cfg = isSmall ? MOBILE : DESKTOP;

    gsap.set(track, { clearProps: "transform" });
    gsap.set(track, { position: "relative", padding: 0, margin: 0, willChange: "transform", width: "100%" });

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    function getParentWidthPx() {
      const w1 = mask.getBoundingClientRect().width;
      const w2 = section.getBoundingClientRect().width;
      const w3 = window.innerWidth;
      const w = (w1 && w1 > 10) ? w1 : (w2 && w2 > 10) ? w2 : w3;
      return Math.max(320, Math.round(w));
    }

    let cardWpx, cardHpx, baseH;

    if (!isSmall) {
      const parentW = getParentWidthPx();
      cardWpx = parentW || (cfg.cardWRemFallback * rootFont);
      cardHpx = cfg.cardHRem * rootFont;
      baseH = cardHpx;
    } else {
      const mW = mask.getBoundingClientRect().width || window.innerWidth;
      const mH = mask.getBoundingClientRect().height || window.innerHeight;
      cardWpx = Math.max(320, Math.round(mW));
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

    gsap.set(track, { y: 0 });
    layoutTick();

    const yStart = solveYForSlide(0);
    const yEnd   = solveYForSlide(slides.length - 1);

    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance   = Math.ceil(naturalTravel * cfg.slowness);

    gsap.set(track, { y: yStart });
    layoutTick();

    if (isSmall && mask.clientHeight < 50) return;

    function mapProgress(p) {
      if (!isSmall) return p;
      const hold = cfg.startHold || 0;
      if (hold <= 0) return p;
      if (p <= hold) return 0;
      return (p - hold) / (1 - hold);
    }

    ScrollTrigger.matchMedia({
      "(min-width: 901px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-desktop",
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate(self) {
            const y = yStart - naturalTravel * self.progress;
            gsap.set(track, { y });
            layoutTick();
          }
        });
      },

      "(max-width: 900px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-mobile",
          trigger: media,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: media,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onEnter() {
            gsap.set(track, { y: yStart });
            layoutTick();
          },
          onEnterBack() {
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
      }
    });

    // Image load → polite refresh once images settle
    const imgEls = Array.from(section.querySelectorAll("img"));
    let pending = 0;
    imgEls.forEach((img) => {
      if (!img.complete) {
        pending++;
        img.addEventListener("load", () => {
          pending--;
          if (pending === 0) queueRefresh();
        }, { once: true });
      }
    });

    queueRefresh();
  }

  // Run after paint so mask width is real
  function boot() {
    requestAnimationFrame(() => {
      requestAnimationFrame(initSplitGallery);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Resize: only reinit when width meaningfully changes (prevents mobile address bar chaos)
  let t;
  let lastW = window.innerWidth;

  window.addEventListener("resize", () => {
    const w = window.innerWidth;
    if (Math.abs(w - lastW) < 10) return;
    lastW = w;

    clearTimeout(t);
    t = setTimeout(boot, 200);
  });

})();
