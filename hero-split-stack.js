console.log(
  "%cSPLIT STACK JS LOADED (V13 - SplitText Scatter)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing. Load them before this script.");
    return;
  }

  if (typeof SplitText === "undefined") {
    console.warn("SplitText not available globally. Ensure it's loaded before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  var p1 = root.querySelector(".c-hero_panel--v1");
  var p2 = root.querySelector(".c-hero_panel--v2");
  var p3 = root.querySelector(".c-hero_panel--v3");

  var v1 = p1 ? p1.querySelector("video") : null;
  var v2 = p2 ? p2.querySelector("video") : null;
  var v3 = p3 ? p3.querySelector("video") : null;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safePlay(el) {
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    try {
      var p = el.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {}
  }

  function safePause(el) {
    if (!el) return;
    try { el.pause(); } catch (e) {}
  }

  if (!headline || !h1) {
    console.warn("Missing .c-hero_headline and/or .c-hero_h1");
    return;
  }

  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // Initial video panels
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  gsap.set(headline, { autoAlpha: 1 });

  // Split the REAL H1 (still SEO/LLM readable)
  var originalText = h1.textContent;
  var split = new SplitText(h1, { type: "chars" });
  var chars = split.chars;

  // Make the chars animatable
  gsap.set(chars, {
    willChange: "transform,opacity",
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transformOrigin: "50% 50%"
  });

  // Helper: outward "burst" vectors
  function burstX() {
    // random left/r
