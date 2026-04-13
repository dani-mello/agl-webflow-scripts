console.log("STAGGER v6");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.__staggerInitV6) return;
  window.__staggerInitV6 = true;

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

    const start = parent.getAttribute("data-stagger-start") || "top 88%";
    const each = parseFloat(parent.getAttribute("data-stagger-amount") || "0.1");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "30");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.7");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "1");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "all" });
      return;
    }

    gsap.set(items, {
      opacity: 0,
      scale: scaleFrom
    });

    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;

      gsap.set(el, {
        x: signX * dist,
        y: signY * dist
      });
    });

    ScrollTrigger.batch(items, {
      start,
      once: true,
      interval: 0.1,
      batchMax: 3,
      invalidateOnRefresh: true,
      onEnter: (batch) => {
        batch.sort((a, b) => items.indexOf(a) - items.indexOf(b));

        gsap.to(batch, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          ease,
          stagger: { each },
          overwrite: true,
          clearProps: "transform"
        });
      }
      // markers: true
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
