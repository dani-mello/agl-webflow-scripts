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

  function createWipe() {
    let root = document.querySelector(cfg.root);

    if (!root) {
      root = document.createElement("div");
      root.className = "c-pagewipe";
      root.setAttribute("aria-hidden", "true");

      root.innerHTML = `
        <div class="c-pagewipe_panel c-pagewipe_panel--gold"></div>
        <div class="c-pagewipe_panel c-pagewipe_panel--dark"></div>
      `;

      document.body.appendChild(root);
    }

    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");

    return {
      root,
      panels: [gold, dark].filter(Boolean)
    };
  }

  function forceHide(wipe) {
    if (!wipe || !wipe.panels || !wipe.panels.length) return;

    if (window.gsap) {
      gsap.killTweensOf(wipe.panels);
      gsap.set(wipe.panels, { xPercent: 105 });
    } else {
      wipe.panels.forEach((panel) => {
        panel.style.transform = "translateX(105%)";
      });
    }

    dispatchRevealed();
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
      overwrite: true,
      onComplete
    });
  }

  function revealToLeft(panels, onComplete) {
    gsap.to(panels, {
      xPercent: -105,
      duration: cfg.revealDur,
      ease: cfg.easeReveal,
      stagger: { each: cfg.staggerEach, from: "end" },
      overwrite: true,
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

    let url;

    try {
      url = new URL(a.href, window.location.href);
    } catch (err) {
      return false;
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    if (url.origin !== window.location.origin) return false;

    if (url.pathname === window.location.pathname && url.hash) return false;

    return true;
  }

  function init() {
    if (!document.body) {
      window.requestAnimationFrame(init);
      return;
    }

    const wipe = createWipe();

    if (!wipe.panels.length) {
      dispatchRevealed();
      return;
    }

    document.documentElement.classList.add("has-pagewipe-ready");

    // If GSAP does not exist for some reason, do not cover the site.
    if (!window.gsap || prefersReduced) {
      forceHide(wipe);
      return;
    }

    // Safety net: if anything gets stuck, force the wipe away.
    const revealFallback = window.setTimeout(() => {
      forceHide(wipe);
    }, 1800);

    // PAGE LOAD:
    // Start covered, reveal immediately.
    setCovered(wipe.panels);

    revealToLeft(wipe.panels, () => {
      window.clearTimeout(revealFallback);
      setOffRight(wipe.panels);
      dispatchRevealed();
    });

    // CLICK:
    // Cover fast, then navigate.
    document.addEventListener(
      "click",
      (e) => {
        if (isIgnoredClick(e)) return;

        const a = e.target.closest("a");
        if (!a) return;
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();

        const href = a.href;

        setOffRight(wipe.panels);

        coverFromRight(wipe.panels, () => {
          window.location.href = href;
        });
      },
      true
    );

    // Back/forward cache fix
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;

      const bfcacheFallback = window.setTimeout(() => {
        forceHide(wipe);
      }, 1800);

      setCovered(wipe.panels);

      revealToLeft(wipe.panels, () => {
        window.clearTimeout(bfcacheFallback);
        setOffRight(wipe.panels);
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
