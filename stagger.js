console.log("STAGGER v2");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  // Prevent double init
  if (window.__staggerInitV2) return;
  window.__staggerInitV2 = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function initStagger(parent) {
    // ✅ DOM order: first to last
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    // Controls (optional)
    const start = parent.getAttribute("data-stagger-start") || "top 85%"; // when wrapper enters view
    const amount = parseFloat(parent.getAttribute("data-stagger-amount") || "0.12");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "18");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.98");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "0.7");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "transform" });
      return;
    }

    // Initial state (hidden + slight offset)
    gsap.set(items, { opacity: 0, scale: scaleFrom });

    // Optional: add a tiny “non-linear” feel but keep ORDER linear
    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;
      gsap.set(el, { x: signX * dist, y: signY * dist });
    });

    // ✅ Only animate when in view (and only once)
    ScrollTrigger.create({
      trigger: parent,
      start,
      once: true,
      onEnter: () => {
        gsap.to(items, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration,
          ease,
          stagger: { each: amount }, // first → last
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
