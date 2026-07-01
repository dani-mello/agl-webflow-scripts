/* (function () {
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

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

    return [gold, dark].filter(Boolean);
  }

  function hardHide(panels) {
    panels.forEach((panel) => {
      panel.style.transform = "translateX(105%)";
    });

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

  function initPageWipe() {
    if (!document.body) {
      requestAnimationFrame(initPageWipe);
      return;
    }

    const panels = createWipe();

    if (!panels.length) {
      dispatchRevealed();
      return;
    }

    document.documentElement.classList.add("has-pagewipe-ready");

    if (prefersReduced || !window.gsap) {
      hardHide(panels);
      return;
    }

    // PAGE LOAD
    setCovered(panels);

    revealToLeft(panels, () => {
      setOffRight(panels);
      dispatchRevealed();
    });

    // PAGE EXIT
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

    // BACK / FORWARD CACHE
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;

      setCovered(panels);

      revealToLeft(panels, () => {
        setOffRight(panels);
        dispatchRevealed();
      });
    });
  }

  function waitForGSAP(attemptsLeft) {
    if (window.gsap) {
      initPageWipe();
      return;
    }

    if (attemptsLeft <= 0) {
      // GSAP did not load in time. Do not block the site.
      dispatchRevealed();
      return;
    }

    setTimeout(() => {
      waitForGSAP(attemptsLeft - 1);
    }, 50);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      waitForGSAP(40);
    });
  } else {
    waitForGSAP(40);
  }
})();
*/
