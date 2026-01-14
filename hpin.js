// hpin.js
console.log(
  "%cHPIN-horizontalscroll V13 (mobile edge-release)",
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
  // Mobile helpers:
  // - Eager-load HPIN images (helps iOS first interaction)
  // - "Wake" the scroller (tiny nudge)
  // - Gesture mapping that RELEASES at edges (so page can continue)
  // ------------------------------------------------------------
  (function mobileHelpers() {
    const isMobile = window.matchMedia(MOBILE_MQ).matches;
    if (!isMobile) return;

    // Eager-load only within HPIN (prevents first-swipe weirdness)
    document.querySelectorAll(".c-hpin img").forEach((img) => {
      img.loading = "eager";
      img.decoding = "async";
    });

    // Nudge scrollers after load so iOS commits scrollability
    window.addEventListener("load", () => {
      setTimeout(() => {
        document.querySelectorAll(".c-hpin_view").forEach((view) => {
          const x = view.scrollLeft;
          view.scrollLeft = x + 1;
          view.scrollLeft = x;
        });
      }, 250);
    });

    // Smarter swipe handler
    document.querySelectorAll(".c-hpin_view").forEach((view) => {
      let startX = 0, startY = 0;
      let lastX = 0, lastY = 0;
      let mode = null; // null | "map" | "native"
      const THRESH = 8; // px

      function maxScrollLeft() {
        return Math.max(0, view.scrollWidth - view.clientWidth);
      }
      function atLeftEdge() {
        return view.scrollLeft <= 0;
      }
      function atRightEdge() {
        return view.scrollLeft >= maxScrollLeft() - 1;
      }
      function canScrollX() {
        return maxScrollLeft() > 2;
      }

      view.addEventListener(
        "touchstart",
        (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;
          startX = lastX = t.clientX;
          startY = lastY = t.clientY;
          mode = null;
        },
        { passive: true }
      );

      view.addEventListener(
        "touchmove",
        (e) => {
          const t = e.touches && e.touches[0];
          if (!t) return;

          const dxStep = t.clientX - lastX;
          const dyStep = t.clientY - lastY;

          const dxTotal = t.clientX - startX;
          const dyTotal = t.clientY - startY;

          lastX = t.clientX;
          lastY = t.clientY;

          // If it can't scroll horizontally, let the page handle everything
          if (!canScrollX()) return;

          // Decide mode after a small movement
          if (!mode) {
            if (Math.abs(dxTotal) + Math.abs(dyTotal) < THRESH) return;

            // If user is clearly swiping horizontally, let native horizontal scroll do it.
            if (Math.abs(dxTotal) > Math.abs(dyTotal)) {
              mode = "native";
              return;
            }

            // Otherwise use vertical->horizontal mapping
            mode = "map";
          }

          if (mode === "native") {
            // Native horizontal scrolling; don't block page unless it's clearly horizontal already.
            return;
          }

          // mode === "map"
          // Convert vertical finger movement into horizontal scroll.
          // Finger moves up (dy negative) -> move timeline right (increase scrollLeft)
          const desired = view.scrollLeft - dyStep * 1.15;

          // Edge release:
          // If user is trying to scroll "past" an edge, let the page scroll vertically.
          const goingLeft = desired < view.scrollLeft;   // scrollLeft decreases
          const goingRight = desired > view.scrollLeft;  // scrollLeft increases

          if ((atLeftEdge() && goingLeft) || (atRightEdge() && goingRight)) {
            // release: don't preventDefault, allow page to continue
            return;
          }

          // Consume gesture: prevent vertical page scroll while we move the strip
          view.scrollLeft = Math.max(0, Math.min(maxScrollLeft(), desired));
          e.preventDefault();
        },
        { passive: false }
      );
    });
  })();

  // ------------------------------------------------------------
  // Desktop / large screens: ScrollTrigger pin + translate track
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

    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      const ok = build();
      if (ok || tries >= 6) clearInterval(retry);
    }, 250);

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
