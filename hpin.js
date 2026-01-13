// hpin.js
console.log(
  "%cHPIN-horizontalscroll V3",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  // Safety checks
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (!SECTIONS.length) return;

  // Wait for images so widths/heights are correct
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

  function killById(id) {
    const st = ScrollTrigger.getById(id);
    if (st) st.kill(true);
  }

  function initOne(section, index) {
    const inner = section.querySelector(".c-hpin_inner");
    const view = section.querySelector(".c-hpin_view");
    const track = section.querySelector(".c-hpin_track");

    if (!inner || !view || !track) return;

    const id = "hpin_" + index;
    killById(id);

    // Compute how far we need to move (track width - viewport width)
    const getMaxX = () => {
      const max = track.scrollWidth - view.clientWidth;
      return Math.max(0, Math.round(max));
    };

    // Debug (remove later if you want)
    // console.log("HPIN widths", {
    //   view: view.clientWidth,
    //   track: track.scrollWidth,
    //   maxX: getMaxX(),
    // });

    // If there's nothing to scroll horizontally, don't pin
    if (getMaxX() < 2) return;

    // Reset x before creating (important on refresh)
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
      end: () => "+=" + getMaxX(), // scroll distance equals horizontal distance
      pin: inner,
      scrub: 1,
      anticipatePin: 1,
      animation: tween,
      invalidateOnRefresh: true,
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  // Init after images + layout settle (Webflow can shift on load)
  Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initAll();
      });
    });
  });

  // Recalc on resize/orientation changes
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
})();
