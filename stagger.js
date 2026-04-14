console.log("STAGGER v11");

(() => {
  if (typeof gsap === "undefined") return;

  if (window.__staggerInitV11) return;
  window.__staggerInitV11 = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const threshold = parseFloat(parent.getAttribute("data-stagger-threshold") || "0.2");
    const rootMargin = parent.getAttribute("data-stagger-rootmargin") || "0px 0px -8% 0px";
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

    const queue = [];
    let ticking = false;

    function flushQueue() {
      if (!queue.length) {
        ticking = false;
        return;
      }

      const batch = queue.splice(0, queue.length);

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

      ticking = false;
    }

    function queueItem(el) {
      if (el.dataset.staggerShown === "1") return;
      el.dataset.staggerShown = "1";
      queue.push(el);

      if (ticking) return;
      ticking = true;

      requestAnimationFrame(flushQueue);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          queueItem(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        root: null,
        rootMargin,
        threshold
      }
    );

    items.forEach((el) => observer.observe(el));
  }

  function initAll() {
    document.querySelectorAll(".js-stagger").forEach((parent) => {
      if (parent.dataset.staggerInit === "1") return;
      parent.dataset.staggerInit = "1";
      initStagger(parent);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }
})();
