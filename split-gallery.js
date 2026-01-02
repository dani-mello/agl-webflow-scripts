gsap.registerPlugin(ScrollTrigger);

(function () {

  function initAll() {
    const sections = document.querySelectorAll(".c-split-gallery");
    if (!sections.length) return;

    sections.forEach((section, index) => {
      if (section.dataset.sgInit === "1") return;
      section.dataset.sgInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      const slides = [...section.querySelectorAll(".c-split-gallery_slide")];
      const images = [...section.querySelectorAll(".c-split-gallery_image")];

      if (!mask || !track || !slides.length) return;

      const galleryW = mask.clientWidth;
      const galleryH = window.innerHeight;

      // Tunables (stable)
      const MIN_SCALE = 0.6;
      const FALLOFF   = 0.6;
      const EPS       = 0.5;

      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const CARD_H = 60 * rootFont; // visual size, not layout height

      // Prep slides
      slides.forEach(slide => {
        gsap.set(slide, {
          position: "absolute",
          left: 0,
          width: galleryW,
          height: CARD_H,
          overflow: "hidden",
          transformOrigin: "right top",
          willChange: "transform, top"
        });
      });

      gsap.set(images, {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });

      function layout() {
        const centerY = window.innerHeight / 2;
        let y = 0;

        slides.forEach(slide => {
          const rect = slide.getBoundingClientRect();
          const mid = rect.top + rect.height / 2;
          const d = Math.abs(mid - centerY);
          const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
          const scale = MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);

          slide.style.top = `${y}px`;
          slide.style.transform = `scale(${scale})`;
          slide.style.zIndex = 1000 + Math.round(scale * 1000);

          y += CARD_H * scale - EPS;
        });

        track.style.height = `${y}px`;
        section.style.minHeight = `${y}px`; // 🔑 section owns its height
      }

      layout();

      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: 1,
        onUpdate() {
          layout();
        }
      });

      window.addEventListener("resize", () => {
        section.dataset.sgInit = "0";
        initAll();
        ScrollTrigger.refresh();
      });
    });
  }

  if (window.Webflow) {
    window.Webflow.push(initAll);
  } else {
    document.addEventListener("DOMContentLoaded", initAll);
  }

})();
