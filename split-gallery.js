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

      const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
      const imgs   = slides.map(s => s.querySelector(".c-split-gallery_image")).filter(Boolean);
      if (!slides.length || !imgs.length) return;

      // ----- Tunables -----
      const CARD_H_REM = 60;
      const MIN_SCALE  = 0.55;
      const FALLOFF    = 0.60;
      const EPS        = 0.5;

      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseH = CARD_H_REM * rootFont;

      const galleryW = mask.clientWidth || section.clientWidth || window.innerWidth;

      // Prep
      gsap.set(track, { position: "relative", y: 0 });

      slides.forEach(slide => {
        gsap.set(slide, {
          position: "absolute",
          left: 0,
          width: galleryW + "px",
          height: baseH + "px",
          margin: 0,
          overflow: "hidden",
          display: "block",
          transformOrigin: "right top",
          willChange: "transform, top"
        });
      });

      gsap.set(imgs, {
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center"
      });

      function layoutTick() {
        const centerY = window.innerHeight / 2;
        let y = 0;

        slides.forEach(slide => {
          const rect = slide.getBoundingClientRect();
          const mid  = rect.top + rect.height / 2;
          const d    = Math.abs(mid - centerY);
          const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
          const s    = MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);

          slide.style.top       = `${y}px`;
          slide.style.transform = `scale(${s})`;
          slide.style.zIndex    = String(1000 + Math.round(s * 1000));

          y += baseH * s - EPS;
        });

        track.style.height = `${Math.max(y + EPS, window.innerHeight + 1)}px`;
        return y;
      }

      // Initial measure
      let stackHeight = layoutTick();
      let maxTravel = Math.max(stackHeight - window.innerHeight, 0);

      // Section must own the scroll distance (no pin-spacer, no gaps)
      const applySectionHeight = () => {
        section.style.minHeight = `calc(100vh + ${Math.ceil(maxTravel)}px)`;
      };
      applySectionHeight();

      // Kill old trigger for this instance
      const stId = `sg-${index}`;
      ScrollTrigger.getAll().forEach(st => { if (st?.vars?.id === stId) st.kill(); });

      let refreshT;
      const st = ScrollTrigger.create({
        id: stId,
        trigger: section,
        start: "top top",
        end: () => "+=" + Math.ceil(maxTravel),
        scrub: 1,
        onUpdate(self) {
          // Move track
          const y = -maxTravel * self.progress;
          gsap.set(track, { y });

          // Re-layout (scales can change stack height)
          stackHeight = layoutTick();
          const newTravel = Math.max(stackHeight - window.innerHeight, 0);

          // If travel grew, expand section + refresh (throttled)
          if (newTravel > maxTravel + 2) {
            maxTravel = newTravel;
            applySectionHeight();
            clearTimeout(refreshT);
            refreshT = setTimeout(() => ScrollTrigger.refresh(), 50);
          }
        }
      });

      // Rebuild on resize
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          st.kill();
          section.dataset.sgInit = "0";
          initAll();
          ScrollTrigger.refresh();
        }, 200);
      });
    });
  }

  if (window.Webflow && Array.isArray(window.Webflow)) {
    window.Webflow.push(initAll);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll, { once: true });
  } else {
    initAll();
  }

})();
