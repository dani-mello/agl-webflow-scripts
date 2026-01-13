// hpin.js
console.log(
  "%cHPIN-horizontalscroll V10 (fonts-ready + stable pin)",
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

      if (DEBUG) {
        console.log("HPIN dims", {
          index,
          viewW: getViewW(view),
          trackW: Math.round(track.scrollWidth),
          maxX,
        });
      }

      if (maxX < 2) return;
      builtAny = true;

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
        anticipatePin: 3,        // helps “first frame” bump
        invalidateOnRefresh: true,
        animation: tween,
        // markers: DEBUG,
      });
    });

    ScrollTrigger.refresh();
    return builtAny;
  }

  // Wait for fonts if possible (prevents first-scroll clip from font swap)
  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(() => {});
    return Promise.resolve();
  }

  function start() {
    // Build after layout is settled
    requestAnimationFrame(() => requestAnimationFrame(build));

    // A couple gentle retries, stop as soon as it builds successfully
    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      const ok = build();
      if (ok || tries >= 6) clearInterval(retry);
    }, 250);

    // Lazy images: refresh only (and only when not active)
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

    // Resize: rebuild (debounced), but don’t rebuild mid-scroll
    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => build(), 200);
    });
  }

  // Start after full load + fonts (prevents first-interaction bump)
  window.addEventListener("load", () => {
    whenFontsReady().then(() => {
      start();
    });
  });
})();
