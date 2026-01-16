console.log("STAGGER v1");

(() => {
  // Requires GSAP + ScrollTrigger
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  // Prevent double init (Webflow interactions / page transitions / etc.)
  if (window.__staggerInitV1) return;
  window.__staggerInitV1 = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function getGridInfo(parent, items) {
    // Use item centers to infer "rows/cols-ish" without relying on DOM order
    const rects = items.map((el) => {
      const r = el.getBoundingClientRect();
      return { el, cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    });

    const cxs = rects.map(r => r.cx).sort((a,b)=>a-b);
    const cys = rects.map(r => r.cy).sort((a,b)=>a-b);

    const mid = (arr) => arr[Math.floor(arr.length / 2)] || 0;

    return {
      rects,
      centerX: mid(cxs),
      centerY: mid(cys),
    };
  }

  function orderItems(parent, items, mode) {
    const { rects, centerX, centerY } = getGridInfo(parent, items);

    if (mode === "random") {
      // stable-ish shuffle (so it doesn't change every refresh)
      let seed = 0;
      const id = parent.getAttribute("data-stagger-seed") || parent.className || "stagger";
      for (let i = 0; i < id.length; i++) seed = (seed * 31 + id.charCodeAt(i)) >>> 0;

      return rects
        .map((r, idx) => ({ ...r, idx, rnd: (Math.sin(seed + idx) + 1) / 2 }))
        .sort((a, b) => a.rnd - b.rnd)
        .map(r => r.el);
    }

    if (mode === "center") {
      return rects
        .map(r => ({ ...r, d: Math.hypot(r.cx - centerX, r.cy - centerY) }))
        .sort((a, b) => a.d - b.d)
        .map(r => r.el);
    }

    if (mode === "cols") {
      // left-to-right columns, then top-to-bottom
      return rects
        .sort((a, b) => (a.cx - b.cx) || (a.cy - b.cy))
        .map(r => r.el);
    }

    // default: rows (top-to-bottom, then left-to-right)
    return rects
      .sort((a, b) => (a.cy - b.cy) || (a.cx - b.cx))
      .map(r => r.el);
  }

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const mode = (parent.getAttribute("data-stagger") || "rows").toLowerCase();
    const amount = parseFloat(parent.getAttribute("data-stagger-amount") || "0.25");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "18");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.98");

    const ordered = orderItems(parent, items, mode);

    // Reduced motion: just appear
    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "transform" });
      return;
    }

    // Set initial state (subtle “non-linear” feel via x/y variance)
    gsap.set(items, { opacity: 0, scale: scaleFrom });

    // Give each item a slightly different offset direction
    ordered.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;
      gsap.set(el, { x: signX * dist, y: signY * dist });
    });

    // Animate when parent enters view
    ScrollTrigger.create({
      trigger: parent,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(ordered, {
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
          stagger: { each: amount },
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

