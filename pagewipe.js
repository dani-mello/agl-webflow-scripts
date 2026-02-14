// pagewipe.js
// Requires GSAP (no ScrollTrigger needed)
(function () {
  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",
    panels: ".c-pagewipe_panel",
    // Set to true if you want the "reveal" to run on EVERY page load.
    runRevealEveryPage: false,
    // Session key: reveal once per tab/session
    sessionKey: "agl_pagewipe_revealed",
    // Timing
    inDur: 0.55,
    outDur: 0.65,
    ease: "power2.inOut",
    // Stagger: dark leads, gold trails (gold shows behind as it follows)
    stagger: 0.08
  };

  function dispatchRevealed() {
    window.dispatchEvent(new CustomEvent("agl:pageRevealed"));
    window.__aglPageRevealed = true; // backup flag for scripts that check globals
  }

  function getEls() {
    const root = document.querySelector(cfg.root);
    if (!root) return null;
    const panels = Array.from(root.querySelectorAll(cfg.panels));
    if (!panels.length) return null;

    // Ensure order: gold first (behind), dark last (top) — matches markup above.
    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");
    return { root, panels: [gold, dark].filter(Boolean) };
  }

  function setClosed(panels) {
    // Closed = panels sitting above viewport (hidden)
    gsap.set(panels, { yPercent: -105 });
  }

  function setOpen(panels) {
    // Open = panels covering viewport
    gsap.set(panels, { yPercent: 0 });
  }

  function animateIn(panels, onComplete) {
    // Panels slide DOWN to cover screen (dark leads, gold trails)
    gsap.to(panels, {
      yPercent: 0,
      duration: cfg.inDur,
      ease: cfg.ease,
      stagger: cfg.stagger,
      onComplete
    });
  }

  function animateOut(panels, onComplete) {
    // Panels slide DOWN past viewport to reveal page
    gsap.to(panels, {
      yPercent: 105,
      duration: cfg.outDur,
      ease: cfg.ease,
      stagger: cfg.stagger,
      onComplete: () => {
        // Reset back to closed position for next transition
        gsap.set(panels, { yPercent: -105 });
        onComplete && onComplete();
      }
    });
  }

  function shouldInterceptLink(a) {
    if (!a || !a.href) return false;
    if (a.target && a.target !== "" && a.target !== "_self") return false;
    if (a.hasAttribute("download")) return false;
    if (a.getAttribute("rel") && a.getAttribute("rel").includes("external")) return false;

    const url = new URL(a.href, window.location.href);

    // Only same-origin
    if (url.origin !== window.location.origin) return false;

    // Let in-page anchors behave normally (or you can animate them separately)
    if (url.pathname === window.location.pathname && url.hash) return false;

    // Ignore mailto/tel
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;

    return true;
  }

  function init() {
    if (!window.gsap) {
      console.warn("[PageWipe] GSAP missing");
      return;
    }

    const els = getEls();
    if (!els) return;
    const { panels } = els;

    document.documentElement.classList.add("has-pagewipe-ready");

    // If reduced motion: skip fancy stuff, just ensure revealed event fires
    if (prefersReduced) {
      setClosed(panels);
      dispatchRevealed();
      return;
    }

    // Initial state: cover screen immediately to avoid flashes (super important)
    setOpen(panels);

    const alreadyRevealed = sessionStorage.getItem(cfg.sessionKey) === "1";
    const runReveal = cfg.runRevealEveryPage ? true : !alreadyRevealed;

    if (runReveal) {
      // Small delay gives the browser one paint, so reveal feels smoother
      gsap.delayedCall(0.05, () => {
        animateOut(panels, () => {
          sessionStorage.setItem(cfg.sessionKey, "1");
          dispatchRevealed();
        });
      });
    } else {
      // No reveal animation — just hide overlay and continue
      setClosed(panels);
      dispatchRevealed();
    }

    // Intercept internal link clicks for page transitions
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();
        const href = a.href;

        // Cover current page, then navigate
        setClosed(panels);
        animateIn(panels, () => {
          window.location.href = href;
        });
      },
      true
    );

    // If user hits back/forward and page is restored from cache
    window.addEventListener("pageshow", (e) => {
      if (e.persisted) {
        // Ensure overlay is closed & event fired
        setClosed(panels);
        dispatchRevealed();
      }
    });
  }

  // Start ASAP
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
