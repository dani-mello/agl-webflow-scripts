// pagewipe.js
// Right → Left pagewipe (FAST cover on click, smooth reveal on next page load)
// Requires GSAP
(function () {
  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",

    // Fast cover, smooth reveal (no bounce)
    coverDur: 0.28,     // very fast
    revealDur: 0.55,    // a touch slower so it feels intentional
    stagger: 0.06,      // subtle colour offset (not wobbly)

    // Smooth, premium easing (no bounce)
    easeCover: "power3.in",
    easeReveal: "power3.out"
  };

  function dispatchRevealed() {
    window.__aglPageRevealed = true;
    window.dispatchEvent(new CustomEvent("agl:pageRevealed"));
  }

  function getPanels() {
    const root = document.querySelector(cfg.root);
    if (!root) return null;

    // Gold behind, dark on top (your markup order)
    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");
    const panels = [gold, dark].filter(Boolean);

    return panels.length ? panels : null;
  }

  // States
  const setCovered = (panels) => gsap.set(panels, { xPercent: 0 });
  const setOffRight = (panels) => gsap.set(panels, { xPercent: 105 });
  const setOffLeft = (panels) => gsap.set(panels, { xPercent: -105 });

  // Animations
  function coverFromRight(panels, onComplete) {
    // Start off-screen RIGHT → cover
    gsap.to(panels, {
      xPercent: 0,
      duration: cfg.coverDur,
      ease: cfg.easeCover,
      stagger: cfg.stagger,
      onComplete
    });
  }

  function revealToLeft(panels, onComplete) {
    // Covering → move LEFT off-screen to reveal
    gsap.to(panels, {
      xPercent: -105,
      duration: cfg.revealDur,
      ease: cfg.easeReveal,
      stagger: cfg.stagger,
      onComplete
    });
  }

  function shouldInterceptLink(a) {
    if (!a || !a.href) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;

    const url = new URL(a.href, window.location.href);

    if (url.origin !== window.location.origin) return false;
    if (url.pathname === window.location.pathname && url.hash) return false;
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    return true;
  }

  function init() {
    if (!window.gsap) return;

    const panels = getPanels();
    if (!panels) return;

    document.documentElement.classList.add("has-pagewipe-ready");

    if (prefersReduced) {
      setOffRight(panels);
      dispatchRevealed();
      return;
    }

    // -------- PAGE LOAD: REVEAL (no waiting) --------
    // CSS starts panels covering (translateX(0)), so reveal immediately.
    setCovered(panels);
    revealToLeft(panels, () => {
      // Park off RIGHT ready for the next click
      setOffRight(panels);
      dispatchRevealed();
    });

    // -------- CLICK: COVER (fast, no waiting) --------
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();
        const href = a.href;

        // Ensure we start off RIGHT, then cover immediately
        setOffRight(panels);
        coverFromRight(panels, () => {
          window.location.href = href;
        });
      },
      true
    );

    // -------- BACK/FORWARD CACHE --------
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;

      setCovered(panels);
      revealToLeft(panels, () => {
        setOffRight(panels);
        dispatchRevealed();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
