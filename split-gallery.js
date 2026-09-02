// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.

gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  let resizeTimer;
  let responsiveTimer;
  let layoutSyncTimer;
  let layoutSyncBusy = false;

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
    const section =
      document.querySelector(".c-split-gallery");

    if (!section) return;

    const media =
      section.querySelector(".c-split-gallery_media");

    const mask =
      section.querySelector(".c-split-gallery_mask");

    const track =
      section.querySelector(".c-split-gallery_track");

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

    // --------------------------------------------------
    // Images
    // --------------------------------------------------
    const imgEls =
      Array.from(section.querySelectorAll("img"));

    imgEls.slice(0, 2).forEach((img) => {
      img.loading = "eager";
      img.fetchPriority = "high";
      img.decoding = "async";
    });

    const isSmall =
      window.innerWidth <= BREAKPOINT;

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

    const cfg =
      isSmall
        ? MOBILE
        : DESKTOP;

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
        getComputedStyle(
          document.documentElement
        ).fontSize
      ) || 16;

    // --------------------------------------------------
    // Measurements
    // --------------------------------------------------
    function getParentWidthPx() {
      const w1 =
        mask.getBoundingClientRect().width;

      const w2 =
        section.getBoundingClientRect().width;

      const w3 =
        window.innerWidth;

      const w =
        w1 && w1 > 10
          ? w1
          : w2 && w2 > 10
          ? w2
          : w3;

      return Math.max(
        320,
        Math.round(w)
      );
    }

    let cardWpx;
    let cardHpx;
    let baseH;

    if (!isSmall) {
      const parentW =
        getParentWidthPx();

      cardWpx =
        parentW ||
        cfg.cardWRemFallback *
          rootFont;

      cardHpx =
        cfg.cardHRem *
        rootFont;

      baseH =
        cardHpx;
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

      baseH =
        cardHpx;
    }

    // --------------------------------------------------
    // Normalise slide media
    // --------------------------------------------------
    function normalizeSlideMedia(slide) {
      const imageEl =
        slide.querySelector(
          ".c-split-gallery_image"
        ) || slide;

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
        imageEl.style.backgroundSize =
          "cover";

        imageEl.style.backgroundPosition =
          "center";

        imageEl.style.backgroundRepeat =
          "no-repeat";

        gsap.set(imageEl, {
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%"
        });
      }
    }

    // --------------------------------------------------
    // Slide setup
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
    // Centre maths
    // --------------------------------------------------
    function centerY() {
      const r =
        mask.getBoundingClientRect();

      return r.height
        ? r.top + r.height / 2
        : window.innerHeight / 2;
    }

    // --------------------------------------------------
    // Layout engine
    // --------------------------------------------------
    function layoutTick() {
      const cy =
        centerY();

      const galleryH =
        mask.clientHeight ||
        window.innerHeight;

      const scales =
        slides.map((slide) => {
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
        const s =
          scales[i];

        slides[i].style.top =
          `${y}px`;

        slides[i].style.transform =
          `scale(${s})`;

        slides[i].style.zIndex =
          String(
            1000 +
            Math.round(
              s * 1000
            )
          );

        y +=
          baseH * s -
          cfg.eps;
      }

      track.style.height =
        `${Math.max(
          y + cfg.eps,
          galleryH + 1
        )}px`;
    }

    // --------------------------------------------------
    // Solve Y position
    // --------------------------------------------------
    function solveYForSlide(index) {
      let y = 0;

      gsap.set(track, {
        y
      });

      layoutTick();

      for (
        let k = 0;
        k < 10;
        k++
      ) {
        const cy =
          centerY();

        const rect =
          slides[index]
            .getBoundingClientRect();

        const mid =
          rect.top +
          rect.height / 2;

        const delta =
          cy - mid;

        y += delta;

        gsap.set(track, {
          y
        });

        layoutTick();

        if (
          Math.abs(delta) <
          0.5
        ) {
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

    gsap.set(track, {
      y: yStart
    });

    layoutTick();

    section.classList.add(
      "is-ready"
    );

    // --------------------------------------------------
    // Mobile safety
    // --------------------------------------------------
    if (
      isSmall &&
      mask.clientHeight < 50
    ) {
      return;
    }

    // --------------------------------------------------
    // Mobile progress mapping
    // --------------------------------------------------
    function mapProgress(p) {
      if (!isSmall) {
        return p;
      }

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

    // --------------------------------------------------
    // Desktop progress
    // --------------------------------------------------
    function setDesktopProgress(self) {
      if (
        !self.isActive &&
        self.progress >= 1
      ) {
        return;
      }

      const p =
        self.progress >= 0.99
          ? 1
          : self.progress;

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
    // Mobile progress
    // --------------------------------------------------
    function setMobileProgress(self) {
      if (
        !self.isActive &&
        self.progress >= 1
      ) {
        return;
      }

      let p =
        mapProgress(
          self.progress
        );

      if (
        self.progress >= 0.99
      ) {
        p = 1;
      }

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
          id:
            "splitGallery-desktop",

          trigger:
            section,

          start:
            "top top",

          end:
            "+=" +
            pinDistance,

          scrub:
            true,

          pin:
            true,

          pinSpacing:
            true,

          anticipatePin:
            1,

          invalidateOnRefresh:
            true,

          refreshPriority:
            -10,

          onRefresh:
            setDesktopProgress,

          onUpdate:
            setDesktopProgress
        });
      },

      "(max-width: 900px)": function () {
        ScrollTrigger.create({
          id:
            "splitGallery-mobile",

          trigger:
            media,

          start:
            "top top",

          end:
            "+=" +
            pinDistance,

          scrub:
            true,

          pin:
            media,

          pinSpacing:
            true,

          anticipatePin:
            1,

          invalidateOnRefresh:
            true,

          refreshPriority:
            -10,

          onRefresh:
            setMobileProgress,

          onUpdate:
            setMobileProgress
        });
      }
    });
  }

  // --------------------------------------------------
  // Build gallery
  // --------------------------------------------------
  function buildGallery() {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initSplitGallery();

        ScrollTrigger.sort();
        ScrollTrigger.refresh(true);

        startLayoutShiftWatcher();
      });
    });
  }

  // --------------------------------------------------
  // HOME PAGE LAYOUT WATCHER
  //
  // Stay alive until the gallery is ACTUALLY reached.
  //
  // No arbitrary 15-second timeout.
  // --------------------------------------------------
  function startLayoutShiftWatcher() {
    const hasHero =
      !!document.querySelector(
        ".c-hero"
      );

    if (!hasHero) {
      return;
    }

    clearInterval(
      layoutSyncTimer
    );

    layoutSyncTimer =
      setInterval(() => {
        if (
          layoutSyncBusy
        ) {
          return;
        }

        const st =
          ScrollTrigger.getById(
            "splitGallery-desktop"
          ) ||
          ScrollTrigger.getById(
            "splitGallery-mobile"
          );

        if (!st) {
          return;
        }

        // Gallery has actually started.
        // Its measurements must now stay untouched.
        if (st.isActive) {
          clearInterval(
            layoutSyncTimer
          );

          return;
        }

        // User has already passed the gallery.
        if (
          window.scrollY >
          st.end + 100
        ) {
          clearInterval(
            layoutSyncTimer
          );

          return;
        }

        // We're very close to the gallery.
        // Don't suddenly refresh under the user's feet.
        if (
          window.scrollY >=
          st.start - 100
        ) {
          return;
        }

        const section =
          document.querySelector(
            ".c-split-gallery"
          );

        if (!section) {
          return;
        }

        const spacer =
          section.parentElement &&
          section.parentElement.classList.contains(
            "pin-spacer"
          )
            ? section.parentElement
            : section.closest(
                ".pin-spacer"
              );

        if (!spacer) {
          return;
        }

        const rect =
          spacer.getBoundingClientRect();

        const realDocumentTop =
          window.scrollY +
          rect.top;

        const storedStart =
          st.start;

        const difference =
          realDocumentTop -
          storedStart;

        // Diagnostics previously showed a ~461px error.
        if (
          Math.abs(difference) >
          2
        ) {
          layoutSyncBusy =
            true;

          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              ScrollTrigger.sort();

              ScrollTrigger.refresh(
                true
              );

              layoutSyncBusy =
                false;
            });
          });
        }
      }, 250);
  }

  // --------------------------------------------------
  // Responsive rebuild
  // --------------------------------------------------
  function responsiveRebuild() {
    clearTimeout(
      responsiveTimer
    );

    buildGallery();

    responsiveTimer =
      setTimeout(() => {
        buildGallery();
      }, 400);
  }

  // --------------------------------------------------
  // Breakpoint watcher
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Boot
  // --------------------------------------------------
  function boot() {
    const hasHero =
      !!document.querySelector(
        ".c-hero"
      );

    // Trip pages
    if (!hasHero) {
      buildGallery();
      return;
    }

    // Home
    if (
      window.__HERO_READY__
    ) {
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
          clearInterval(
            wait
          );

          buildGallery();
        }
      }, 100);
  }

  // --------------------------------------------------
  // Initial load
  // --------------------------------------------------
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

  // --------------------------------------------------
  // Resize
  // --------------------------------------------------
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(
        resizeTimer
      );

      resizeTimer =
        setTimeout(() => {
          buildGallery();
        }, 250);
    }
  );

  // --------------------------------------------------
  // Orientation change
  // --------------------------------------------------
  window.addEventListener(
    "orientationchange",
    () => {
      setTimeout(() => {
        responsiveRebuild();
      }, 250);
    }
  );
})();
