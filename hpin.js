// hpin.js
console.log(
  "%cHPIN-horizontalscroll V9 (stable)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  const ids = [];

  function getViewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function getMaxX(view, track) {
    const viewW = getViewW(view);
    const trackW = Math.round(track.scrollWidth);
    return Math.max(0, trackW - viewW);
  }

  function anyActive() {
    // If any of our ScrollTriggers are active, avoid rebuilding/refreshing aggressively
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

  function build() {
    // Don’t rebuild while user is inside the pinned section
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

      if (DEBUG) {
        console.log("HPIN dims", {
          index,
          viewW: getViewW(view),
          trackW: Math.round(track.scrollWidth),
          maxX
        });
      }

      if (maxX < 2) return;

      builtAny = true;

      // IMPORTANT: only set x to 0 when building fresh,
      // not during active scroll (guard above handles that)
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
        anticipatePin: 2, // helps reduce the “first pin frame” jerk
        animation: tween,
        invalidateOnRefresh: true
      });
    });

    ScrollTrigger.refresh();
    return builtAny;
  }

  // Build once after layout settles
  requestAnimationFrame(() => requestAnimationFrame(build));

  // Retry a few times UNTIL it successfully builds, then stop
  let tries = 0;
  const retry = setInterval(() => {
    tries += 1;
    const ok = build();
    if (ok || tries >= 8) clearInterval(retry);
  }, 250);

  // Lazy images: refresh only (don’t rebuild)
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

  // ResizeObserver: refresh only (debounced) and only when not active
  if ("ResizeObserver" in window) {
    let roT = null;
    const ro = new ResizeObserver(() => {
      if (anyActive()) return;
      clearTimeout(roT);
      roT = setTimeout(() => ScrollTrigger.refresh(), 100);
    });

    SECTIONS.forEach((section) => {
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (view) ro.observe(view);
      if (track) ro.observe(track);
    });
  }

  // Debounced window resize: rebuild (not just refresh) because widths change a lot
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => build(), 200);
  });
})();
