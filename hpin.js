console.log(
  "%cHPIN-horizontalscroll V7 (no image blocking)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  function killById(id) {
    const st = ScrollTrigger.getById(id);
    if (st) st.kill(true);
  }

  function getViewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function getMaxX(view, track) {
    const viewW = getViewW(view);
    const trackW = Math.round(track.scrollWidth);
    return Math.max(0, trackW - viewW);
  }

  function initOne(section, index) {
    const inner = section.querySelector(".c-hpin_inner");
    const view = section.querySelector(".c-hpin_view");
    const track = section.querySelector(".c-hpin_track");
    if (!inner || !view || !track) {
      console.warn("HPIN: missing inner/view/track", { inner, view, track });
      return;
    }

    // Kill previous trigger
    const id = "hpin_" + index;
    killById(id);

    // Measure
    const maxX = getMaxX(view, track);

    console.log("HPIN dims", {
      index,
      viewW: getViewW(view),
      trackW: Math.round(track.scrollWidth),
      maxX
    });

    // If not scrollable yet, skip (we’ll retry)
    if (maxX < 2) return;

    // Reset transform before building
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
      anticipatePin: 1,
      animation: tween,
      invalidateOnRefresh: true,
      // markers: true, // uncomment to debug visually
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  // 1) Init ASAP (don’t wait for images)
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      initAll();
    });
  });

  // 2) Retry a few times (Webflow layout can settle late)
  let tries = 0;
  const retry = setInterval(() => {
    tries += 1;
    initAll();
    if (tries >= 10) clearInterval(retry);
  }, 250);

  // 3) Refresh when any image in the section loads (lazy-load friendly)
  SECTIONS.forEach((section) => {
    section.querySelectorAll("img").forEach((img) => {
      img.addEventListener(
        "load",
        () => {
          initAll();
        },
        { once: true }
      );
      img.addEventListener(
        "error",
        () => {
          initAll();
        },
        { once: true }
      );
    });
  });

  // 4) Observe size changes (CMS edits, font swaps, responsive changes)
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => initAll());
    SECTIONS.forEach((section) => {
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (view) ro.observe(view);
      if (track) ro.observe(track);
    });
  }

  // 5) Debounced resize refresh
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => initAll(), 150);
  });
})();
