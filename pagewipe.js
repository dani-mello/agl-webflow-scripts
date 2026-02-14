// pagewipe.js
// Right → Left elastic pagewipe (cover on click, reveal on new page load)
// Requires GSAP
(function () {
  if (window.__pageWipeInit) return;
  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    root: ".c-pagewipe",

    // Timing (slower / more premium)
    coverDur: 0.9,   // IN: from right to cover
    revealDur: 1.05, // OUT: to left to reveal
    stagger: 0.14,

    // Elastic feel
    easeCover: "elastic.out(1, 0.65)",
    easeReveal: "elastic.inOut(1, 0.65)",

    // Run reveal on EVERY page load
    runRevealEveryPage: true
  };

  function dispatchRevealed() {
    window.__aglPageRevealed = true;
    window.dispatchEvent(new CustomEvent("agl:pageRevealed"));
  }

  function getPanels() {
    const root = document.querySelector(cfg.root);
    if (!root) return null;

    // Order matters: gold behind, dark on top (your markup order)
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
  function animateCoverFromRight(panels, onComplete) {
    // Panels start off-screen RIGHT → move to COVER (x=0)
    gsap.to(panels, {
      xPercent: 0,
      duration: cfg.coverDur,
      ease: cfg.easeCover,
      stagger: cfg.stagger,
      onComplete
    });
  }

  function animateRevealToLeft(panels, onComplete) {
    // Panels move left past viewport to REVEAL
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
      // Don’t animate; just get the overlay out of the way
      setOffRight(panels);
      dispatchRevealed();
      return;
    }

    // ---------- PAGE LOAD (REVEAL) ----------
    // Because CSS defaults panels to COVER (translateX(0)),
    // we reveal by sliding them OFF LEFT.
    //
    // After revealing, park panels OFF RIGHT so the next click can slide them in.
    setCovered(panels);

    if (cfg.runRevealEveryPage) {
      gsap.delayedCall(0.08, () => {
        animateRevealToLeft(panels, () => {
          // Reset for next click: off RIGHT
          setOffRight(panels);
          dispatchRevealed();
        });
      });
    } else {
      setOffRight(panels);
      dispatchRevealed();
    }

    // ---------- LINK CLICK (COVER) ----------
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();
        const href = a.href;

        // Ensure start state is off RIGHT, then cover
        setOffRight(panels);
        animateCoverFromRight(panels, () => {
          // Stay covered while navigating
          window.location.href = href;
        });
      },
      true
    );

    // ---------- BACK/FORWARD CACHE ----------
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;

      // When coming from bfcache, replay reveal cleanly
      setCovered(panels);
      animateRevealToLeft(panels, () => {
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
