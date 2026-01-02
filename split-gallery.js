gsap.registerPlugin(ScrollTrigger);

(function () {

  function initAll() {
    const sections = document.querySelectorAll(".c-split-gallery");
    if (!sections.length) return;

    sections.forEach((section, index) => {

      if (section.dataset.splitInit === "1") return;
      section.dataset.splitInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      const slides = [...section.querySelectorAll(".c-split-gallery_slide")];
      const images = [...section.querySelectorAll(".c-split-gallery_image")];

      if (!mask || !track || !slides.length) return;

      const galleryH = mask.clientHeight;
      const galleryW = mask.clientWidth;
      if (!galleryH || !galleryW) return;

      // ---- Tunables (safe) ----
      const MIN_SCALE = 0.6;
      const FALLOFF   = 0.6;
      const CARD_H    = galleryH;
      const EPS       = 0.5;

      // Prep
      gsap.set(track, { position: "relative" });

      slides.forEach(slide => {
        gsap.set(slide, {
          position: "absolute",
          left: 0,
          width: galleryW,
          height: CARD_H,
          overflow: "hidden",
          transformOrigin: "right top"
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

        slides.forEach((slide, i) => {
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
      }

      // Initial layout
      layout();

      const travel = track.clientHeight - galleryH;
      if (travel <= 0) return;

      ScrollTrigger.create({
        id: `split-${index}`,
        trigger: section,
        start: "top top",
        end: `+=${travel}`,
        pin: true,
        scrub: 1,
        anticipatePin: 1,
        onUpdate(self) {
          gsap.set(track, { y: -travel * self.progress });
          layout();
        }
      });

      // Resize safety
      window.addEventListener("resize", () => {
        ScrollTrigger.getById(`split-${index}`)?.kill();
        section.dataset.splitInit = "0";
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
