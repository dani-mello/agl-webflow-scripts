// split-gallery.js
// Requires GSAP + ScrollTrigger loaded before this script.

gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;
  const isHomeWithHero = !!document.querySelector(".c-hero");

  let resizeTimer;
  let responsiveTimer;
  let homeResizeWatcherInstalled = false;
  let homeResizeDone = false;

  function killSplitGalleryTriggers() {
    ScrollTrigger.getAll().forEach((st) => {
      if (
        st?.vars?.id &&
        String(st.vars.id).startsWith("splitGallery")
      ) {
        st.kill(true);
      }
    });
  }

  function safeRefresh() {
    if (!window.ScrollTrigger) return;

    ScrollTrigger.sort();
    ScrollTrigger.refresh(true);
  }

  window.safeRefreshSplitGallery = function (delay = 300) {
    clearTimeout(window.__splitGallerySafeRefreshTimer);

    window.__splitGallerySafeRefreshTimer = setTimeout(() => {
      const y1 = window.scrollY;

      requestAnimationFrame(() => {
        const y2 = window.scrollY;

        if (Math.abs(y2 - y1) > 2) {
          window.safeRefreshSplitGallery(180);
          return;
        }

        safeRefresh();
      });
    }, delay);
  };

  function initSplitGallery() {
    const section = document.querySelector(".c-split-gallery");
    if (!section) return;

    const media = section.querySelector(".c-split-gallery_media");
    const mask = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");

    const slides = Array.from(
      section.querySelectorAll(".c-split-gallery_slide")
    );

    if (
      !media ||
      !mask ||
      !track ||
      slides.length < 2
    ) {
      return;
    }

    section.classList.remove("is-ready");
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
      slowness: 3,
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

    gsap.set(track, {
      clearProps: "transform"
    });

    gsap.set(track, {
      position: "relative",
      padding: 0,
      margin: 0,
      width: "100%",
      willChange: "transform"
    });

    const rootFont =
      parseFloat(
        getComputedStyle(document.documentElement).fontSize
      ) || 16;

    function getParentWidthPx() {
      const w1 = mask.getBoundingClientRect().width;
      const w2 = section.getBoundingClientRect().width;
      const w3 = window.innerWidth;

      const w =
        w1 && w1 > 10
          ? w1
          : w2 && w2 > 10
          ? w2
          : w3;

      return Math.max(320, Math.round(w));
    }

    let cardWpx;
    let cardHpx;
    let baseH;

    if (!isSmall) {
      const parentW = getParentWidthPx();

      cardWpx =
        parentW ||
        cfg.cardWRemFallback * rootFont;

      cardHpx =
        cfg.cardHRem * rootFont;

      baseH = cardHpx;
    } else {
      const mW =
        mask.getBoundingClientRect().width ||
        window.innerWidth;

      const mH =
        mask.getBoundingClientRect().height ||
        window.innerHeight;

      cardWpx =
        Math.max(
          320,
          Math.round(mW)
        );

      cardHpx =
        Math.round(
          mH * (cfg.cardHvh / 100)
        );

      baseH = cardHpx;
    }

    function normalizeSlideMedia(slide) {
      const imageEl =
        slide.querySelector(".c-split-gallery_image") ||
        slide;

      if (
        imageEl &&
        imageEl.tagName === "IMG"
      ) {
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

      const innerImg =
        imageEl
          ? imageEl.querySelector("img")
          : null;

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
        visibility: "inherit"
      });

      normalizeSlideMedia(slide);
    });

    function centerY() {
      const r = mask.getBoundingClientRect();

      return r.height
        ? r.top + r.height / 2
        : window.innerHeight / 2;
    }

    function layoutTick() {
      const cy = centerY();

      const galleryH =
        mask.clientHeight ||
        window.innerHeight;

      const scales = slides.map((slide) => {
        const rect = slide.getBoundingClientRect();
        const mid = rect.top + rect.height / 2;
        const d = Math.abs(mid - cy);

        const norm = Math.min(
          1,
          d / (window.innerHeight * cfg.falloff)
        );

        return (
          cfg.minScale +
          (1 - cfg.minScale) *
            (1 - norm)
        );
      });

      let y = 0;

      for (let i = 0; i < slides.length; i++) {
        const s = scales[i];

        slides[i].style.top = `${y}px`;
        slides[i].style.transform = `scale(${s})`;
        slides[i].style.zIndex = String(
          1000 + Math.round(s * 1000)
        );

        y += baseH * s - cfg.eps;
      }

      track.style.height =
        `${Math.max(
          y + cfg.eps,
          galleryH + 1
        )}px`;
    }

    function solveYForSlide(index) {
      let y = 0;

      gsap.set(track, { y });
      layoutTick();

      for (let k = 0; k < 10; k++) {
        const cy = centerY();

        const rect =
          slides[index].getBoundingClientRect();

        const mid =
          rect.top + rect.height / 2;

        const delta =
          cy - mid;

        y += delta;

        gsap.set(track, { y });
        layoutTick();

        if (Math.abs(delta) < 0.5) {
          break;
        }
      }

      return y;
    }

    gsap.set(track, { y: 0 });
    layoutTick();

    const yStart = solveYForSlide(0);
    const yEnd = solveYForSlide(slides.length - 1);

    const naturalTravel =
      Math.max(
        yStart - yEnd,
        0
      );

    const pinDistance =
      Math.max(
        1,
        Math.ceil(
          naturalTravel * cfg.slowness
        )
      );

    gsap.set(track, {
      y: yStart
    });

    layoutTick();

    section.classList.add("is-ready");

    if (
      isSmall &&
      mask.clientHeight < 50
    ) {
      return;
    }

    function mapProgress(p) {
      if (!isSmall) {
        return p;
      }

      const hold = cfg.startHold || 0;

      if (hold <= 0) {
        return p;
      }

      if (p <= hold) {
        return 0;
      }

      return (
        (p - hold) /
        (1 - hold)
      );
    }

    function setDesktopProgress(self) {
      const p =
        gsap.utils.clamp(
          0,
          1,
          self.progress
        );

      const y =
        yStart -
        naturalTravel * p;

      gsap.set(track, { y });
      layoutTick();
    }

    function setMobileProgress(self) {
      if (
        !self.isActive &&
        self.progress >= 1
      ) {
        return;
      }

      let p =
        mapProgress(self.progress);

      if (
        self.progress >= 0.99
      ) {
        p = 1;
      }

      const y =
        yStart -
        naturalTravel * p;

      gsap.set(track, { y });
      layoutTick();
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
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -10,
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
          anticipatePin: 1,
          invalidateOnRefresh: true,
          refreshPriority: -10,
          onRefresh: setMobileProgress,
          onUpdate: setMobileProgress
        });
      }
    });
  }

  function buildGallery() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initSplitGallery();

        ScrollTrigger.sort();
        ScrollTrigger.refresh(true);

        setupHomeEarlyResize();
      });
    });
  }

  // Home desktop only:
  // rebuild once before the gallery pins.
  function setupHomeEarlyResize() {
    if (!isHomeWithHero) return;
    if (window.innerWidth <= BREAKPOINT) return;
    if (homeResizeWatcherInstalled) return;

    homeResizeWatcherInstalled = true;

    const gallery =
      document.querySelector(".c-split-gallery");

    if (!gallery) return;

    function watchGalleryDistance() {
      if (homeResizeDone) return;
      if (window.innerWidth <= BREAKPOINT) return;

      const rect =
        gallery.getBoundingClientRect();

      if (
        rect.top <=
          window.innerHeight * 3.5 &&
        rect.top >
          window.innerHeight * 1.25
      ) {
        homeResizeDone = true;

        window.removeEventListener(
          "scroll",
          watchGalleryDistance
        );

        window.dispatchEvent(
          new Event("resize")
        );
      }
    }

    window.addEventListener(
      "scroll",
      watchGalleryDistance,
      {
        passive: true
      }
    );

    watchGalleryDistance();
  }

  function responsiveRebuild() {
    clearTimeout(responsiveTimer);

    buildGallery();

    responsiveTimer =
      setTimeout(() => {
        buildGallery();
      }, 400);
  }

  const breakpointQuery =
    window.matchMedia(
      `(max-width: ${BREAKPOINT}px)`
    );

  if (
    typeof breakpointQuery.addEventListener ===
    "function"
  ) {
    breakpointQuery.addEventListener(
      "change",
      responsiveRebuild
    );
  } else if (
    typeof breakpointQuery.addListener ===
    "function"
  ) {
    breakpointQuery.addListener(
      responsiveRebuild
    );
  }

  function boot() {
    if (!isHomeWithHero) {
      buildGallery();
      return;
    }

    if (window.__HERO_READY__) {
      buildGallery();
      return;
    }

    let tries = 0;

    const wait =
      setInterval(() => {
        tries++;

        if (
          window.__HERO_READY__ ||
          tries > 50
        ) {
          clearInterval(wait);
          buildGallery();
        }
      }, 100);
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      boot,
      {
        once: true
      }
    );
  } else {
    boot();
  }

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(() => {
          buildGallery();
        }, 250);
    }
  );

  window.addEventListener(
    "orientationchange",
    () => {
      setTimeout(() => {
        responsiveRebuild();
      }, 250);
    }
  );
})();
