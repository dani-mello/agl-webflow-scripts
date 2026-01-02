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
      const imgs   = slides
        .map(s => s.querySelector("img.c-split-gallery_image"))
        .filter(Boolean);

      if (!slides.length || !imgs.length) return;

      // ---------- Tunables ----------
      const MIN_SCALE = 0.5;
      const FALLOFF   = 0.55;
      const EPS       = 0.5;

      const DESKTOP_SCRUB = 1.0;
      const MOBILE_SCRUB  = 0.8;

      const stId = `splitGallery_${index}`;

      // Kill any existing trigger for this instance
      ScrollTrigger.getAll().forEach(st => {
        if (st?.vars?.id === stId) st.kill();
      });

      // Measure gallery
      const galleryH = mask.clientHeight || 0;
      const galleryW = mask.clientWidth  || 0;
      if (galleryH < 10 || galleryW < 10) return;

      // Slides are FULL HEIGHT of gallery (100vh)
      const baseH = galleryH;
      const baseW = galleryW;

      // Prep containers
      gsap.set(track, { position: "relative" });

      slides.forEach(slide => {
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
      // - Mobile: mask center (safer under fixed nav)
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

      // Compute endpoints so first and last slides hit FULL
      function computeEndpoints(useMaskCenter) {
        const centerY = getCenterY(useMaskCenter);

        let startY = 0;
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        // refine start
        startY += (centerY - getSlideMid(0));
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        let endY = startY;

        // refine end
        endY += (centerY - getSlideMid(slides.length - 1));
        gsap.set(track, { y: endY });
        layoutTick(useMaskCenter);

        // restore
        gsap.set(track, { y: startY });
        layoutTick(useMaskCenter);

        return { startY, endY };
      }

      function applyProgress(p, startY, endY, useMaskCenter) {
        const clamped = Math.min(1, Math.max(0, p));
        const y = startY + (endY - startY) * clamped;
        gsap.set(track, { y });
        layoutTick(useMaskCenter);
      }

      // ---------- Desktop ----------
      function buildDesktop() {
        const useMaskCenter = false;
        const { startY, endY } = computeEndpoints(useMaskCenter);

        const travel = Math.abs(endY - startY);
        const pinDistance = Math.ceil(travel);

        // Set initial frame (prevents top gap)
        applyProgress(0, startY, endY, useMaskCenter);

        ScrollTrigger.create({
          id: stId,
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: DESKTOP_SCRUB,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            applyProgress(self.progress, startY, endY, useMaskCenter);
          }
        });
      }

      // ---------- Mobile ----------
      function buildMobile() {
        const useMaskCenter = true;
        const { startY, endY } = computeEndpoints(useMaskCenter);

        const travel = Math.abs(endY - startY);
        const pinDistance = Math.ceil(travel);

        applyProgress(0, startY, endY, useMaskCenter);
