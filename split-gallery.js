gsap.registerPlugin(ScrollTrigger);

(function () {

  function initAll() {
    const sections = Array.from(document.querySelectorAll(".c-split-gallery"));
    if (!sections.length) return;

    sections.forEach((section, index) => {
      if (section.dataset.splitGalleryInit === "1") return;
      section.dataset.splitGalleryInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      if (!mask || !track) return;

      const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
      const imgs   = slides.map(s => s.querySelector("img.c-split-gallery_image")).filter(Boolean);
      if (!slides.length || !imgs.length) return;

      // ---------- Tunables ----------
      const MIN_SCALE = 0.5;
      const FALLOFF   = 0.55;
      const EPS       = 0.5;
      const SLOWNESS  = 2.0;

      const stId = `splitGallery_${index}`;

      // Kill existing trigger for this instance
      ScrollTrigger.getAll().forEach(st => {
        if (st?.vars?.id === stId) st.kill();
      });

      // Measure gallery size (must be non-zero)
      const galleryH = mask.clientHeight || 0;
      const galleryW = mask.clientWidth  || 0;
      if (galleryH < 10 || galleryW < 10) return;

      const baseH = galleryH;
      const baseW = galleryW;

      // Prep
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

      // Center reference:
      // - Desktop: viewport center
      // - Mobile: mask center (so nav/header doesn't throw it off)
      function getCenterY(useMaskCenter) {
        if (!useMaskCenter) return window.innerHeight / 2;
        const r = mask.getBoundingClientRect();
        return r.top + r.height / 2;
      }

      function getSlideMid(i) {
        const r = slides[i].getBoundingClientRect();
        return r.top + r.height / 2;
      }

      function layoutTick(useMaskCenter) {
        const centerY = getCenterY(useMaskCenter);

        const scales = slides.map(slide => {
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
      }

      // Compute startY/endY so first/last are FULL (scale~1) at start/end
      function computeEndpoints(useMaskCenter) {
        const centerY = getCenterY(useMaskCenter);

        let startY = 0;
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        // 2-pass start refine
        startY += (centerY - getSlideMid(0));
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);
        startY += (centerY - getSlideMid(0));
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        let endY = startY;

        // 2-pass end refine
        endY += (centerY - getSlideMid(slides.length - 1));
        gsap.set(track, { y: endY });
        layoutTick(useMaskCenter);
        endY += (centerY - getSlideMid(slides.length - 1));
        gsap.set(track, { y: endY });
        layoutTick(useMaskCenter);

        // Restore to start
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        return { startY, endY };
      }

      function applyProgress(p, startY, endY, useMaskCenter, snapEnd) {
        const clamped = Math.min(1, Math.max(0, p));
        const SNAP_EPS = snapEnd ? 0.999 : 2; // snap only when requested
        const useEnd = clamped >= SNAP_EPS;

        const y = useEnd ? endY : startY + (endY - startY) * clamped;
        gsap.set(track, { y });
        layoutTick(useMaskCenter);
      }

      // ---- Desktop trigger (pinned, viewport center) ----
      function buildDesktop() {
        const useMaskCenter = false;
        const { startY, endY } = computeEndpoints(useMaskCenter);

        const travel = Math.abs(endY - startY);
        const pinDistance = Math.ceil(travel * SLOWNESS);

        ScrollTrigger.create({
          id: stId,
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            applyProgress(self.progress, startY, endY, useMaskCenter, true);
          }
        });
      }

      // ---- Mobile trigger (pinned, mask center, burger-safe) ----
      function buildMobile() {
        const useMaskCenter = true;
        const { startY, endY } = computeEndpoints(useMaskCenter);

        const travel = Math.abs(endY - startY);
        const pinDistance = Math.ceil(travel * SLOWNESS);

        ScrollTrigger.create({
          id: stId,
          trigger: mask,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          pinSpacing: true,

          // ✅ This prevents the pin-spacer from blocking taps (burger!)
          onRefresh(self) {
            const spacer = self.pin && self.pin.parentNode; // pin-spacer wrapper
            if (spacer && spacer.classList && spacer.classList.contains("pin-spacer")) {
              spacer.style.pointerEvents = "none";
              spacer.style.zIndex = "0";
            }
            // keep actual gallery interactive if you ever need it
            if (self.pin) self.pin.style.pointerEvents = "auto";
          },

          onUpdate(self) {
            applyProgress(self.progress, startY, endY, useMaskCenter, true);
          }
        });
      }

      const isMobile = window.innerWidth <= 900;
      if (isMobile) buildMobile();
      else buildDesktop();

      // Resize rebuild (this instance)
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          ScrollTrigger.getAll().forEach(st => {
            if (st?.vars?.id === stId) st.kill();
          });
          section.dataset.splitGalleryInit = "0";
          initAll();
          ScrollTrigger.refresh();
        }, 220);
      });
    });
  }

  function boot() {
    const start = () => initAll();
    if (window.Webflow && Array.isArray(window.Webflow)) window.Webflow.push(start);
    else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  boot();
})();
