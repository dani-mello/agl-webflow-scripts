// hpin.js
console.log(
  "%cHPIN-horizontalscroll V18 (init ASAP + refresh later)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;
  const MOBILE_MQ = "(max-width: 900px)";
  const isMobile = window.matchMedia && window.matchMedia(MOBILE_MQ).matches;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // prevent double init
  if (window.__HPIN_INIT__ === true) return;
  window.__HPIN_INIT__ = true;

  const SECTIONS = Array.from(document.querySelectorAll(".c-hpin"));
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  const ids = [];

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids.length = 0;
  }

  function viewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function maxX(view, track) {
    // Use scrollWidth; it updates as images load/resize
    return Math.max(0, Math.round(track.scrollWidth) - viewW(view));
  }

  function build() {
    killAll();
    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view  = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const mx = maxX(view, track);
      if (DEBUG) console.log("HPIN dims", { index, viewW: viewW(view), trackW: track.scrollWidth, maxX: mx });

      if (mx < 2) return;
      builtAny = true;

      const id = "hpin_" + index;
      ids.push(id);

      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -maxX(view, track),
        ease: "none",
        overwrite: true
      });

      const scrollDistance = () => {
        const base = maxX(view, track);
        const factor = isMobile ? 1.8 : 1;
        return Math.round(base * factor);
      };

      ScrollTrigger.create({
        id,
        trigger: section,
        start: "top top",
        end: () => "+=" + scrollDistance(),
        pin: inner,
        pinSpacing: true,
        scrub: isMobile ? 1.2 : 1,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tween,
        fastScrollEnd: true
      });
    });

    ScrollTrigger.refresh(true);
    return builtAny;
  }

  // Refresh when images settle (load + decode)
  function hookImages() {
    const imgs = document.querySelectorAll(".c-hpin img");
    imgs.forEach((img) => {
      // encourage earlier load (Webflow often sets lazy)
      img.loading = "eager";
      img.decoding = "async";

      const refresh = () => ScrollTrigger.refresh();

      img.addEventListener("load", () => {
        if (img.decode) img.decode().catch(() => {}).finally(refresh);
        else refresh();
      }, { once: true });

      img.addEventListener("error", refresh, { once: true });
    });
  }

  // Build NOW (so you can't scroll past before init)
  function start() {
    requestAnimationFrame(() => requestAnimationFrame(build));

    // settle window refreshes (Webflow layout + fonts + images)
    [120, 300, 650, 1100].forEach((ms) => setTimeout(() => {
      build();
    }, ms));

    hookImages();

    if (!isMobile) {
      let t = null;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(build, 200);
      });
    } else {
      window.addEventListener("orientationchange", () => setTimeout(build, 450));
    }
  }

  // DOM ready is enough (don’t wait for load)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }

  // bfcache restore
  window.addEventListener("pageshow", () => {
    requestAnimationFrame(() => requestAnimationFrame(build));
  });
})();
