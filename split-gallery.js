// split-gallery.js
// Requires GSAP + ScrollTrigger loaded BEFORE this script.

gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

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
  // Can be called externally after accordion/layout changes
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

        // If user is actively scrolling, wait until scrolling settles.
        if (Math.abs(y2 - y1) > 2) {
          window.safeRefreshSplitGallery(180);
          return;
        }

        safeRefresh();
      });
    }, delay);
  };

  // --------------------------------------------------
  // Main gallery init
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
      willChange: "transform",
      width: "100%"
    });

    const rootFont =
      parseFloat(
        getComputedStyle(document.documentElement).fontSize
      ) || 16;

    // --------------------------------------------------
    // Width measurements
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
    // Normalise slide media
    // --------------------------------------------------
    function normalizeSlideMedia(slide) {
      const imageEl =
        slide.querySelector(".c-split-gallery_image") ||
        slide;

      // Image element itself
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

      // Wrapper containing an image
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

      // Background image fallback
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
    // IMPORTANT:
    // Gallery centre is locked to viewport centre.
    //
    // Do NOT calculate this using mask.getBoundingClientRect().
    // The mask position changes when ScrollTrigger releases
    // the pin and was causing the large jump at the end.
    // --------------------------------------------------
    function centerY() {
      return window.innerHeight / 2;
    }

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

      track.style.height =
        `${Math.max(
          y + cfg.eps,
          galleryH + 1
        )}px`;
    }

    // --------------------------------------------------
    // Find Y position required to centre a slide
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
    // Initial positioning
    // --------------------------------------------------
    gsap.set(track, { y: 0 });

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

    section.classList.add("is-ready");

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
      if (!isSmall) return p;

      const hold =
        cfg.startHold || 0;

      if (hold <= 0) return p;

      if (p <= hold) {
        return 0;
      }

      return (
        (p - hold) /
        (1 - hold)
      );
    }

    // --------------------------------------------------
    // Desktop position
    //
    // Explicitly force exact start/end positions so
    // release of pin can't create a fractional jump.
    // --------------------------------------------------
    function setDesktopProgress(self) {
      let y;

      if (self.progress >= 0.9999) {
        y = yEnd;
      } else if (self.progress <= 0.0001) {
        y = yStart;
      } else {
        y =
          yStart -
          naturalTravel *
          self.progress;
      }

      gsap.set(track, { y });

      layoutTick();
    }

    // --------------------------------------------------
    // Mobile position
    // --------------------------------------------------
    function setMobileProgress(self) {
      const p =
        mapProgress(
          self.progress
        );

      let y;

      if (self.progress >= 0.9999) {
        y = yEnd;
      } else if (self.progress <= 0.0001) {
        y = yStart;
      } else {
        y =
          yStart -
          naturalTravel *
          p;
      }

      gsap.set(track, { y });

      layoutTick();
    }

    // --------------------------------------------------
    // ScrollTriggers
    //
    // Hero priority = 100
    // Gallery priority = -10
    // --------------------------------------------------
    ScrollTrigger.matchMedia({
      "(min-width: 901px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-desktop",

          trigger: section,

          start: "top top",

          end:
            "+=" +
            pinDistance,

          scrub: true,

          pin: true,
          pinSpacing: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,

          refreshPriority: -10,

          onEnter() {
            gsap.set(track, {
              y: yStart
            });

            layoutTick();
          },

          onEnterBack() {
            gsap.set(track, {
              y: yEnd
            });

            layoutTick();
          },

          onLeave() {
            gsap.set(track, {
              y: yEnd
            });

            layoutTick();
          },

          onLeaveBack() {
            gsap.set(track, {
              y: yStart
            });

            layoutTick();
          },

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

          end:
            "+=" +
            pinDistance,

          scrub: true,

          pin: media,
          pinSpacing: true,

          anticipatePin: 1,

          invalidateOnRefresh: true,

          refreshPriority: -10,

          onEnter() {
            gsap.set(track, {
              y: yStart
            });

            layoutTick();
          },

          onEnterBack() {
            gsap.set(track, {
              y: yEnd
            });

            layoutTick();
          },

          onLeave() {
            gsap.set(track, {
              y: yEnd
            });

            layoutTick();
          },

          onLeaveBack() {
            gsap.set(track, {
              y: yStart
            });

            layoutTick();
          },

          onRefresh:
            setMobileProgress,

          onUpdate:
            setMobileProgress
        });
      }
    });
  }

  // --------------------------------------------------
  // Boot
  //
  // Trip pages:
  // Gallery can initialise immediately.
  //
  // Home:
  // Wait until Hero Split Stack has completed its
  // first measurement / refresh.
  // --------------------------------------------------
  function boot() {
    const hasHeroPin =
      document.querySelector(".c-hero");

    function run() {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          initSplitGallery();

          ScrollTrigger.sort();

          ScrollTrigger.refresh(true);
        });
      });
    }

    // No hero = trip page
    if (
      !hasHeroPin ||
      window.__HERO_READY__
    ) {
      run();
      return;
    }

    // Home page:
    // wait for hero to become ready.
    let tries = 0;

    const wait =
      setInterval(() => {
        tries++;

        if (
          window.__HERO_READY__ ||
          tries > 40
        ) {
          clearInterval(wait);

          run();
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
      { once: true }
    );
  } else {
    boot();
  }

  // --------------------------------------------------
  // Resize
  // --------------------------------------------------
  let resizeTimer;

  window.addEventListener(
    "resize",
    () => {
      clearTimeout(
        resizeTimer
      );

      resizeTimer =
        setTimeout(() => {
          boot();
        }, 250);
    }
  );
})();
