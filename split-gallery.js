// Split Gallery (Webflow) — Desktop pinned, Mobile not pinned
// Requires GSAP + ScrollTrigger loaded globally.
gsap.registerPlugin(ScrollTrigger);

(function () {
  function initAll() {
    const sections = Array.from(document.querySelectorAll(".c-split-gallery"));
    if (!sections.length) return;

    sections.forEach((section, index) => {
      // Prevent double init unless we explicitly reset on resize
      if (section.dataset.splitGalleryInit === "1") return;
      section.dataset.splitGalleryInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      if (!mask || !track) return;

      const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
      const imgs   = slides
        .map(s => s.querySelector("img.c-split-gallery_image"))
        .filter(Boolean);

      if (!slides.length || !imgs.length) return;

      // ------------------------
      // Tunables
      // ------------------------
      const MIN_SCALE = 0.5;
      const FALLOFF   = 0.55;
      const EPS       = 0.5;
      const SLOWNESS  = 2.0;

      // Measure gallery size (mobile can be 0 if parent has no height)
      // If mask is 0, bail (CSS needs min-height on mobile media)
      const galleryH = mask.clientHeight || 0;
      const galleryW = mask.clientWidth || 0;
      if (galleryH < 10 || galleryW < 10) return;

      const baseH = galleryH; // "full" height
      const baseW = galleryW; // touch right edge

      // Unique id per instance
      const stId = `splitGallery_${index}`;

      // Kill existing triggers for this instance (safe)
      ScrollTrigger.getAll().forEach(st => {
        if (st?.vars?.id === stId) st.kill();
      });

      // ------------------------
      // Prep
      // ------------------------
      gsap.set(track, { position: "relative" });

      slides.forEach((slide) => {
        gsap.set(slide, {
          position: "absolute",
          left: 0,
          width: baseW + "px",
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

      // Layout tick (same stack math as CodePen)
      function layoutTick() {
        const vpCenter = window.innerHeight / 2;

        const scales = slides.map(slide => {
          const rect = slide.getBoundingClientRect();
          const mid  = rect.top + rect.height / 2;
          const d    = Math.abs(mid - vpCenter);
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
      }

      // Helpers to read slide midpoints
      function getSlideMid(i) {
        const r = slides[i].getBoundingClientRect();
        return r.top + r.height / 2;
      }

      // ------------------------
      // Compute startY/endY so first & last land "full" (centered)
      // ------------------------
      const vpCenter = window.innerHeight / 2;

      let startY = 0;
      gsap.set(track, { y: startY });
      layoutTick();

      // 2-pass refine for start
      startY += (vpCenter - getSlideMid(0));
      gsap.set(track, { y: startY });
      layoutTick();
      startY += (vpCenter - getSlideMid(0));
      gsap.set(track, { y: startY });
      layoutTick();

      // 2-pass refine for end
      let endY = startY;
      endY += (vpCenter - getSlideMid(slides.length - 1));
      gsap.set(track, { y: endY });
      layoutTick();
      endY += (vpCenter - getSlideMid(slides.length - 1));
      gsap.set(track, { y: endY });
      layoutTick();

      // Restore to start
      gsap.set(track, { y: startY });
      layoutTick();

      const travel = Math.abs(endY - startY);
      const pinDistance = Math.ceil(travel * SLOWNESS);

      // Update function shared by desktop/mobile triggers
      function applyProgress(p, snapEnd) {
        const clamped = Math.min(1, Math.max(0, p));
        const SNAP_EPS = snapEnd ? 0.999 : 2; // if snapEnd true, use near-1 snap; else never snap
        const useEnd = clamped >= SNAP_EPS;

        const y = useEnd
          ? endY
          : startY + (endY - startY) * clamped;

        gsap.set(track, { y });
        layoutTick();
      }

      // ------------------------
      // Desktop pinned trigger
      // ------------------------
      function createDesktopTrigger() {
        ScrollTrigger.create({
          id: stId,
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            applyProgress(self.progress, true); // snap at end
          }
          // markers:true
        });
      }

      // ------------------------
      // Mobile: no pin (prevents tap blocking / menu issues)
      // ------------------------
      function createMobileTrigger() {
        ScrollTrigger.create({
          id: stId,
          trigger: section,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
          pin: false,
          onUpdate(self) {
            applyProgress(self.progress, false);
          }
        });
      }

      // Create appropriate trigger based on current width
      const isMobile = window.innerWidth <= 900;
      if (isMobile) createMobileTrigger();
      else createDesktopTrigger();

      // ------------------------
      // Resize: rebuild this instance cleanly
      // ------------------------
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          // Kill this trigger
          ScrollTrigger.getAll().forEach(st => {
            if (st?.vars?.id === stId) st.kill();
          });

          // Allow re-init of this section
          section.dataset.splitGalleryInit = "0";

          // Re-init all (safe)
          initAll();

          // Refresh ST
          ScrollTrigger.refresh();
        }, 200);
      });
    });
  }

  // Boot after Webflow
  function boot() {
    const start = () => initAll();

    if (window.Webflow && Array.isArray(window.Webflow)) {
      window.Webflow.push(start);
    } else if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", start, { once: true });
    } else {
      start();
    }
  }

  boot();
})();
