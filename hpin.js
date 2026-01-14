// hpin.js
console.log(
  "%cHPIN-horizontalscroll V12 (mobile swipe mapping)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;
  const MOBILE_MQ = "(max-width: 900px)";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  // ------------------------------------------------------------
  // Mobile helper:
  // 1) Force eager load for HPIN images (helps iOS first interaction)
  // 2) Map vertical swipe to horizontal scroll inside .c-hpin_view
  // ------------------------------------------------------------
  (function mobileHelpers() {
    const isMobile = window.matchMedia(MOBILE_MQ).matches;
    if (!isMobile) return;

    // Eager-load inside HPIN only
    document.querySelectorAll(".c-hpin img").forEach((img) => {
      img.loading = "eager";
      img.decoding = "async";
    });

    // "Wake" the scroller once after load (tiny nudge)
    window.addEventListener("load", () => {
      setTimeout(() => {
        document.querySelectorAll(".c-hpin_view").forEach((view) => {
          const x = view.scrollLeft;
          view.scrollLeft = x + 1;
          view.scrollLeft = x;
        });
      }, 300);
    });

    // Vertical swipe → horizontal scroll mapping
    document.querySelectorAll(".c-hpin_view").forEach((view) => {
      let startX = 0;
      let startY = 0;
      let lastX = 0;
      let lastY = 0;
      let locked = false; // gesture lock

      function canScrollHorizontally() {
        return view.scrollWidth > view.clientWidth + 2;
      }

      view.addEventListener(
        "touchstart",
        (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;
          startX = lastX = t.clientX;
          startY = lastY = t.clientY;
          locked = false;
        },
        { passive: true }
      );

      view.addEventListener(
        "touchmove",
        (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;

          const dx = t.clientX - lastX;
          const dy = t.clientY - lastY;

          const totalDx = t.clientX - startX;
          const totalDy = t.clientY - startY;

          lastX = t.clientX;
          lastY = t.clientY;

          // If it's not scrollable horizontally, do nothing.
          if (!canScrollHorizontally()) return;

          // Decide gesture intent once (after a small movement threshold)
          if (!locked) {
            const threshold = 6;
            if (Math.abs(totalDx) + Math.abs(totalDy) < threshold) return;

            // Lock to horizontal mapping if gesture is mostly vertical
            // (this is what you want: normal up/down swipes drive the timeline)
            locked = true;
          }

          // Convert vertical movement into horizontal scroll.
          // dy positive means finger moved down → we scroll timeline left
          view.scrollLeft -= dy * 1.15;

          // Prevent page from scrolling vertically while interacting with the timeline
          e.preventDefault();
        },
        { passive: false }
      );
    });
  })();

  // ------------------------------------------------------------
  // Desktop / large screens: ScrollTrigger pin + translate track
  // (still ok on mobile too, but your CSS uses native scroll there)
  // ------------------------------------------------------------
  const ids = [];

  function anyActive() {
    return ids.some((id) => {
      const st = ScrollTrigger.getById(id);
      return st && st.isActive;
    });
  }

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids.length = 0;
  }

  function getViewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function getMaxX(view, track) {
    const viewW = getViewW(view);
    const trackW = Math.round(track.scrollWidth);
    return Math.max(0, trackW - viewW);
  }

  function build() {
    // avoid rebuild mid-scroll
    if (anyActive()) return false;

    killAll();
    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const id = "hpin_" + index;
      ids.push(id);

      const maxX = getMaxX(view, track);
      if (DEBUG) console.log("HPIN dims", { index, viewW: getViewW(view), trackW: track.scrollWidth, maxX });

      if (maxX < 2) return;
      builtAny = true;

      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -getMaxX(view, track),
        ease: "none",
        overwrite: true
      });

      ScrollTrigger.create({
        id,
        trigger: section,
        start: "top top",
        end: () => "+=" + getMaxX(view, track),
        pin: inner,
        pinSpacing: true,
        scrub: 1,
        anticipatePin: 3,
        invalidateOnRefresh: true,
        animation: tween
      });
    });

    ScrollTrigger.refresh();
    return builtAny;
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(() => {});
    return Promise.resolve();
  }

  function start() {
    requestAnimationFrame(() => requestAnimationFrame(build));

    // gentle retries
    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      const ok = build();
      if (ok || tries >= 6) clearInterval(retry);
    }, 250);

    // refresh on image load (not active)
    SECTIONS.forEach((section) => {
      section.querySelectorAll("img").forEach((img) => {
        img.addEventListener(
          "load",
          () => {
            if (!anyActive()) ScrollTrigger.refresh();
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => {
            if (!anyActive()) ScrollTrigger.refresh();
          },
          { once: true }
        );
      });
    });

    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => build(), 200);
    });
  }

  window.addEventListener("load", () => {
    whenFontsReady().then(() => {
      start();
    });
  });
})();
