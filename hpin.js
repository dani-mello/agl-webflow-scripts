// hpin.js
console.log(
  "%cHPIN-horizontalscroll V8",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false; // set true if you want console logs

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  const ids = [];

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
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
    // kill old triggers we created
    killAll();
    ids.length = 0;

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
          maxX,
        });
      }

      if (maxX < 2) return;

      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -getMaxX(view, track),
        ease: "none",
        overwrite: true,
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
        // markers: DEBUG,
      });
    });

    ScrollTrigger.refresh();
  }

  // Build ASAP (don’t wait for images)
  requestAnimationFrame(() => requestAnimationFrame(build));

  // Retry a few times for Webflow layout settling (then stop)
  let tries = 0;
  const retry = setInterval(() => {
    tries += 1;
    build();
    if (tries >= 6) clearInterval(retry);
  }, 250);

  // Rebuild when images load (lazy-load friendly)
  SECTIONS.forEach((section) => {
    section.querySelectorAll("img").forEach((img) => {
      img.addEventListener("load", build, { once: true });
      img.addEventListener("error", build, { once: true });
    });
  });

  // Observe size changes
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => build());
    SECTIONS.forEach((section) => {
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (view) ro.observe(view);
      if (track) ro.observe(track);
    });
  }

  // Debounced resize
  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(build, 150);
  });
})();
