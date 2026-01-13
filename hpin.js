// hpin.js
console.log(
  "%cHPIN-horizontalscroll V5",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  function startHPIN() {
    // Safety checks
    if (typeof gsap === "undefined") {
      console.warn("HPIN: gsap is undefined (GSAP not loaded yet)");
      return;
    }
    if (typeof ScrollTrigger === "undefined") {
      console.warn("HPIN: ScrollTrigger is undefined (plugin not loaded yet)");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const SECTIONS = document.querySelectorAll(".c-hpin");
    console.log("HPIN: sections found =", SECTIONS.length);

    if (!SECTIONS.length) {
      console.warn("HPIN: no .c-hpin found (DOM not ready or class mismatch)");
      return;
    }

    function imagesReady(container) {
      const imgs = Array.from(container.querySelectorAll("img"));
      if (!imgs.length) return Promise.resolve();

      return Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.addEventListener("load", res, { once: true });
            img.addEventListener("error", res, { once: true });
          });
        })
      );
    }

    function initOne(section, index) {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");

      if (!inner || !view || !track) {
        console.warn("HPIN: missing inner/view/track in section", section);
        return;
      }

      // Ensure critical layout styles (prevents breakpoint overrides killing scrollWidth)
      track.style.display = "flex";
      track.style.flexWrap = "nowrap";
      track.style.width = "max-content";

      Array.from(track.children).forEach((child) => {
        child.style.flex = "0 0 auto";
      });

      const id = "hpin_" + index;
      const old = ScrollTrigger.getById(id);
      if (old) old.kill(true);

      const getMaxX = () => {
        const max = track.scrollWidth - view.clientWidth;
        return Math.max(0, Math.round(max));
      };

      const maxX = getMaxX();
      console.log("HPIN widths", {
        index,
        view: view.clientWidth,
        track: track.scrollWidth,
        maxX,
      });

      if (maxX < 2) {
        console.warn("HPIN: maxX < 2, nothing to animate (track not wider than view)");
        return;
      }

      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -getMaxX(),
        ease: "none",
        overwrite: true,
      });

      ScrollTrigger.create({
        id,
        trigger: section,
        start: "top top",
        end: () => "+=" + getMaxX(),
        pin: inner,
        scrub: 1,
        anticipatePin: 1,
        animation: tween,
        invalidateOnRefresh: true,
        markers: true, // TEMP: you should see markers if it initializes
      });
    }

    function initAll() {
      SECTIONS.forEach(initOne);
      ScrollTrigger.refresh();
    }

    Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
      // Wait 2 frames so layout settles
      requestAnimationFrame(() => requestAnimationFrame(initAll));
    });

    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
    });
  }

  // --- Robust Webflow + early-load handling ---
  // 1) Webflow-ready hook (best if script runs early)
  window.Webflow = window.Webflow || [];
  window.Webflow.push(() => {
    // 2) Also wait for full load (images/fonts/layout)
    window.addEventListener("load", () => {
      startHPIN();
    });
  });

  // 3) Fallback: if Webflow hook never fires, try after DOMContentLoaded + retries
  let tries = 0;
  function retryStart() {
    tries += 1;
    const found = document.querySelectorAll(".c-hpin").length;
    if (found) {
      startHPIN();
      return;
    }
    if (tries < 10) {
      setTimeout(retryStart, 300);
    } else {
      console.warn("HPIN: gave up after retries — check script placement and class names");
    }
  }
  document.addEventListener("DOMContentLoaded", retryStart);
})();
