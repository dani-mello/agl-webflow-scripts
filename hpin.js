// hpin.js
console.log(
  "%cHPIN-horizontalscroll V15 (smooth mobile pin)",
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

  // ✅ Big one: stops iOS address-bar resize jitter from constantly refreshing triggers
  ScrollTrigger.config({ ignoreMobileResize: true });

  const SECTIONS = document.querySelectorAll(".c-hpin");
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  // Eager-load images inside HPIN only (prevents first-load bumps + late width changes)
  document.querySelectorAll(".c-hpin img").forEach((img) => {
    img.loading = "eager";
    img.decoding = "async";
  });

  const ids = [];

  function anyActive() {
    return ids.some((id) => {
      const st = ScrollTrigger.getById(id);
      return st && st.isActive;
    });
  }

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids.length = 0;
  }

  function getViewW(view) {
    return Math.round(view.getBoundingClientRect().width);
  }

  function getMaxX(view, track) {
    const viewW = getViewW(view);
    const trackW = Math.round(track.scrollWidth);
    return Math.max(0, trackW - viewW);
  }

  function build() {
    // Don’t rebuild mid-pin
    if (anyActive()) return false;

    killAll();
    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const id = "hpin_" + index;
      ids.push(id);

      const maxX = getMaxX(view, track);

      if (DEBUG) {
        console.log("HPIN dims", {
          index,
          viewW: getViewW(view),
          trackW: Math.round(track.scrollWidth),
          maxX
        });
      }

      if (maxX < 2) return;
      builtAny = true;

      gsap.set(track, { x: 0 });

      // ✅ Mobile: make the vertical scroll distance longer so it feels smoother/slower
      // We move the same horizontal distance, but give more vertical space to do it.
      const scrollDistance = () => {
        const base = getMaxX(view, track);
        const factor = isMobile ? 1.8 : 1; // tweak: 1.5–2.5 depending on feel
        return Math.round(base * factor);
      };

      const tween = gsap.to(track, {
        x: () => -getMaxX(view, track),
        ease: "none",
        overwrite: true
      });

      ScrollTrigger.create({
        id,
        trigger: section,
        start: "top top",
        end: () => "+=" + scrollDistance(),
        pin: inner,
        pinSpacing: true,
        scrub: isMobile ? 1.2 : 1, // ✅ a touch more smoothing on mobile
        anticipatePin: isMobile ? 1 : 2,
        invalidateOnRefresh: true,
        animation: tween,
        fastScrollEnd: true
        // markers: DEBUG,
      });
    });

    ScrollTrigger.refresh();
    return builtAny;
  }

  function whenFontsReady() {
    if (document.fonts && document.fonts.ready) return document.fonts.ready.catch(() => {});
    return Promise.resolve();
  }

  function start() {
    requestAnimationFrame(() => requestAnimationFrame(build));

    // gentle retries while Webflow settles
    let tries = 0;
    const retry = setInterval(() => {
      tries += 1;
      const ok = build();
      if (ok || tries >= 6) clearInterval(retry);
    }, 250);

    // If images load later, refresh (but not mid-pin)
    SECTIONS.forEach((section) => {
      section.querySelectorAll("img").forEach((img) => {
        img.addEventListener(
          "load",
          () => {
            if (!anyActive()) ScrollTrigger.refresh();
          },
          { once: true }
        );
        img.addEventListener(
          "error",
          () => {
            if (!anyActive()) ScrollTrigger.refresh();
          },
          { once: true }
        );
      });
    });

    // ✅ Desktop can rebuild on resize; mobile should NOT rebuild on scroll UI changes.
    if (!isMobile) {
      let t = null;
      window.addEventListener("resize", () => {
        clearTimeout(t);
        t = setTimeout(() => build(), 200);
      });
    } else {
      // Mobile: rebuild only on true layout shifts like rotation
      window.addEventListener("orientationchange", () => {
        setTimeout(() => build(), 350);
      });
    }
  }

  window.addEventListener("load", () => {
    whenFontsReady().then(start);
  });
})();
