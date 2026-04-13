console.log("STAGGER v7");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.__staggerInitV7) return;
  window.__staggerInitV7 = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hasHero() {
    return !!document.querySelector(".c-hero");
  }

  function layoutReady() {
    const hpinReady = !!window.__HPIN_READY__;
    const heroReady = !hasHero() || !!window.__HERO_READY__;
    return hpinReady && heroReady;
  }

  function waitForLayout(cb) {
    if (layoutReady()) {
      cb();
      return;
    }
    requestAnimationFrame(() => waitForLayout(cb));
  }

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const start = parent.getAttribute("data-stagger-start") || "top 100%";
    const each = parseFloat(parent.getAttribute("data-stagger-amount") || "0.1");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "30");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.7");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "1");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "all" });
      return;
    }

    const animated = [];

    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;

      gsap.set(el, {
        opacity: 0,
        scale: scaleFrom,
        x: signX * dist,
        y: signY * dist
      });

      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          animated.push(el);

          gsap.to(el, {
            opacity: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration,
            ease,
            delay: animated.length > 1 ? each * 0.15 : 0,
            overwrite: true,
            clearProps: "transform"
          });
        }
        // markers: true
      });
    });
  }

  function initAll() {
    document.querySelectorAll(".js-stagger").forEach((parent) => {
      if (parent.dataset.staggerInit === "1") return;
      parent.dataset.staggerInit = "1";
      initStagger(parent);
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
  }

  waitForLayout(() => {
    initAll();
  });

  window.addEventListener("load", () => {
    waitForLayout(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  });
})();
