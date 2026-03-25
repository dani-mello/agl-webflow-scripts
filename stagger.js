console.log("STAGGER v4");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.__staggerInitV4) return;
  window.__staggerInitV4 = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function waitForHPin(cb) {
    if (window.__HPIN_READY__) {
      cb();
      return;
    }
    requestAnimationFrame(() => waitForHPin(cb));
  }

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const start = parent.getAttribute("data-stagger-start") || "top 70%";
    const each = parseFloat(parent.getAttribute("data-stagger-amount") || "0.1");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "30");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.7");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "1");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "all" });
      return;
    }

    gsap.set(items, { opacity: 0, scale: scaleFrom });

    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;
      gsap.set(el, { x: signX * dist, y: signY * dist });
    });

    const tween = gsap.to(items, {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration,
      ease,
      stagger: { each },
      paused: true,
      overwrite: true,
      clearProps: "transform"
    });

    ScrollTrigger.create({
      trigger: parent,
      start,
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => tween.play()
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

  waitForHPin(() => {
    initAll();
  });

  window.addEventListener("load", () => {
    waitForHPin(() => {
      ScrollTrigger.sort();
      ScrollTrigger.refresh();
    });
  });
})();
