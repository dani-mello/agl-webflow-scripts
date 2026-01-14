// hpin.js
console.log(
  "%cHPIN-horizontalscroll V17 (first-load + bfcache reliable)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;
  const MOBILE_MQ = "(max-width: 900px)";
  const isMobile = window.matchMedia && window.matchMedia(MOBILE_MQ).matches;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Prevent double init (Webflow designer / embeds can run twice)
  if (window.__HPIN_INIT__ === true) return;
  window.__HPIN_INIT__ = true;

  const SECTIONS = Array.from(document.querySelectorAll(".c-hpin"));
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  // Eager load HPIN images only
  document.querySelectorAll(".c-hpin img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";
  });

  const ids = [];

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids.length = 0;
  }

  function viewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function maxX(view, track) {
    return Math.max(0, Math.round(track.scrollWidth) - viewW(view));
  }

  function build() {
    killAll();
    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const mx = maxX(view, track);
      if (DEBUG) console.log("HPIN dims", { index, viewW: viewW(view), trackW: track.scrollWidth, maxX: mx });

      if (mx < 2) return;
      builtAny = true;

      const id = "hpin_" + index;
      ids.push(id);

      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -maxX(view, track),
        ease: "none",
        overwrite: true
      });

      const scrollDistance = () => {
        const base = maxX(view, track);
        const factor = isMobile ? 1.8 : 1; // smoother on mobile
        return Math.round(base * factor);
      };

      ScrollTrigger.create({
        id,
        trigger: section,
        start: "top top",
        end: () => "+=" + scrollDistance(),
        pin: inner,
        pinSpacing: true,
        scrub: isMobile ? 1.2 : 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tween,
        fastScrollEnd: true
      });
    });

    ScrollTrigger.refresh(true);
    return builtAny;
  }

  function fontsReady() {
    if (document.fonts && document.fonts.ready) {
      return document.fonts.ready.catch(() => {});
    }
    return Promise.resolve();
  }

  // Wait for images AND decode (decode stabilizes layout on first load)
  function imagesDecoded(container) {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();

    return Promise.all(
      imgs.map((img) => {
        const loaded = img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            });

        return loaded.then(() => (img.decode ? img.decode().catch(() => {}) : undefined));
      })
    );
  }

  // Webflow can finish layout after load (components, IX, etc.)
  // Do a few scheduled rebuilds in the "settle window"
  function settleRebuilds() {
    [150, 350, 700, 1200].forEach((ms) => setTimeout(build, ms));
  }

  function start() {
    // initial build
    requestAnimationFrame(() => requestAnimationFrame(build));

    // settle window rebuilds
    settleRebuilds();

    // Desktop: rebuild on resize (debounced)
    if (!isMobile) {
      let t = null;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(build, 200);
      });
    } else {
      // Mobile: rebuild on orientation change only
      window.addEventListener("orientationchange", () => setTimeout(build, 450));
    }
  }

  // 1) Normal first load path
  window.addEventListener("load", () => {
    Promise.all([fontsReady(), ...SECTIONS.map(imagesDecoded)]).then(() => {
      start();
    });
  });

  // 2) bfcache path (Safari/Chrome often restore page w/out full reload)
  window.addEventListener("pageshow", (e) => {
    // Always rebuild once on pageshow; if it was restored from cache, do a settle window too.
    requestAnimationFrame(() => requestAnimationFrame(build));
    if (e.persisted) settleRebuilds();
  });
})();
