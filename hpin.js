// hpin.js
console.log(
  "%cHPIN-horizontalscroll V4",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (!SECTIONS.length) return;

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
    if (!inner || !view || !track) return;

    // FORCE critical styles (prevents breakpoint overrides breaking scrollWidth)
    track.style.display = "flex";
    track.style.flexWrap = "nowrap";
    track.style.width = "max-content";

    // Also ensure children don't shrink
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

    // DEBUG: check these numbers
    console.log("HPIN widths", {
      view: view.clientWidth,
      track: track.scrollWidth,
      maxX: getMaxX(),
    });

    if (getMaxX() < 2) return;

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
      markers: true, // ✅ TEMP: remove when working
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => initAll());
    });
  });

  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
})();
