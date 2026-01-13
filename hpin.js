console.log(
  "%cHPIN-horizontalscroll V6",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  const SECTIONS = document.querySelectorAll(".c-hpin");
  console.log("HPIN: sections found =", SECTIONS.length);
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

  function killById(id) {
    const st = ScrollTrigger.getById(id);
    if (st) st.kill(true);
  }

  function initOne(section, index) {
    const inner = section.querySelector(".c-hpin_inner");
    const view = section.querySelector(".c-hpin_view");
    const track = section.querySelector(".c-hpin_track");
    if (!inner || !view || !track) {
      console.warn("HPIN: missing inner/view/track in section", section);
      return;
    }

    const id = "hpin_" + index;
    killById(id);

    // Safer measurement than clientWidth in flex layouts
    const getViewW = () => Math.round(view.getBoundingClientRect().width);

    const getMaxX = () => {
      const viewW = getViewW();
      const trackW = Math.round(track.scrollWidth);
      const max = trackW - viewW;
      return Math.max(0, max);
    };

    const maxX = getMaxX();
    console.log("HPIN dims", {
      index,
      viewW: getViewW(),
      trackW: Math.round(track.scrollWidth),
      maxX
    });

    if (maxX < 2) {
      console.warn(
        "HPIN: maxX < 2. Track is not wider than view. Fix flex sizing: .c-hpin_view {flex:1; min-width:0} and .c-hpin_inner {width:100%}."
      );
      return;
    }

    // Reset position before creating trigger
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
      pinSpacing: true,
      scrub: 1,
      anticipatePin: 1,
      animation: tween,
      invalidateOnRefresh: true
      // markers: true, // uncomment for visual debugging
    });
  }

  function initAll() {
    SECTIONS.forEach(initOne);
    ScrollTrigger.refresh();
  }

  Promise.all(Array.from(SECTIONS).map(imagesReady)).then(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        initAll();
      });
    });
  });

  let t = null;
  window.addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => ScrollTrigger.refresh(), 150);
  });
})();
