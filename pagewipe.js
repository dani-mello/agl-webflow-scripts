(function () {
  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",

    coverDur: 0.26,
    revealDur: 0.55,
    staggerEach: 0.06,

    easeCover: "power3.in",
    easeReveal: "power3.out",

    ignoreAttr: "data-pagewipe-ignore",

    ignoreSelectors: [
      ".c-bottom-nav",
      ".c-trip-bottom-nav",
      ".c-trip-bottom-nav_inner",

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

    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");

    const panels = [gold, dark].filter(Boolean);

    return panels.length ? panels : null;
  }

  function setCovered(panels) {
    gsap.set(panels, { xPercent: 0 });
  }

  function setOffRight(panels) {
    gsap.set(panels, { xPercent: 105 });
  }

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

      // dark leaves first, gold follows
      stagger: { each: cfg.staggerEach, from: "end" },

      onComplete
    });
  }

  function isIgnoredClick(e) {
    if (!e.target || !e.target.closest) return true;

    if (e.target.closest(`[${cfg.ignoreAttr}]`)) return true;

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

    if (href === "#" || href.startsWith("#")) return false;
    if (a.hasAttribute("data-scroll-to")) return false;
    if (a.hasAttribute(cfg.ignoreAttr)) return false;

    let url;

    try {
      url = new URL(a.href, window.location.href);
    } catch (err) {
      return false;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.origin !== window.location.origin) return false;

    // ignore same-page anchor links
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

    // PAGE LOAD
    // Start covered, then reveal to the left.
    setCovered(panels);

    requestAnimationFrame(() => {
      revealToLeft(panels, () => {
        setOffRight(panels);
        dispatchRevealed();
      });
    });

    // LINK CLICKS
    document.addEventListener(
      "click",
      function (e) {
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

    // BACK/FORWARD CACHE
    window.addEventListener("pageshow", function (e) {
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
