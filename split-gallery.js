gsap.registerPlugin(ScrollTrigger);

(function () {
  function initAll() {
    const sections = document.querySelectorAll(".c-split-gallery");
    if (!sections.length) return;

    sections.forEach((section, index) => {
      // Prevent double init
      if (section.dataset.sgInit === "1") return;
      section.dataset.sgInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      if (!mask || !track) return;

      const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
      const imgs   = slides.map(s => s.querySelector(".c-split-gallery_image")).filter(Boolean);
      if (!slides.length || !imgs.length) return;

      // ---------- Tunables (stable) ----------
      const CARD_H_REM = 60;   // like CodePen
      const MIN_SCALE  = 0.55;
      const FALLOFF    = 0.60;
      const EPS        = 0.5;

      const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      const baseH = CARD_H_REM * rootFont;

      const galleryW = mask.clientWidth || section.clientWidth || window.innerWidth;
      const galleryH = mask.clientHeight || window.innerHeight;

      // Prep
      gsap.set(track, { position: "relative", y: 0 });

      slides.forEach((slide) => {
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

        const scales = slides.map((slide) => {
          const rect = slide.getBoundingClientRect();
          const mid  = rect.top + rect.height / 2;
          const d    = Math.abs(mid - centerY);
          const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
          return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm);
        });

        let y = 0;
        for (let i = 0; i < slides.length; i++) {
          const s = scales[i];
          slides[i].style.top       = `${y}px`;
          slides[i].style.transform = `scale(${s})`;
          slides[i].style.zIndex    = String(1000 + Math.round(s * 1000));
          y += baseH * s - EPS;
        }

        track.style.height = `${Math.max(y + EPS, galleryH + 1)}px`;

        return y;
      }

      // Initial layout to get correct track height
      const stackHeight = layoutTick();
      const naturalTravel = Math.max(stackHeight - galleryH, 0);

      // Make the whole section tall enough to scroll through the travel.
      // This removes ALL “gap” problems because the space belongs to the section.
      section.style.minHeight = `calc(100vh + ${naturalTravel}px)`;

      // Create a ScrollTrigger that only drives progress (NO pin)
      const stId = `sg-${index}`;
      ScrollTrigger.getAll().forEach(st => { if (st?.vars?.id === stId) st.kill(); });

      ScrollTrigger.create({
        id: stId,
        trigger: section,
        start: "top top",
        end: "+=" + Math.ceil(naturalTravel),
        scrub: 1,
        onUpdate(self) {
          const y = -naturalTravel * self.progress;
          gsap.set(track, { y });
          layoutTick();
        },
        onRefresh() {
          // Ensure mask stays 100vh (some Webflow layouts can override)
          mask.style.height = "100vh";
        }
      });

      // Rebuild on resize
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          ScrollTrigger.getById(stId)?.kill();
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
