// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.

gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  let hasInitialised = false;
  let resizeTimer;

  // --------------------------------------------------
  // Kill existing Split Gallery ScrollTriggers
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Safe refresh
  // Used externally after genuine layout changes
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Main init
  // --------------------------------------------------
  function initSplitGallery() {
    const section = document.querySelector(".c-split-gallery");
    if (!section) return;

    const media = section.querySelector(".c-split-gallery_media");
    const mask = section.querySelector(".c-split-gallery_mask");
    const track = section.querySelector(".c-split-gallery_track");

    const slides = Array.from(
      section.querySelectorAll(".c-split-gallery_slide")
    );

    if (!media || !mask || !track || slides.length < 2) return;

    section.classList.remove("is-ready");

    killSplitGalleryTriggers();

    // --------------------------------------------------
    // Images
    // --------------------------------------------------
    const imgEls = Array.from(section.querySelectorAll("img"));

    imgEls.slice(0, 2).forEach((img) => {
      img.loading = "eager";
      img.fetchPriority = "high";
      img.decoding = "async";
    });

    const isSmall = window.innerWidth <= BREAKPOINT;

    // --------------------------------------------------
    // Config
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Track setup
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Measurements
    // --------------------------------------------------
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
          mH *
          (cfg.cardHvh / 100)
        );

      baseH = cardHpx;
    }

    // --------------------------------------------------
    // Normalise media
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Slides
    // --------------------------------------------------
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

    // --------------------------------------------------
    // Original centre calculation
    // --------------------------------------------------
    function centerY() {
      const r = mask.getBoundingClientRect();

      return r.height
        ? r.top + r.height / 2
        : window.innerHeight / 2;
    }

    // --------------------------------------------------
    // Track height
    // --------------------------------------------------
    let lockedTrackHeight = null;
    let lastCalculatedHeight = 0;

    // --------------------------------------------------
    // Layout engine
    // --------------------------------------------------
    function layoutTick() {
      const cy = centerY();

      const galleryH =
        mask.clientHeight ||
        window.innerHeight;

      const scales = slides.map((slide) => {
        const rect =
          slide.getBoundingClientRect();

        const mid =
          rect.top +
          rect.height / 2;

        const d =
          Math.abs(mid - cy);

        const norm =
          Math.min(
            1,
            d /
            (
              window.innerHeight *
              cfg.falloff
            )
          );

        return (
          cfg.minScale +
          (1 - cfg.minScale) *
          (1 - norm)
        );
      });

      let y = 0;

      for (
        let i = 0;
        i < slides.length;
        i++
      ) {
        const s = scales[i];

        slides[i].style.top =
          `${y}px`;

        slides[i].style.transform =
          `scale(${s})`;

        slides[i].style.zIndex =
          String(
            1000 +
            Math.round(s * 1000)
          );

        y +=
          baseH * s -
          cfg.eps;
      }

      const calculatedHeight =
        Math.max(
          y + cfg.eps,
          galleryH + 1
        );

      lastCalculatedHeight =
        calculatedHeight;

      track.style.height =
        `${
          lockedTrackHeight !== null
            ? lockedTrackHeight
            : calculatedHeight
        }px`;
    }

    // --------------------------------------------------
    // Find Y needed to centre slide
    // --------------------------------------------------
    function solveYForSlide(index) {
      let y = 0;

      gsap.set(track, { y });

      layoutTick();

      for (let k = 0; k < 10; k++) {
        const cy = centerY();

        const rect =
          slides[index]
            .getBoundingClientRect();

        const mid =
          rect.top +
          rect.height / 2;

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

    // --------------------------------------------------
    // Initial calculations
    // --------------------------------------------------
    gsap.set(track, {
      y: 0
    });

    layoutTick();

    const yStart =
      solveYForSlide(0);

    const yEnd =
      solveYForSlide(
        slides.length - 1
      );

    const naturalTravel =
      Math.max(
        yStart - yEnd,
        0
      );

    const pinDistance =
      Math.max(
        1,
        Math.ceil(
          naturalTravel *
          cfg.slowness
        )
      );

    // --------------------------------------------------
    // Find max height and lock it
    // --------------------------------------------------
    let maxTrackHeight = 0;

    const SAMPLE_COUNT = 20;

    for (
      let i = 0;
      i <= SAMPLE_COUNT;
      i++
    ) {
      const p =
        i / SAMPLE_COUNT;

      const y =
        yStart -
        naturalTravel * p;

      gsap.set(track, {
        y
      });

      layoutTick();

      maxTrackHeight =
        Math.max(
          maxTrackHeight,
          lastCalculatedHeight
        );
    }

    lockedTrackHeight =
      Math.ceil(maxTrackHeight + 2);

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

    // --------------------------------------------------
    // Progress
    // --------------------------------------------------
    function mapProgress(p) {
      if (!isSmall) return p;

      const hold =
        cfg.startHold || 0;

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
      const y =
        yStart -
        naturalTravel *
        self.progress;

      gsap.set(track, {
        y
      });

      layoutTick();
    }

    function setMobileProgress(self) {
      const p =
        mapProgress(
          self.progress
        );

      const y =
        yStart -
        naturalTravel *
        p;

      gsap.set(track, {
        y
      });

      layoutTick();
    }

    // --------------------------------------------------
    // ScrollTriggers
    // --------------------------------------------------
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

          onRefresh:
            setDesktopProgress,

          onUpdate:
            setDesktopProgress
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

          onRefresh:
            setMobileProgress,

          onUpdate:
            setMobileProgress
        });
      }
    });

    hasInitialised = true;
  }

  // --------------------------------------------------
  // Actually run gallery
  // --------------------------------------------------
  function runGallery() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initSplitGallery();

        ScrollTrigger.sort();
        ScrollTrigger.refresh(true);
      });
    });
  }

  // --------------------------------------------------
  // HOME PAGE BOOT
  //
  // Important:
  // Wait for:
  //
  // 1. window load
  // 2. fonts
  // 3. hero ready
  //
  // This reproduces the correct measurements that happen
  // after manually resizing the browser.
  // --------------------------------------------------
  async function bootHome() {
    // Wait for full page load
    if (document.readyState !== "complete") {
      await new Promise((resolve) => {
        window.addEventListener(
          "load",
          resolve,
          { once: true }
        );
      });
    }

    // Wait for fonts
    if (document.fonts && document.fonts.ready) {
      try {
        await document.fonts.ready;
      } catch (e) {}
    }

    // Wait for Hero ScrollTrigger setup
    if (!window.__HERO_READY__) {
      await new Promise((resolve) => {
        let tries = 0;

        const wait =
          setInterval(() => {
            tries++;

            if (
              window.__HERO_READY__ ||
              tries > 50
            ) {
              clearInterval(wait);
              resolve();
            }
          }, 100);
      });
    }

    // Give browser one final moment to commit all layout.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTimeout(() => {
          runGallery();
        }, 100);
      });
    });
  }

  // --------------------------------------------------
  // TRIP PAGE BOOT
  // --------------------------------------------------
  function bootTrip() {
    if (
      document.readyState === "loading"
    ) {
      document.addEventListener(
        "DOMContentLoaded",
        runGallery,
        { once: true }
      );
    } else {
      runGallery();
    }
  }

  // --------------------------------------------------
  // Determine page type
  // --------------------------------------------------
  const hasHero =
    !!document.querySelector(".c-hero");

  if (hasHero) {
    bootHome();
  } else {
    bootTrip();
  }

  // --------------------------------------------------
  // Resize
  //
  // This remains because we know resizing produces
  // correct measurements.
  // --------------------------------------------------
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);

      resizeTimer =
        setTimeout(() => {
          runGallery();
        }, 250);
    }
  );
})();
