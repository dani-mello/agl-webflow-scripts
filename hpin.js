// hpin.js
console.log(
  "%cHPIN-horizontalscroll V16 (first-load reliable)",
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

  // Big one for iOS jitter
  ScrollTrigger.config({ ignoreMobileResize: true });

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  // Prefer eager decode for HPIN media only
  document.querySelectorAll(".c-hpin img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";
  });

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
    return Math.max(0, Math.round(track.scrollWidth) - viewW(view));
  }

  function build() {
    killAll();
    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const id = "hpin_" + index;
      ids.push(id);

      const mx = maxX(view, track);
      if (DEBUG) console.log("HPIN dims", { index, viewW: viewW(view), trackW: track.scrollWidth, maxX: mx });

      if (mx < 2) return;
      builtAny = true;

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

  function fontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(() => {});
    return Promise.resolve();
  }

  // Wait for images AND decode (decode is the missing piece on first load)
  function imagesDecoded(container) {
    const imgs = Array.from(container.querySelectorAll("img"));
    if (!imgs.length) return Promise.resolve();

    return Promise.all(
      imgs.map((img) => {
        const loaded = img.complete
          ? Promise.resolve()
          : new Promise((res) => {
              img.addEventListener("load", res, { once: true });
              img.addEventListener("error", res, { once: true });
            });

        // decode() makes layout stable earlier on Safari/Chrome
        return loaded.then(() => (img.decode ? img.decode().catch(() => {}) : undefined));
      })
    );
  }

  function start() {
    // Build once immediately after 2 RAFs
    requestAnimationFrame(() => requestAnimationFrame(build));

    // Then do a few *scheduled* rebuilds while the page settles (first-load fix)
    const schedule = [150, 350, 700, 1200];
    schedule.forEach((ms) => setTimeout(build, ms));

    // Desktop: rebuild on resize
    if (!isMobile) {
      let t = null;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(build, 200);
      });
    } else {
      // Mobile: rebuild only on rotation
      window.addEventListener("orientationchange", () => setTimeout(build, 450));
    }
  }

  window.addEventListener("load", () => {
    Promise.all([fontsReady(), ...Array.from(SECTIONS).map(imagesDecoded)]).then(() => {
      start();
    });
  });
})();
