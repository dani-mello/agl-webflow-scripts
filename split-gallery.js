gsap.registerPlugin(ScrollTrigger);

(function () {
  const BREAKPOINT = 900;

  function killSplit() {
    ScrollTrigger.getAll().forEach(st => {
      if (st?.vars?.id && String(st.vars.id).startsWith("splitGallery")) st.kill();
    });
  }

  function initSplitGallery() {
    const section = document.querySelector(".c-split-gallery");
    if (!section) return;

    const mask   = section.querySelector(".c-split-gallery_mask");
    const track  = section.querySelector(".c-split-gallery_track");
    const slides = Array.from(section.querySelectorAll(".c-split-gallery_slide"));
    const imgs   = slides.map(s => s.querySelector(".c-split-gallery_image img, img")).filter(Boolean);

    if (!mask || !track || slides.length < 2 || imgs.length < 2) return;

    killSplit();

    // Tunables (keep same “feel”)
    const CARD_W_REM = 60;
    const CARD_H_REM = 60;
    const MIN_SCALE  = 0.5;
    const FALLOFF    = 0.55;
    const EPS        = 0.5;
    const SLOWNESS   = 2.0;

    const rootFont = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const baseH = CARD_H_REM * rootFont;

    // Prep track + slides (flush right)
    gsap.set(track, { position: "relative", padding: 0, margin: 0, willChange: "transform" });

    slides.forEach(slide => {
      gsap.set(slide, {
        position: "absolute",
        right: 0,
        left: "auto",
        width: `${CARD_W_REM}rem`,
        height: `${CARD_H_REM}rem`,
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

    function centerY() {
      const r = mask.getBoundingClientRect();
      return (r.height ? (r.top + r.height / 2) : window.innerHeight / 2);
    }

    function layoutTick() {
      const cy = centerY();
      const galleryH = mask.clientHeight || window.innerHeight;

      const scales = slides.map(slide => {
        const rect = slide.getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        const d    = Math.abs(mid - cy);
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

    function solveYForSlide(index) {
      let y = 0;
      gsap.set(track, { y });
      layoutTick();

      for (let k = 0; k < 10; k++) {
        const cy = centerY();
        const rect = slides[index].getBoundingClientRect();
        const mid  = rect.top + rect.height / 2;
        const delta = cy - mid;
        y += delta;
        gsap.set(track, { y });
        layoutTick();
        if (Math.abs(delta) < 0.5) break;
      }
      return y;
    }

    // Paint once
    gsap.set(track, { y: 0 });
    layoutTick();

    const yStart = solveYForSlide(0);
    const yEnd   = solveYForSlide(slides.length - 1);
    const naturalTravel = Math.max(yStart - yEnd, 0);
    const pinDistance   = Math.ceil(naturalTravel * SLOWNESS);

    ScrollTrigger.matchMedia({

      // DESKTOP (LOCKED)
      "(min-width: 901px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-desktop",
          trigger: section,
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: true,
          anticipatePin: 1,
          onUpdate(self) {
            const y = yStart - naturalTravel * self.progress;
            gsap.set(track, { y });
            layoutTick();
          }
        });
      },

      // MOBILE (NOW VISIBLE because CSS overflow is fixed)
      "(max-width: 900px)": function () {
        ScrollTrigger.create({
          id: "splitGallery-mobile",
          trigger: mask,      // start when gallery actually reaches top
          start: "top top",
          end: "+=" + pinDistance,
          scrub: true,
          pin: mask,
          anticipatePin: 1,
          onUpdate(self) {
            const y = yStart - naturalTravel * self.progress;
            gsap.set(track, { y });
            layoutTick();
          }
        });
      }
    });

    ScrollTrigger.refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSplitGallery);
  } else {
    initSplitGallery();
  }

  let t;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(initSplitGallery, 200);
  });

})();
