(function () {
  console.log("✅ PAGE WIPE JS LOADED — debug v3");

  // Do not run inside Webflow Designer.
  // Also avoid running inside the Webflow Editor UI.
  const isWebflowDesigner =
    window.Webflow &&
    typeof Webflow.env === "function" &&
    Webflow.env("design");

  const isWebflowEditor =
    document.documentElement.classList.contains("w-editor") ||
    document.body.classList.contains("w-editor") ||
    window.location.search.includes("edit");

  if (isWebflowDesigner || isWebflowEditor) {
    console.warn("⛔ PAGE WIPE STOPPED — Webflow Designer/Editor detected", {
      isWebflowDesigner,
      isWebflowEditor
    });
    return;
  }

  if (window.__pageWipeInit) {
    console.warn("⛔ PAGE WIPE STOPPED — already initialised");
    return;
  }

  window.__pageWipeInit = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const cfg = {
    coverDur: 350,
    revealDur: 850,
    staggerEach: 80,

    easeCover: "cubic-bezier(0.76, 0, 0.24, 1)",
    easeReveal: "cubic-bezier(0.22, 1, 0.36, 1)",

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
    console.log("✅ PAGE WIPE REVEALED EVENT FIRED");
  }

  function createWipe() {
    let root = document.querySelector(".c-pagewipe");

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

    // Move it to the very end of the body so it sits above everything.
    document.body.appendChild(root);

    const gold = root.querySelector(".c-pagewipe_panel--gold");
    const dark = root.querySelector(".c-pagewipe_panel--dark");

    // Critical root styles — inline so we do not depend on Webflow/CSS loading order.
    Object.assign(root.style, {
      position: "fixed",
      top: "0",
      right: "0",
      bottom: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      zIndex: "2147483647",
      pointerEvents: "none",
      overflow: "hidden",
      display: "block",
      opacity: "1",
      visibility: "visible"
    });

    // Critical panel styles.
    [gold, dark].forEach((panel, index) => {
      if (!panel) return;

      Object.assign(panel.style, {
        position: "absolute",
        top: "0",
        right: "0",
        bottom: "0",
        left: "0",
        width: "100%",
        height: "100%",
        display: "block",
        opacity: "1",
        visibility: "visible",
        willChange: "transform",
        transform: "translateX(0%)",
        background: index === 0 ? "#fcb124" : "#191919"
      });
    });

    const wipe = {
      root,
      gold,
      dark,
      panels: [gold, dark].filter(Boolean)
    };

    console.log("🧱 PAGE WIPE CREATED", {
      root,
      panelCount: wipe.panels.length
    });

    return wipe;
  }

  function setInstant(panels, xPercent) {
    panels.forEach((panel) => {
      panel.style.transition = "none";
      panel.style.transitionDelay = "0ms";
      panel.style.transform = `translateX(${xPercent}%)`;
    });
  }

  function animatePanel(panel, xPercent, duration, ease, delay) {
    if (!panel) return;

    panel.style.transitionProperty = "transform";
    panel.style.transitionDuration = `${duration}ms`;
    panel.style.transitionTimingFunction = ease;
    panel.style.transitionDelay = `${delay}ms`;
    panel.style.transform = `translateX(${xPercent}%)`;
  }

  function revealToLeft(wipe, onComplete) {
    const { gold, dark } = wipe;

    console.log("👋 PAGE WIPE REVEAL STARTED");

    // Dark leaves first, then gold.
    animatePanel(dark, -105, cfg.revealDur, cfg.easeReveal, 0);
    animatePanel(gold, -105, cfg.revealDur, cfg.easeReveal, cfg.staggerEach);

    window.setTimeout(() => {
      setInstant(wipe.panels, 105);
      if (onComplete) onComplete();
    }, cfg.revealDur + cfg.staggerEach + 80);
  }

  function coverFromRight(wipe, onComplete) {
    const { gold, dark } = wipe;

    console.log("👉 PAGE WIPE COVER STARTED");

    // Start both panels off-screen to the right.
    setInstant(wipe.panels, 105);

    // Force browser to register the off-screen position before animating.
    wipe.root.offsetHeight;

    // Gold covers first, dark follows.
    animatePanel(gold, 0, cfg.coverDur, cfg.easeCover, 0);
    animatePanel(dark, 0, cfg.coverDur, cfg.easeCover, cfg.staggerEach);

    window.setTimeout(() => {
      if (onComplete) onComplete();
    }, cfg.coverDur + cfg.staggerEach + 80);
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

    // Ignore same-page anchor links.
    if (url.pathname === window.location.pathname && url.hash) return false;

    return true;
  }

  function init() {
    if (!document.body) {
      window.requestAnimationFrame(init);
      return;
    }

    console.log("🚀 PAGE WIPE INIT RUNNING");

    const wipe = createWipe();

    if (!wipe.panels.length) {
      dispatchRevealed();
      return;
    }

    document.documentElement.classList.add("has-pagewipe-ready");

    if (prefersReduced) {
      setInstant(wipe.panels, 105);
      dispatchRevealed();
      return;
    }

    // PAGE LOAD:
    // Start covered.
    setInstant(wipe.panels, 0);

    // Wait two frames so the browser paints the covered state.
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        revealToLeft(wipe, () => {
          dispatchRevealed();
        });
      });
    });

    // PAGE EXIT:
    document.addEventListener(
      "click",
      (e) => {
        if (isIgnoredClick(e)) return;

        const a = e.target.closest("a");
        if (!a) return;
        if (!shouldInterceptLink(a)) return;

        e.preventDefault();

        const href = a.href;

        coverFromRight(wipe, () => {
          window.location.href = href;
        });
      },
      true
    );

    // Back/forward cache.
    window.addEventListener("pageshow", (e) => {
      if (!e.persisted) return;

      setInstant(wipe.panels, 0);

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          revealToLeft(wipe, () => {
            dispatchRevealed();
          });
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
