// hpin.js
console.log(
  "%cHPIN-horizontalscroll V14 (mobile uses ScrollTrigger pin)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Optional (helps on iOS sometimes). Safe-guarded.
  if (typeof ScrollTrigger.normalizeScroll === "function") {
    ScrollTrigger.normalizeScroll(true);
  }

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  // Eager-load images inside HPIN only (prevents first-load bumps)
  document.querySelectorAll(".c-hpin img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";
  });

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
      const view  = section.querySelector(".c-hpin_view");
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
        anticipatePin: 2,
        invalidateOnRefresh: true,
        animation: tween,
        // markers: DEBUG,
      });
    });

    ScrollTrigger.refresh();
    return builtAny;
  }

  // Fonts ready helps avoid first-time text reflow inside pinned sections
  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(() => {});
    return Promise.resolve();
  }

  function start() {
    requestAnimationFrame(() => requestAnimationFrame(build));

    // A few retries while Webflow finishes layout/images
    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      const ok = build();
      if (ok || tries >= 6) clearInterval(retry);
    }, 250);

    // If images load later, refresh (but don't do it mid-pin)
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

    // Resize rebuild (debounced)
    let t = null;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => build(), 200);
    });
  }

  window.addEventListener("load", () => {
    whenFontsReady().then(start);
  });
})();
