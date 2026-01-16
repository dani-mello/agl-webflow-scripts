

(function () {
  const DEBUG = false;
  const MOBILE_MQ = "(max-width: 900px)";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  if (window.__HPIN_INIT__ === true) return;
  window.__HPIN_INIT__ = true;

  const mm = window.matchMedia ? window.matchMedia(MOBILE_MQ) : null;
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isMobileNow() {
    return !!(mm && mm.matches);
  }

  const SECTIONS = Array.from(document.querySelectorAll(".c-hpin"));
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  let ids = [];
  let ro = null;
  let building = false;
  let lastBuildAt = 0;

  function viewW(view) {
    return Math.round(view.clientWidth || view.offsetWidth || 0);
  }

  function maxX(view, track) {
    return Math.max(0, Math.ceil(track.scrollWidth - viewW(view)));
  }

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids = [];

    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith("hpin_")) st.kill(true);
    });
  }

  function softBuild(delayMs) {
    clearTimeout(window.__hpin_softBuild_t);
    window.__hpin_softBuild_t = setTimeout(build, delayMs || 0);
  }

  function build() {
    if (building) return;
    const now = Date.now();
    if (now - lastBuildAt < 40) return;

    building = true;
    lastBuildAt = now;

    const mobile = isMobileNow();
    if (DEBUG) console.log("HPIN build: mobile =", mobile);

    killAll();

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const mx = maxX(view, track);
      if (mx < 2) return;

      const id = "hpin_" + index;
      ids.push(id);

      // HARD reset so we never "start" looking at empty space
      gsap.set(track, { x: 0, clearProps: "transform" });
      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -maxX(view, track),
        ease: "none",
        overwrite: true,
        immediateRender: false // ✅ prevents early render during refresh
      });

      const scrollDistance = () => {
        const base = maxX(view, track);
        const factor = mobile ? 1.8 : 1;
        return Math.round(base * factor);
      };

      ScrollTrigger.create({
        id,
        trigger: section,
        start: mobile ? "top top" : "top+=1 top",
        end: () => "+=" + scrollDistance(),

        pin: inner,

        // ✅ Desktop stabilizer, but OFF on mobile (mobile layout is auto-height)
        pinReparent: !mobile,

        pinSpacing: true,

        scrub: prefersReduced ? false : mobile ? 1.2 : 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tween,
        fastScrollEnd: true,

        // ✅ Ensure track is reset before any measuring/refresh happens
        onRefreshInit: () => {
          gsap.set(track, { x: 0 });
        }

        // DEBUG:
        // ,markers: true
      });
    });

    ScrollTrigger.refresh(true);

    building = false;
  }

  // Watch ALL images because anything above HPIN can shift starts
  function hookImages() {
    const imgs = document.querySelectorAll("img");

    imgs.forEach((img) => {
      const refresh = () => softBuild(0);

      try {
        img.loading = "eager";
        img.decoding = "async";
      } catch (e) {}

      if (img.complete) return;

      img.addEventListener(
        "load",
        () => {
          if (img.decode) img.decode().catch(() => {}).finally(refresh);
          else refresh();
        },
        { once: true }
      );

      img.addEventListener("error", refresh, { once: true });
    });
  }

  function hookFonts() {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => softBuild(0));
    }
  }

  function hookWindowLoad() {
    window.addEventListener(
      "load",
      () => softBuild(0),
      { once: true }
    );
  }

  function hookWebflowReady() {
    if (window.Webflow?.ready) {
      Webflow.ready(() => softBuild(0));
    }
  }

  function hookResizeObserver() {
    if (typeof ResizeObserver === "undefined") return;

    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => {
      softBuild(80);
    });

    SECTIONS.forEach((section) => {
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (view) ro.observe(view);
      if (track) ro.observe(track);
      ro.observe(section);
    });
  }

  function hookResize() {
    let t = null;

    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => softBuild(0), 150);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => softBuild(0), 300);
    });

    if (mm && mm.addEventListener) mm.addEventListener("change", () => softBuild(0));
    else if (mm && mm.addListener) mm.addListener(() => softBuild(0));
  }

  function hookBFCache() {
    window.addEventListener("pageshow", (e) => {
      softBuild(0);
    });
  }

  function start() {
    requestAnimationFrame(() => requestAnimationFrame(build));
    [120, 300, 650, 1100].forEach((ms) => setTimeout(() => softBuild(0), ms));

    hookImages();
    hookFonts();
    hookWindowLoad();
    hookWebflowReady();
    hookResizeObserver();
    hookResize();
    hookBFCache();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
