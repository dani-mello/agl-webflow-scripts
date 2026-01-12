console.log("STAGGERED HEADING (LINES) ANIMATION LOADED v4");

(function () {
  // ✅ Reduced motion support
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) return;

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined" ||
    typeof SplitText === "undefined"
  ) {
    console.warn("GSAP, ScrollTrigger or SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const headings = gsap.utils.toArray(".u-animate-heading");
  if (!headings.length) return;

  headings.forEach((heading) => {
    // Prevent double init
    if (heading.dataset.animateInit === "1") return;
    heading.dataset.animateInit = "1";

    const split = new SplitText(heading, {
      type: "lines",
      linesClass: "u-split-line"
    });

    gsap.from(split.lines, {
      yPercent: 120,
      x: -18,
      rotate: 1,
      opacity: 0,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: heading,
        start: "top 85%",
        toggleActions: "play none none none"
      }
    });
  });
})();
