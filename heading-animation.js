// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText
(function () {
  const htmlEl = document.documentElement;

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    htmlEl.classList.add("gsap-not-found");
    return;
  }

  htmlEl.classList.remove("gsap-not-found");

  gsap.registerPlugin(ScrollTrigger, SplitText);

  function initAnimateHeadings() {
    const headings = document.querySelectorAll(".u-animate-heading");
    if (!headings.length) return;

    headings.forEach((heading, index) => {
      if (heading.dataset.ahInit === "1") return;
      heading.dataset.ahInit = "1";

      const isHeroHeading = !!heading.closest(".c-hero");

      heading.style.visibility = "hidden";

      const split = new SplitText(heading, {
        type: "lines",
        linesClass: "ah-line"
      });

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

      heading.classList.add("is-ah-ready");
      heading.style.visibility = "";

      if (isHeroHeading) {
        gsap.to(split.lines, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.3,
          delay: 1.6
        });
      } else {
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
      }
    });
  }

  function boot() {
    initAnimateHeadings();

    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 150);
    setTimeout(() => ScrollTrigger.refresh(), 400);
  }

  function runAfterReveal(fn) {
    if (window.__aglPageRevealed) return fn();

    let fallbackRan = false;

    const fallback = () => {
      if (fallbackRan) return;
      fallbackRan = true;
      fn();
    };

    window.addEventListener(
      "agl:pageRevealed",
      () => {
        fallbackRan = true;
        fn();
      },
      { once: true }
    );

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

  window.initAnimateHeadings = onReady;
})();
