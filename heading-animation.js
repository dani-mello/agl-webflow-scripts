

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

      // ✅ Hide immediately (also covers cases where CSS loads late)
      heading.style.visibility = "hidden";

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

      // ✅ Set the initial state BEFORE revealing
      gsap.set(split.lines, { x: -15, y: 100 });

      // ✅ Reveal only after SplitText + initial set are complete
      heading.classList.add("is-ah-ready");
      heading.style.visibility = ""; // let CSS handle it now

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
    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 150);
    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  if (document.readyState === "complete") {
    boot();
  } else {
    window.addEventListener("load", boot);
  }

  window.initAnimateHeadings = boot;
})();
