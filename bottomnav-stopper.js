// bottomnav-stopper.js
(() => {
  if (window.__bottomNavStopInit) return;
  window.__bottomNavStopInit = true;

  const SEL = {
    nav: '[data-bottomnav="nav"]',
    stop: '[data-bottomnav="stop"]',
    move: '[data-bottomnav="move"], .js-bottomnav-move'
  };

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  }

  function onWebflowReady(fn) {
    window.Webflow ||= [];
    window.Webflow.push(fn);
  }

  function numAttr(el, name, fallback = 0) {
    const v = el.getAttribute(name);
    if (v == null || v === "") return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }

  function tryInitAll(attempt = 0) {
    // wait for GSAP + ScrollTrigger (and Webflow DOM)
    if (!window.gsap || !window.ScrollTrigger) {
      if (attempt < 40) setTimeout(() => tryInitAll(attempt + 1), 50); // ~2s max
      return;
    }

    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    const navs = document.querySelectorAll(SEL.nav);
    const stopEl = document.querySelector(SEL.stop);
    if (!navs.length || !stopEl) return;

    navs.forEach((nav) => {
      if (nav.dataset.bottomnavStopInit === "1") return;
      nav.dataset.bottomnavStopInit = "1";

      const mover = nav.querySelector(SEL.move);
      if (!mover) return;

      const offset = numAttr(nav, "data-bottomnav-offset", 0);
      const extraRefreshDelay = numAttr(nav, "data-bottomnav-refresh", 250);

      gsap.set(mover, { willChange: "transform" });

      ScrollTrigger.create({
        trigger: stopEl,
        start: "top bottom",
        end: "bottom top",
        invalidateOnRefresh: true,
        onUpdate(self) {
          const past = self.scroll() - (self.start - offset);
          gsap.set(mover, { y: past > 0 ? -past : 0 });
        },
        onLeaveBack() {
          gsap.set(mover, { y: 0 });
        }
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
      setTimeout(() => ScrollTrigger.refresh(), extraRefreshDelay);
    });

    window.addEventListener("resize", () => ScrollTrigger.refresh());
  }

  onReady(() => onWebflowReady(() => tryInitAll(0)));
})();
