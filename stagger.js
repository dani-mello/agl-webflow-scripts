console.log("STAGGER v3");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.__staggerInitV3) return;
  window.__staggerInitV3 = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const start = parent.getAttribute("data-stagger-start") || "top 90%"; // ✅ per-item start
    const each = parseFloat(parent.getAttribute("data-stagger-amount") || "0.2");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "30");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.7");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "1");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "transform" });
      return;
    }

    // initial state
    gsap.set(items, { opacity: 0, scale: scaleFrom });

    // slight variance but NOT random order
    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;
      gsap.set(el, { x: signX * dist, y: signY * dist });
    });

    // ✅ Animate ONLY the items that enter the viewport (batched)
    ScrollTrigger.batch(items, {
      start,
      once: true,
      interval: 0.12, // groups items that enter close together
      batchMax: 12,   // max items per batch
      onEnter: (batch) => {
        // keep DOM order within the batch
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
    });
  }

  function initAll() {
    document.querySelectorAll(".js-stagger").forEach((parent) => {
      if (parent.dataset.staggerInit === "1") return;
      parent.dataset.staggerInit = "1";
      initStagger(parent);
    });
  }

  initAll();
})();
