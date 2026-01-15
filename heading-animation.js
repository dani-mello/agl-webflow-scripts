console.log("STAGGERED HEADING (LINES) ANIMATION LOADED v3 - NEW");

// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText
(function () {
  console.log("u-animate-heading INIT");

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    console.warn("GSAP / ScrollTrigger / SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  function initAnimateHeadings() {
    const headings = document.querySelectorAll(".u-animate-heading");
    if (!headings.length) return;

    headings.forEach((heading, index) => {
      if (heading.dataset.ahInit === "1") return;
      heading.dataset.ahInit = "1";

      const split = new SplitText(heading, { type: "lines", linesClass: "ah-line" });

      // Wrap each line in a mask (inline styles only)
      split.lines.forEach((line) => {
        const mask = document.createElement("div");
        mask.style.overflow = "hidden";
        mask.style.display = "block";

        line.style.display = "block";
        line.style.willChange = "transform";

        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });

      gsap.set(split.lines, { x: -15, y: 100 });

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
          refreshPriority: -10 // ✅ refresh later (after pins)
        }
      });
    });
  }

  // ✅ Delay init so pinned sections + images settle first
  function boot() {
    initAnimateHeadings();

    // ✅ Force refresh passes (pins often need this)
    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 150);
    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot);
  }

  // Optional hook for Barba / Webflow re-render flows
  window.initAnimateHeadings = boot;
})();
