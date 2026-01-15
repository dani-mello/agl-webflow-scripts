// hpin.js
console.log(
  "%cHPIN-horizontalscroll V19 (cross-browser: fonts+load refresh, stable measuring, RO rebuild, pinReparent)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  const DEBUG = false;
  const MOBILE_MQ = "(max-width: 900px)";

  // -----------------------------
  // Requirements
  // -----------------------------
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("HPIN: GSAP or ScrollTrigger missing");
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  // Keep Webflow mobile resize quirks from thrashing triggers
  ScrollTrigger.config({ ignoreMobileResize: true });

  // Prevent double init
  if (window.__HPIN_INIT__ === true) return;
  window.__HPIN_INIT__ = true;

  // If you use Lenis, make sure you have a proper ScrollTrigger <-> Lenis bridge globally.
  // If not, desktop triggers can feel "early" / inconsistent across browsers.
  // (We won't scrollerProxy here because that's a global setup and can break other scripts.)
  if (window.lenis && DEBUG) {
    console.warn(
      "HPIN: lenis detected. Ensure ScrollTrigger<->Lenis integration exists globally (scrollerProxy + ScrollTrigger.update)."
    );
  }

  // -----------------------------
  // Helpers
  // -----------------------------
  const mm = window.matchMedia ? window.matchMedia(MOBILE_MQ) : null;
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function isMobileNow() {
    return !!(mm && mm.matches);
  }

  const SECTIONS = Array.from(document.querySelectorAll(".c-hpin"));
  if (DEBUG) console.log("HPIN: sections found =", SECTIONS.length);
  if (!SECTIONS.length) return;

  let ids = [];
  let ro = null;
  let building = false;
  let lastBuildAt = 0;

  // Use layout widths (more stable cross-browser than getBoundingClientRect)
  function viewW(view) {
    return Math.round(view.clientWidth || view.offsetWidth || 0);
  }

  function maxX(view, track) {
    // scrollWidth updates as images decode / layout changes
    return Math.max(0, Math.ceil(track.scrollWidth - viewW(view)));
  }

  function killAll() {
    ids.forEach((id) => {
      const st = ScrollTrigger.getById(id);
      if (st) st.kill(true);
    });
    ids = [];

    // Also kill any pinned spacing leftovers created by our triggers (defensive)
    ScrollTrigger.getAll().forEach((st) => {
      if (st?.vars?.id && String(st.vars.id).startsWith("hpin_")) st.kill(true);
    });
  }

  // Debounced refresh/build
  function softBuild(delayMs) {
    clearTimeout(window.__hpin_softBuild_t);
    window.__hpin_softBuild_t = setTimeout(build, delayMs || 0);
  }

  // -----------------------------
  // Core build
  // -----------------------------
  function build() {
    // Prevent build storms (RO + load + fonts + resize can overlap)
    if (building) return;
    const now = Date.now();
    if (now - lastBuildAt < 40) return;

    building = true;
    lastBuildAt = now;

    const mobile = isMobileNow();
    if (DEBUG) console.log("HPIN build: mobile =", mobile);

    killAll();

    let builtAny = false;

    SECTIONS.forEach((section, index) => {
      const inner = section.querySelector(".c-hpin_inner");
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (!inner || !view || !track) return;

      const mx = maxX(view, track);

      if (DEBUG) {
        console.log("HPIN dims", {
          index,
          viewW: viewW(view),
          trackW: track.scrollWidth,
          maxX: mx
        });
      }

      // Nothing to scroll
      if (mx < 2) return;

      builtAny = true;

      const id = "hpin_" + index;
      ids.push(id);

      // Reset transform before creating tween/trigger
      gsap.set(track, { x: 0 });

      const tween = gsap.to(track, {
        x: () => -maxX(view, track),
        ease: "none",
        overwrite: true
      });

      const scrollDistance = () => {
        const base = maxX(view, track);

        // Mobile usually needs more vertical distance to feel right
        const factor = mobile ? 1.8 : 1;
        return Math.round(base * factor);
      };

      ScrollTrigger.create({
        id,
        trigger: section,

        // Desktop: small offset prevents “starts before I arrive” feel
        // Alternative: "top 85%" for more in-view start.
        start: mobile ? "top top" : "top+=1 top",

        end: () => "+=" + scrollDistance(),

        // Pin inner for your layout, but reparent for Safari/Firefox stability
        pin: inner,
        pinReparent: true,

        pinSpacing: true,

        scrub: prefersReduced ? false : mobile ? 1.2 : 1,

        anticipatePin: 1,
        invalidateOnRefresh: true,
        animation: tween,
        fastScrollEnd: true

        // DEBUG: uncomment when needed
        // ,markers: true
      });
    });

    // A hard refresh after rebuild helps when layout just changed
    ScrollTrigger.refresh(true);

    building = false;
    return builtAny;
  }

  // -----------------------------
  // Hooks that stabilize layout timing
  // -----------------------------
  function hookImages() {
    // Watch ALL images on page, not just inside HPIN.
    // Why: anything above HPIN changing height can shift trigger start.
    const imgs = document.querySelectorAll("img");

    imgs.forEach((img) => {
      const refresh = () => softBuild(0);

      // Encourage earlier load (Webflow often sets lazy)
      // (No harm if ignored)
      try {
        img.loading = "eager";
        img.decoding = "async";
      } catch (e) {}

      // If already complete, skip
      if (img.complete) return;

      img.addEventListener(
        "load",
        () => {
          // decode() helps Safari/Firefox settle sizing
          if (img.decode) img.decode().catch(() => {}).finally(refresh);
          else refresh();
        },
        { once: true }
      );

      img.addEventListener("error", refresh, { once: true });
    });
  }

  function hookFonts() {
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        // Font swap can change line heights and section offsets
        softBuild(0);
      });
    }
  }

  function hookWindowLoad() {
    // After ALL assets load (big cross-browser stabilizer)
    window.addEventListener(
      "load",
      () => {
        softBuild(0);
      },
      { once: true }
    );
  }

  function hookWebflowReady() {
    // Webflow can adjust layout/interactions after DOMContentLoaded
    if (window.Webflow?.ready) {
      Webflow.ready(() => {
        softBuild(0);
      });
    }
  }

  function hookResizeObserver() {
    if (typeof ResizeObserver === "undefined") return;

    if (ro) ro.disconnect();
    ro = new ResizeObserver(() => {
      // Element-level size changes (breakpoints, image decode, etc.)
      softBuild(80);
    });

    SECTIONS.forEach((section) => {
      const view = section.querySelector(".c-hpin_view");
      const track = section.querySelector(".c-hpin_track");
      if (view) ro.observe(view);
      if (track) ro.observe(track);
      ro.observe(section);
    });
  }

  function hookResize() {
    let t = null;

    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => softBuild(0), 150);
    });

    window.addEventListener("orientationchange", () => {
      setTimeout(() => softBuild(0), 300);
    });

    // If breakpoint crosses mobile<->desktop, rebuild immediately
    if (mm && mm.addEventListener) {
      mm.addEventListener("change", () => softBuild(0));
    } else if (mm && mm.addListener) {
      // Safari < 14
      mm.addListener(() => softBuild(0));
    }
  }

  function hookBFCache() {
    // Back-forward cache restore (Safari/Firefox)
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) softBuild(0);
      else softBuild(0);
    });
  }

  // -----------------------------
  // Start ASAP (but measure after layout has had a tick)
  // -----------------------------
  function start() {
    // Build quickly so user can't scroll past before init
    requestAnimationFrame(() => requestAnimationFrame(build));

    // Staggered rebuilds for Webflow/layout settling
    [120, 300, 650, 1100].forEach((ms) => setTimeout(() => softBuild(0), ms));

    hookImages();
    hookFonts();
    hookWindowLoad();
    hookWebflowReady();
    hookResizeObserver();
    hookResize();
    hookBFCache();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
