// animate-heading.js
// Requires GSAP + SplitText
(function () {
  const htmlEl = document.documentElement;

  if (!window.gsap || !window.SplitText) {
    htmlEl.classList.add("gsap-not-found");
    document.querySelectorAll(".u-animate-heading").forEach((el) => {
      el.style.visibility = "";
      el.style.opacity = "";
      el.style.transform = "";
    });
    return;
  }

  htmlEl.classList.remove("gsap-not-found");

  function showHeadingSafely(heading) {
    heading.style.visibility = "";
    heading.style.opacity = "";
    heading.style.transform = "";
    heading.classList.add("is-ah-ready");
  }

  function animateWords(words) {
    gsap.to(words, {
      x: 0,
      y: 0,
      rotate: 0,
      duration: 1,
      ease: "power3.out",
      stagger: 0.2,
      overwrite: true,
      clearProps: "willChange"
    });
  }

  function initOneHeading(heading) {
    if (!heading || heading.dataset.ahInit === "1") return;
    heading.dataset.ahInit = "1";

    const isHeroHeading = !!heading.closest(".c-hero");

    try {
      heading.style.visibility = "hidden";

      const split = new SplitText(heading, {
        type: "lines,words",
        linesClass: "ah-line",
        wordsClass: "ah-word"
      });

      const lines = split.lines || [];
      const words = split.words || [];

      if (!lines.length || !words.length) {
        showHeadingSafely(heading);
        return;
      }

      // Mask each line
      lines.forEach((line) => {
        if (line.parentElement && line.parentElement.classList.contains("ah-mask")) return;

        const mask = document.createElement("div");
        mask.className = "ah-mask";
        mask.style.overflow = "hidden";
        mask.style.display = "block";

        line.style.display = "block";
        line.style.willChange = "transform";

        line.parentNode.insertBefore(mask, line);
        mask.appendChild(line);
      });

      // Word setup
      gsap.set(words, {
        display: "inline-block",
        x: -30,
        y: "2em",
        rotate: 0.8,
        opacity: 1,
        willChange: "transform"
      });

      if (isHeroHeading) {
        showHeadingSafely(heading);

        gsap.to(words, {
          x: 0,
          y: 0,
          rotate: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.1,
          delay: 0.5,
          clearProps: "willChange"
        });

        return;
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;

            showHeadingSafely(heading);
            animateWords(words);
            io.unobserve(heading);
          });
        },
        {
          threshold: 0.2,
          rootMargin: "0px 0px -10% 0px"
        }
      );

      io.observe(heading);
    } catch (err) {
      console.warn("animate-heading failed:", err);
      showHeadingSafely(heading);
    }
  }

  function initAnimateHeadings() {
    const headings = document.querySelectorAll(".u-animate-heading");
    if (!headings.length) return;

    headings.forEach((heading) => initOneHeading(heading));
  }

  function boot() {
    initAnimateHeadings();
  }

  function runAfterReveal(fn) {
    if (window.__aglPageRevealed) {
      fn();
      return;
    }

    let ran = false;

    function onceRun() {
      if (ran) return;
      ran = true;
      fn();
    }

    window.addEventListener("agl:pageRevealed", onceRun, { once: true });
    setTimeout(onceRun, 1200);
  }

  function onReady() {
    runAfterReveal(boot);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onReady, { once: true });
  } else {
    onReady();
  }

  window.initAnimateHeadings = onReady;
})();
