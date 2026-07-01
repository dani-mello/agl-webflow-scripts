(function () {
  // Do not run inside Webflow Designer or Editor
  if (
    window.Webflow &&
    typeof Webflow.env === "function" &&
    (Webflow.env("design") || Webflow.env("editor"))
  ) {
    return;
  }

  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",

    // Fast cover, smooth reveal
    coverDur: 0.26,
    revealDur: 0.55,
    staggerEach: 0.06,

    easeCover: "power3.in",
    easeReveal: "power3.out",

    // Click ignore system
    ignoreAttr: "data-pagewipe-ignore",
    ignoreSelectors: [
      // In-page scroll UI / bottom navs
      ".c-bottom-nav",
      ".c-trip-bottom-nav",
      ".c-trip-bottom-nav_inner",

      // Inline gallery UI
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
    let root = document.querySelector(cfg.root);

    // Create the wipe element only on the live/published site
    if (!root) {
      root = document.createElement("div");
      root.className = "c-pagewipe";
      root.setAttribute("aria-hidden", "true");

      // Order matters:
      // gold is behind, dark is on top
      root.innerHTML = `
        <div class="c-pagewipe_panel c-pagewipe_panel--gold"></div>
        <div class="c-pagewipe_panel c-pagewipe_panel--dark"></div>
      `;

      document.body.appendChild(root);
    }

    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");

    const panels = [gold, dark].filter(Boolean);
    return panels.length ? panels : null;
  }

  // States
  const setCovered = (panels) => gsap.set(panels, { xPercent: 0 });
  const setOffRight = (panels) => gsap.set(panels, { xPercent: 105 });

  // Cover: gold first, then dark
  function coverFromRight(panels, onComplete) {
    gsap.to(panels, {
      xPercent: 0,
      duration: cfg.coverDur,
      ease: cfg.easeCover,
      stagger: { each: cfg.staggerEach, from: "start" },
      onComplete
    });
  }

  // Reveal: dark leaves first, then gold
  function revealToLeft(panels, onComplete) {
    gsap.to(panels, {
      xPercent: -105,
      duration: cfg.revealDur,
      ease: cfg.easeReveal,
      stagger: { each: cfg.staggerEach, from: "end" },
      onComplete
    });
  }

  function isIgnoredClick(e) {
    // Explicit opt-out for one-off buttons
    if (e.target.closest(`[${cfg.ignoreAttr}]`)) return true;

    // Ignore UI areas like inline gallery + bottom nav
    if (cfg.ignoreSelectors && e.target.closest(cfg.ignoreSelectors)) {
      return true;
    }

    return false;
  }

  function shouldInterceptLink(a) {
    if (!a || !a.href) return false;

    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;

    const href = a.getAttribute("href") || "";

    // Ignore in-page scroll links
    if (href === "#" || href.startsWith("#")) return false;
    if (a.hasAttribute("data-scroll-to")) return false;

    let url;

    try {
      url = new URL(a.href, window.location.href);
    } catch (err) {
      return false;
    }

    // Ignore mailto, tel, javascript, etc.
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    // Same origin only
    if (url.origin !== window.location.origin) return false;

    // Ignore same-page anchor links
    if (url.pathname === window.location.pathname && url.hash) return false;

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

    // PAGE LOAD:
    // Start covered, then reveal immediately
    setCovered(panels);

    revealToLeft(panels, () => {
      setOffRight(panels);
      dispatchRevealed();
    });

    // CLICK:
    // Cover fast, then navigate
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

    // Back/forward cache fix
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
