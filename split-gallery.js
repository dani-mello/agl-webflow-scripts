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
      if (!mask || !track) return;

      const slides = [...track.querySelectorAll(".c-split-gallery_slide")];
      const imgs   = slides.map(s => s.querySelector(".c-split-gallery_image")).filter(Boolean);
      if (!slides.length) return;

      // ---------- Tunables (FROM CODEPEN) ----------
      const CARD_W_REM = 60;
      const CARD_H_REM = 60;
      const MIN_SCALE  = 0.5;
      const FALLOFF    = 0.55;
      const EPS        = 0.5;

      const SLOWNESS_DESKTOP = 1.0; // do NOT increase
      const SLOWNESS_MOBILE  = 1.0;

      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseH = CARD_H_REM * rootFont;
      const baseW = mask.clientWidth;

      // Prep containers
      gsap.set(track, { position: "relative" });

      slides.forEach(slide => {
        gsap.set(slide, {
          position: "absolute",
          left: 0,
          width: baseW + "px",
          height: baseH + "px",
          overflow: "hidden",
          transformOrigin: "right top",
          willChange: "transform, top"
        });
      });

      gsap.set(imgs, {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover"
      });

      const galleryH = mask.clientHeight || window.innerHeight;

      function layout() {
        const centerY = window.innerHeight / 2;
        let y = 0;

        slides.forEach(slide => {
          const rect = slide.getBoundingClientRect();
          const mid  = rect.top + rect.height / 2;
          const d    = Math.abs(mid - centerY);
          const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
          const s    = MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);

          slide.style.top = `${y}px`;
          slide.style.transform = `scale(${s})`;
          slide.style.zIndex = 1000 + Math.round(s * 1000);

          y += baseH * s - EPS;
        });

        track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;
      }

      layout();

      const naturalTravel = Math.max(track.clientHeight - galleryH, 0);
      if (!naturalTravel) return;

      const isMobile = window.innerWidth <= 900;
      const pinDistance = Math.ceil(
        naturalTravel * (isMobile ? SLOWNESS_MOBILE : SLOWNESS_DESKTOP)
      );

      ScrollTrigger.create({
        id: `sg-${index}`,
        trigger: section,
        start: "top top",
        end: "+=" + pinDistance,
        scrub: 1,
        pin: true,
        anticipatePin: 1,
        onUpdate(self) {
          const y = -naturalTravel * self.progress;
          gsap.set(track, { y });
          layout();
        }
      });

      window.addEventListener("resize", () => {
        ScrollTrigger.getById(`sg-${index}`)?.kill();
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
