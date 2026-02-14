// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText
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

      // If you didn't add the attribute, this still works, but won't prevent first-paint flicker.
      // We keep this as a safety net.
      heading.style.visibility = "hidden";

      const split = new SplitText(heading, { type: "lines", linesClass: "ah-line" });

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

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  // Optional manual re-init hook
  window.initAnimateHeadings = boot;
})();
