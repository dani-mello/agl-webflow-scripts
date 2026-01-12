console.log("STAGGERED HEADING ANIMATION LOADED v3");

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const headings = gsap.utils.toArray(".u-animate-heading");
  if (!headings.length) return;

  // Group headings by their nearest section
  const groups = new Map();

  headings.forEach((el) => {
    const section = el.closest("section") || document.body;
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(el);
  });

  groups.forEach((group) => {
    // prevent double init per element
    group.forEach((el) => {
      if (el.dataset.animateInit === "1") return;
      el.dataset.animateInit = "1";
    });

    gsap.fromTo(
      group,
      {
        yPercent: 120,
        x: -50,
        rotate: 1.5,
        opacity: 0
      },
      {
        yPercent: 0,
        x: 0,
        rotate: 0,
        opacity: 1,
        duration: 0.7,
        ease: "expo.out",
        stagger: 0.2,
        scrollTrigger: {
          trigger: group[0],
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );
  });
})();
