// pagewipe.js
// Right → Left pagewipe (FAST cover on click, smooth reveal on next page load)
// Fixes:
// 1) Reveal stagger shows gold (dark leaves first)
// 2) Inline gallery arrows don't trigger wipe
// 3) Bottom menu / in-page scroll doesn't trigger wipe
(function () {
  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",

    // Fast cover, smooth reveal (no bounce)
    coverDur: 0.26,
    revealDur: 0.55,
    staggerEach: 0.06,

    easeCover: "power3.in",
    easeReveal: "power3.out",

    // Click ignore system
    ignoreAttr: "data-pagewipe-ignore",
    ignoreSelectors: [
      // Your in-page scroll UI / bottom navs (add more if needed)
      ".c-bottom-nav",
      ".c-trip-bottom-nav",
      ".c-trip-bottom-nav_inner",

      // Inline gallery UI (add your exact arrow classes if different)
      ".c-inline-gallery",
      ".c-inline-gallery_arrow",
      ".c-inline-gallery_btn",
      ".swiper-button-next",
      ".swiper-button-prev"
    ].join(",")
  };

  function dispatchRevealed() {
    window.__aglPageRevealed = true;
    window.dispatchEvent(new CustomEvent("agl:pageRevealed"));
  }

  function getPanels() {
    const root = document.querySelector(cfg.root);
    if (!root) return null;

    // Order is important: gold behind, dark on top
    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");
    const panels = [gold, dark].filter(Boolean);
    return panels.length ? panels : null;
  }

  // States
  const setCovered = (panels) => gsap.set(panels, { xPercent: 0 });
  const setOffRight = (panels) => gsap.set(panels, { xPercent: 105 });

  // Cover: gold then dark (dark arrives slightly after = still fine, but subtle)
  // Reveal: reverse stagger so DARK leaves first -> gold becomes visible
  function coverFromRight(panels, onComplete) {
    gsap.to(panels, {
      xPercent: 0,
      duration: cfg.coverDur,
      ease: cfg.easeCover,
      stagger: { each: cfg.staggerEach, from: "start" },
      onComplete
    });
  }

  function revealToLeft(panels, onComplete) {
    gsap.to(panels, {
      xPercent: -105,
      duration: cfg.revealDur,
      ease: cfg.easeReveal,
      // ✅ KEY FIX: dark (last / on top) moves first
      stagger: { each: cfg.staggerEach, from: "end" },
      onComplete
    });
  }

  function isIgnoredClick(e) {
    // Explicit opt-out (best for one-off buttons)
    if (e.target.closest(`[${cfg.ignoreAttr}]`)) return true;

    // Ignore UI areas like inline gallery + bottom nav
    if (cfg.ignoreSelectors && e.target.closest(cfg.ignoreSelectors)) return true;

    return false;
  }

  function shouldInterceptLink(a) {
    if (!a || !a.href) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;

    // Ignore "scroll within page" patterns
    const href = a.getAttribute("href") || "";
    if (href === "#" || href.startsWith("#")) return false;
    if (a.hasAttribute("data-scroll-to")) return false;

    const url = new URL(a.href, window.location.href);

    // same origin only
    if (url.origin !== window.location.origin) return false;

    // allow in-page anchors
    if (url.pathname === window.location.pathname && url.hash) return false;

    // ignore mailto/tel
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

    // PAGE LOAD: start covered (CSS should do this too), then reveal immediately
    setCovered(panels);
    revealToLeft(panels, () => {
      setOffRight(panels);
      dispatchRevealed();
    });

    // CLICK: cover fast, then navigate
    document.addEventListener(
      "click",
      (e) => {
        if (isIgnoredClick(e)) return;

        const a = e.target.closest("a");
        if (!a) return;
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();
        const href = a.href;

        setOffRight(panels);
        coverFromRight(panels, () => {
          window.location.href = href;
        });
      },
      true
    );

    // Back/forward cache
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
