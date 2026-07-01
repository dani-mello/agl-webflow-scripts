// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.
gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  function killSplitGalleryTriggers() {
    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith("splitGallery")) {
        st.kill();
      }
    });
  }

  function safeRefresh() {
    if (!window.ScrollTrigger) return;

    const scrollY = window.scrollY;
    ScrollTrigger.refresh();
    window.scrollTo(0, scrollY);
  }

  window.safeRefreshSplitGallery = function (delay = 300) {
    clearTimeout(window.__splitGallerySafeRefreshTimer);
    window.__splitGallerySafeRefreshTimer = setTimeout(() => {
      safeRefresh();
    }, delay);
  };

  function initSplitGallery() {
    const section = document.querySelector(".c-split-gallery");
    if (!section) return;

    const media = section.querySelector(".c-split-gallery_media");
    const mask = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");
    const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));

    if (!media || !mask || !track || slides.length < 2) return;

    section.classList.remove("is-ready");
    clearTimeout(window.__splitGallerySafeRefreshTimer);
    killSplitGalleryTriggers();

    const imgEls = Array.from(section.querySelectorAll("img"));

    imgEls.slice(0, 2).forEach((img) => {
      img.loading = "eager";
      img.fetchPriority = "high";
      img.decoding = "async";
    });

    const isSmall = window.innerWidth <= BREAKPOINT;

    const DESKTOP = {
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
      falloff: 0.4,
      slowness: 1.6,
      eps: 0.5,
      startHold: 0.07
    };

    const cfg = isSmall ? MOBILE : DESKTOP;

    gsap.set(track, { clearProps: "transform" });
    gsap.set(track, {
      position: "relative",
      padding: 0,
      margin: 0,
      willChange: "transform",
      width: "100%",
      force3D: true
    });

    const rootFont =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;

    function getParentWidthPx() {
      const w1 = mask.getBoundingClientRect().width;
      const w2 = section.getBoundingClientRect().width;
      const w3 = window.innerWidth;

      const w = w1 && w1 > 10 ? w1 : w2 && w2 > 10 ? w2 : w3;
      return Math.max(320, Math.round(w));
    }

    let cardWpx, cardHpx, baseH;

    if (!isSmall) {
      const parentW = getParentWidthPx();
      cardWpx = parentW || DESKTOP.cardWRemFallback * rootFont;
      cardHpx = DESKTOP.cardHRem * rootFont;
      baseH = cardHpx;
    } else {
      const mW = mask.getBoundingClientRect().width || window.innerWidth;
      const mH = mask.getBoundingClientRect().height || window.innerHeight;
      cardWpx = Math.max(320, Math.round(mW));
      cardHpx = Math.round(mH * (MOBILE.cardHvh / 100));
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
        gsap.set(imageEl, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%"
        });

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

        gsap.set(imageEl, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%"
        });
      }
    }

    slides.forEach((slide) => {
      gsap.set(slide, {
        position: "absolute",
        right: 0,
        left: "auto",
        width: `${cardWpx}px`,
        height: `${cardHpx}px`,
        margin: 0,
        overflow: "hidden",
        display: "block",
        transformOrigin: "right top",
        willChange: "transform, top",
        visibility: "inherit",
        force3D: true
      });

      normalizeSlideMedia(slide);
    });

    function centerY() {
      const r = mask.getBoundingClientRect();
      return r.height ? r.top + r.height / 2 : window.innerHeight / 2;
    }

    function layoutTick() {
      const cy = centerY();
      const galleryH = mask.clientHeight || window.innerHeight;

      const scales = slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const d = Math.abs(mid - cy);
        const norm = Math.min(1, d / (window.innerHeight * cfg.falloff));
        return cfg.minScale + (1 - cfg.minScale) * (1 - norm);
      });

      let y = 0;

      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];
        slides[i].style.top = `${y}px`;
        slides[i].style.transform = `translate3d(0,0,0) scale(${s})`;
        slides[i].style.zIndex = String(1000 + Math.round(s * 1000));
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
        const mid = rect.top + rect.height / 2;
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
    const yEnd = solveYForSlide(slides.length - 1);

    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance = Math.ceil(naturalTravel * cfg.slowness);

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

    function setDesktopProgress(self) {
      const y = yStart - naturalTravel * self.progress;
      gsap.set(track, { y });
      layoutTick();
    }

    function setMobileProgress(self) {
      const p = mapProgress(self.progress);
      const y = yStart - naturalTravel * p;
      gsap.set(track, { y });
      layoutTick();
    }

    function createTriggers() {
      ScrollTrigger.matchMedia({
        "(min-width: 901px)": function () {
          ScrollTrigger.create({
            id: "splitGallery-desktop",
            trigger: section,
            start: "top top",
            end: "+=" + pinDistance,
            scrub: true,
            pin: true,
            pinSpacing: true,
            anticipatePin: 4,
            invalidateOnRefresh: false,
            onRefresh: setDesktopProgress,
            onUpdate: setDesktopProgress
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
            anticipatePin: 4,
            invalidateOnRefresh: false,
            onRefresh: setMobileProgress,
            onUpdate: setMobileProgress
          });
        }
      });
    }

    function forcePreloadImage(img) {
      return new Promise((resolve) => {
        if (!img || img.tagName !== "IMG") {
          resolve();
          return;
        }

        img.loading = "eager";
        img.fetchPriority = "high";
        img.decoding = "async";

        const src = img.currentSrc || img.src || img.getAttribute("src");
        const srcset = img.getAttribute("srcset");
        const sizes = img.getAttribute("sizes");

        if (!src && !srcset) {
          resolve();
          return;
        }

        const preload = new Image();

        preload.onload = () => resolve();
        preload.onerror = () => resolve();

        if (sizes) preload.sizes = sizes;
        if (srcset) preload.srcset = srcset;
        if (src) preload.src = src;

        if (srcset) img.srcset = srcset;
        if (sizes) img.sizes = sizes;
        if (src) img.src = src;
      });
    }

    function revealGallery() {
      gsap.set(track, { y: yStart });
      layoutTick();

      createTriggers();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          section.classList.add("is-ready");
        });
      });
    }

    const firstImg = section.querySelector(".c-split-gallery_image");
    const secondImg = imgEls[1];

    Promise.all([
      forcePreloadImage(firstImg),
      forcePreloadImage(secondImg)
    ]).then(revealGallery);
  }

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

  let t;

  window.addEventListener("resize", () => {
    clearTimeout(t);

    t = setTimeout(() => {
      boot();
    }, 200);
  });
})();
