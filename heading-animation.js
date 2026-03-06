// animate-heading.js
// Requires GSAP + ScrollTrigger + SplitText
(function () {
  const htmlEl = document.documentElement;

  if (!window.gsap || !window.ScrollTrigger || !window.SplitText) {
    htmlEl.classList.add("gsap-not-found");
    document.querySelectorAll(".u-animate-heading").forEach((el) => {
      el.style.visibility = "";
      el.style.opacity = "";
      el.style.transform = "";
    });
    return;
  }

  htmlEl.classList.remove("gsap-not-found");

  gsap.registerPlugin(ScrollTrigger, SplitText);

  function showHeadingSafely(heading) {
    heading.style.visibility = "";
    heading.style.opacity = "";
    heading.style.transform = "";
    heading.classList.add("is-ah-ready");
  }

  function initOneHeading(heading, index) {
    if (!heading || heading.dataset.ahInit === "1") return;
    heading.dataset.ahInit = "1";

    const isHeroHeading = !!heading.closest(".c-hero");

    try {
      heading.style.visibility = "hidden";

      const split = new SplitText(heading, {
        type: "lines",
        linesClass: "ah-line"
      });

      if (!split.lines || !split.lines.length) {
        showHeadingSafely(heading);
        return;
      }

      split.lines.forEach((line) => {
        const mask = document.createElement("div");
        mask.className = "ah-mask";
        mask.style.overflow = "hidden";
        mask.style.display = "block";

        line.style.display = "block";
        line.style.willChange = "transform";

        if (line.parentNode) {
          line.parentNode.insertBefore(mask, line);
          mask.appendChild(line);
        }
      });

      gsap.set(split.lines, { x: -15, y: 100 });

      if (isHeroHeading) {
        showHeadingSafely(heading);

        gsap.to(split.lines, {
          x: 0,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.3,
          delay: 1.6
        });
      } else {
        ScrollTrigger.create({
          id: `animateHeading-${index}`,
          trigger: heading,
          start: "top 85%",
          once: true,
          invalidateOnRefresh: true,
          refreshPriority: -10,
          onEnter: () => {
            showHeadingSafely(heading);

            gsap.to(split.lines, {
              x: 0,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
              stagger: 0.3,
              overwrite: true
            });
          }
        });
      }
    } catch (err) {
      console.warn("animate-heading failed:", err);
      showHeadingSafely(heading);
    }
  }

  function initAnimateHeadings() {
    const headings = document.querySelectorAll(".u-animate-heading");
    if (!headings.length) return;

    headings.forEach((heading, index) => {
      initOneHeading(heading, index);
    });
  }

  function boot() {
    initAnimateHeadings();

    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 150);
    setTimeout(() => ScrollTrigger.refresh(), 400);
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
