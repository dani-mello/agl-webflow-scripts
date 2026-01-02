(function () {
  function runSplitGallery() {
    if (!window.gsap || !window.ScrollTrigger) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;
    gsap.registerPlugin(ScrollTrigger);

    const sections = Array.from(document.querySelectorAll(".c-split-gallery"));
    if (!sections.length) return;

    sections.forEach((section, idx) => {
      // init guard
      if (section.dataset.splitGalleryInit === "1") return;
      section.dataset.splitGalleryInit = "1";

      const mask  = section.querySelector(".c-split-gallery_mask");
      const track = section.querySelector(".c-split-gallery_track");
      if (!mask || !track) return;

      const slides = Array.from(track.querySelectorAll(".c-split-gallery_slide"));
      const imgs   = slides.map(s => s.querySelector("img.c-split-gallery_image")).filter(Boolean);
      if (!slides.length || !imgs.length) return;

      // --- Tunables ---
      const MIN_SCALE = 0.5;
      const FALLOFF   = 0.55;
      const EPS       = 0.5;
      const SLOWNESS  = 2.0;

      // ✅ Use real mask size so "full" = full
      const baseH = mask.clientHeight || window.innerHeight;
      const baseW = mask.clientWidth  || section.clientWidth;

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

      // Start position: if baseH === gallery height, start at 0
      const startY = 0;
      gsap.set(track, { y: startY });

      function layoutTick() {
        const vpCenter = window.innerHeight / 2;

        const scales = slides.map(slide => {
          const rect = slide.getBoundingClientRect();
          const mid  = rect.top + rect.height / 2;
          const d    = Math.abs(mid - vpCenter);
          const norm = Math.min(1, d / (window.innerHeight * FALLOFF));
          return MIN_SCALE + (1 - MIN_SCALE) * (1 - norm); // 0.5..1..0.5
        });

        let y = 0;
        for (let i = 0; i < slides.length; i++) {
          const s = scales[i];
          slides[i].style.top       = `${y}px`;
          slides[i].style.transform = `scale(${s})`;
          slides[i].style.zIndex    = String(1000 + Math.round(s * 1000));
          y += baseH * s - EPS;
        }

        track.style.height = `${Math.max(y + EPS, baseH + 1)}px`;
      }

      layoutTick();

      // --- Find endY so the LAST slide ends centered (=> full scale) ---
      function getLastMidAtY(testY) {
        gsap.set(track, { y: testY });
        layoutTick();
        const r = slides[slides.length - 1].getBoundingClientRect();
        return r.top + r.height / 2;
      }

      const vpCenter = window.innerHeight / 2;
      let lo = -track.clientHeight * 2;  // generous bounds
      let hi =  track.clientHeight * 2;
      let endY = startY;

      // Binary search for y where lastMid ≈ vpCenter
      for (let i = 0; i < 24; i++) {
        const midY = (lo + hi) / 2;
        const lastMid = getLastMidAtY(midY);
        if (lastMid > vpCenter) {
          lo = midY; // need to move up more (make y smaller) -> search lower? (depends on sign)
        } else {
          hi = midY;
        }
      }
      endY = (lo + hi) / 2;

      // Restore start position after search
      gsap.set(track, { y: startY });
      layoutTick();

      // Travel distance based on start/end
      const travel = Math.abs(endY - startY);
      const pinDistance = Math.ceil(travel * SLOWNESS);

      const isSmall        = window.innerWidth <= 900;
      const triggerElement = isSmall ? mask : section;
      const stId = `splitGallery_${idx}`;

      ScrollTrigger.getAll().forEach(st => {
        if (st?.vars?.id === stId) st.kill();
      });

      ScrollTrigger.create({
        id: stId,
        trigger: triggerElement,
        start: "top top",
        end: "+=" + pinDistance,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate(self) {
          const p = self.progress; // 0..1
          const y = startY + (endY - startY) * p; // ✅ first full → last full
          gsap.set(track, { y });
          layoutTick();
        }
      });

      // Resize rebuild (safe)
      let t;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => {
          // allow re-init on resize
          section.dataset.splitGalleryInit = "0";
          ScrollTrigger.getAll().forEach(st => {
            if (st?.vars?.id === stId) st.kill();
          });
          runSplitGallery();
          ScrollTrigger.refresh();
        }, 200);
      });
    });
  }

  // Boot after Webflow
  function boot() {
    const start = () => runSplitGallery();
    if (window.Webflow && Array.isArray(window.Webflow)) window.Webflow.push(start);
    else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
    else start();
  }

  boot();
})();
