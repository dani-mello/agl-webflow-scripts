console.log("HEADING ANIMATION LOADED");

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const headings = document.querySelectorAll(".u-animate-heading");
  if (!headings.length) return;

  headings.forEach((heading, i) => {
    // prevent double init
    if (heading.dataset.animateInit === "1") return;
    heading.dataset.animateInit = "1";

    gsap.fromTo(
      heading,
      {
        yPercent: 120,
        x: -18,
        rotate: 1.2,
        opacity: 0
      },
      {
        yPercent: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: heading,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  });
})();
