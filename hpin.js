
(function () {
  // Safety checks
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (!SECTIONS.length) return;

  function initOne(section, index) {
    const inner = section.querySelector(".c-hpin_inner");
    const view  = section.querySelector(".c-hpin_view");
    const track = section.querySelector(".c-hpin_track");

    if (!inner || !view || !track) return;

    // Kill previous instance if re-init (Webflow designer / interactions reload)
    const id = "hpin_" + index;
    ScrollTrigger.getAll().forEach(st => {
      if (st.vars && st.vars.id === id) st.kill();
    });

    // Function to compute how far we need to move
    const getMaxX = () => {
      // total track width - visible viewport width
      const max = track.scrollWidth - view.clientWidth;
      return Math.max(0, max);
    };

    // If there's nothing to scroll horizontally, don't pin
    if (getMaxX() < 2) return;

    // The animation: move track left as we scroll down
    const tween = gsap.to(track, {
      x: () => -getMaxX(),
      ease: "none",
      overwrite: true
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
      invalidateOnRefresh: true
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  // Wait for images so widths/heights are correct
  function imagesReady(container) {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();

    return Promise.all(imgs.map(img => {
      if (img.complete) return Promise.resolve();
      return new Promise(res => {
        img.addEventListener("load", res, { once: true });
        img.addEventListener("error", res, { once: true });
      });
    }));
  }

  Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
    initAll();
  });

  // Recalc on resize (and when Webflow changes layout)
  window.addEventListener("resize", () => ScrollTrigger.refresh());

})();

