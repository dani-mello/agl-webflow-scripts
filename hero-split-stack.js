console.log(
  "%cSPLIT STACK JS LOADED (V8 - LETTER SCATTER)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing. Load them before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // --- Elements ---
  var headline = root.querySelector(".c-hero_headline");

  // Real, SEO-readable H1 (must exist in DOM)
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  // FX overlay container (add this empty div in your HTML: <div class="c-hero_h1-fx" aria-hidden="true"></div>)
  var fx = headline ? headline.querySelector(".c-hero_h1-fx") : null;

  var p1 = root.querySelector(".c-hero_panel--v1");
  var p2 = root.querySelector(".c-hero_panel--v2");
  var p3 = root.querySelector(".c-hero_panel--v3");

  var v1 = p1 ? p1.querySelector("video") : null;
  var v2 = p2 ? p2.querySelector("video") : null;
  var v3 = p3 ? p3.querySelector("video") : null;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // --- Helpers ---
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

  function buildFxLetters() {
    if (!h1 || !fx) return false;

    var text = h1.textContent || "";
    fx.innerHTML = "";

    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      fx.appendChild(span);
    }
    return true;
  }

  // --- Reduced motion fallback ---
  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    if (headline) gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // --- Initial states ---
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  if (headline) gsap.set(headline, { autoAlpha: 1 });

  // Make sure FX layer exists and is built
  var hasFx = buildFxLetters();
  if (!hasFx) {
    console.warn(
      "Missing .c-hero_h1 and/or .c-hero_h1-fx inside .c-hero_headline. " +
      "Add: <h1 class='c-
