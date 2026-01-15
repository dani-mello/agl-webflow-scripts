console.log("STAGGERED HEADING (LINES) ANIMATION LOADED v1 - NEW");

// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText loaded BEFORE this script.
(function () {
  console.log("ANIMATE HEADING (u-animate-heading) LOADED (V1)");

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }
  if (typeof SplitText === "undefined") {
    console.warn("SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const SELECTOR = ".u-animate-heading";
  const ST_ID_PREFIX = "animateHeading";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Kill only our triggers (safe on re-init)
  function killOurTriggers() {
    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith(ST_ID_PREFIX)) st.kill();
    });
  }

  // Utility: wrap node with wrapper element
  function wrap(node, wrapper) {
    node.parentNode.insertBefore(wrapper, node);
    wrapper.appendChild(node);
    return wrapper;
  }

  function initHeading(el, index) {
    // prevent double init per element
    if (el.dataset.animateHeadingInit === "1") return;
    el.dataset.animateHeadingInit = "1";

    // If reduced motion: just ensure visible
    if (prefersReduced) {
      gsap.set(el, { clearProps: "all" });
      return;
    }

    // Split into lines
    const split = new SplitText(el, { type: "lines", linesClass: "u-ah_line" });

    // Build mask wrappers: .u-ah_mask > (line element)
    const masks = [];
    split.lines.forEach((line) => {
      const mask = document.createElement("div");
      mask.className = "u-ah_mask";
      masks.push(wrap(line, mask));
    });

    // Mask styling (inline so it works anywhere)
    masks.forEach((m) => {
      m.style.overflow = "hidden";
      m.style.display = "block";
    });

    // Make each line animatable as a block
    split.lines.forEach((line) => {
      line.style.display = "block";
      line.style.willChange = "transform";
    });

    // Start state
    gsap.set(split.lines, { x: -15, y: 100, opacity: 1 });

    // Animate on scroll
    const tl = gsap.timeline({
      defaults: { duration: 0.8, ease: "power3.out" },
      scrollTrigger: {
        id: `${ST_ID_PREFIX}-${index}`,
        trigger: el,
        start: "top 82%",
        toggleActions: "play none none none", // once
        invalidateOnRefresh: true
      }
    });

    tl.to(split.lines, {
      x: 0,
      y: 0,
      stagger: 0.3 // 300ms per line
    });

    // Re-split cleanly on refresh (font load / resize)
    ScrollTrigger.addEventListener("refreshInit", () => {
      // revert only if this element exists and was split
      try {
        split.revert();
      } catch (e) {}
    });
  }

  function initAll() {
    killOurTriggers();

    const els = Array.from(document.querySelectorAll(SELECTOR));
    if (!els.length) return;

    els.forEach(initHeading);

    // Build triggers after layout settles
    ScrollTrigger.refresh();
  }

  // Init
  initAll();

  // Optional: if you use Barba / Webflow interactions that re-render, expose a hook:
  window.initAnimateHeadings = initAll;
})();
