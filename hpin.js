console.log(
  "%cHPIN-horizontalscroll (WORKING BASE + DEBUG)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  console.log("HPIN: sections", SECTIONS.length);
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
    const view  = section.querySelector(".c-hpin_view");
    const track = section.querySelector(".c-hpin_track");
    if (!inner || !view || !track) return;

    const id = "hpin_" + index;
    const old = ScrollTrigger.getById(id);
    if (old) old.kill(true);

    const getMaxX = () => Math.max(0, track.scrollWidth - view.clientWidth);
    const maxX = getMaxX();

    console.log("HPIN dims", { index, view: view.clientWidth, track: track.scrollWidth, maxX });

    if (maxX < 2) {
      console.warn("HPIN: maxX is 0 — track is not wider than view. This is CSS/layout.");
      return;
    }

    gsap.set(track, { x: 0 });

    const tween = gsap.to(track, {
      x: () => -getMaxX(),
      ease: "none",
      overwrite: true
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
      invalidateOnRefresh: true
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
    requestAnimationFrame(() => requestAnimationFrame(initAll));
  });

  window.addEventListener("resize", () => ScrollTrigger.refresh());
})();
