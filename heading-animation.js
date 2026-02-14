// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText
// Updated: waits for pagewipe reveal event ("agl:pageRevealed") before init,
// so the FIRST heading animation starts after the loading transition.
(function () {
  const htmlEl = document.documentElement;

  // If GSAP isn't available, ensure content is visible
  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    htmlEl.classList.add("gsap-not-found");
    return;
  }

  // GSAP exists, make sure we are NOT in "not found" mode
  htmlEl.classList.remove("gsap-not-found");

  gsap.registerPlugin(ScrollTrigger, SplitText);

  function initAnimateHeadings() {
    const headings = document.querySelectorAll(".u-animate-heading");
    if (!headings.length) return;

    headings.forEach((heading, index) => {
      if (heading.dataset.ahInit === "1") return;
      heading.dataset.ahInit = "1";

      // Safety net to prevent first-paint flicker
      heading.style.visibility = "hidden";

      const split = new SplitText(heading, {
        type: "lines",
        linesClass: "ah-line"
      });

      // Wrap each line in a mask
      split.lines.forEach((line) => {
        const mask = document.createElement("div");
        mask.style.overflow = "hidden";
        mask.style.display = "block";

        line.style.display = "block";
        line.style.willChange = "transform";

        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });

      // Initial state
      gsap.set(split.lines, { x: -15, y: 100 });

      // Mark ready → CSS will reveal it (and we also clear inline hide)
      heading.classList.add("is-ah-ready");
      heading.style.visibility = "";

      gsap.to(split.lines, {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.3,
        scrollTrigger: {
          id: `animateHeading-${index}`,
          trigger: heading,
          start: "top 85%",
          once: true,
          invalidateOnRefresh: true,
          refreshPriority: -10
        }
      });
    });
  }

  function boot() {
    initAnimateHeadings();

    // Refresh passes (helpful if fonts/layout shift)
    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 150);
    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  // Run after pagewipe reveal (or immediately if already revealed / no pagewipe)
  function runAfterReveal(fn) {
    if (window.__aglPageRevealed) return fn();

    // If pagewipe isn't installed, __aglPageRevealed may never be set,
    // so fall back to DOM readiness.
    let fallbackRan = false;
    const fallback = () => {
      if (fallbackRan) return;
      fallbackRan = true;
      fn();
    };

    window.addEventListener("agl:pageRevealed", () => {
      fallbackRan = true; // prevent fallback double-run
      fn();
    }, { once: true });

    // Fallback: if no reveal event fires within a moment, run anyway.
    setTimeout(fallback, 1200);
  }

  function onReady() {
    runAfterReveal(boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady);
  } else {
    onReady();
  }

  // Optional manual re-init hook (still respects reveal timing)
  window.initAnimateHeadings = onReady;
})();
