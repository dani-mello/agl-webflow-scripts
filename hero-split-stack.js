console.log(
  "%cSPLIT STACK JS LOADED (V15 - FADE IN + TRUE OFFSCREEN BURST)",
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
    console.warn("SplitText not available globally.");
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

  // Panels are hidden in CSS now (opacity:0). Still set transform baseline here:
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  if (prefersReduced) {
    gsap.set([p1, p2, p3], { opacity: 1, scale: 1, rotate: 0 });
    gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // ---------------------------------------------------------
  // PREVENT "FLASH" BEFORE TIMELINE: hide headline immediately
  // ---------------------------------------------------------
  gsap.set(headline, { autoAlpha: 0 });

  // ---------------------------------------------------------
  // Split text with correct wrapping: words first, then chars
  // ---------------------------------------------------------
  var originalText = h1.textContent;

  // Clean up any previous splits
  try { if (h1._splitWords) h1._splitWords.revert(); } catch (e) {}
  try { if (h1._splitWordCharSplits) {
    for (var r = 0; r < h1._splitWordCharSplits.length; r++) {
      h1._splitWordCharSplits[r].revert();
    }
  } } catch (e) {}

  var splitWords = new SplitText(h1, { type: "words" });
  var wordCharSplits = [];
  var allChars = [];

  for (var i = 0; i < splitWords.words.length; i++) {
    var w = splitWords.words[i];
    var sc = new SplitText(w, { type: "chars" });
    wordCharSplits.push(sc);
    allChars = allChars.concat(sc.chars);
  }

  h1._splitWords = splitWords;
  h1._splitWordCharSplits = wordCharSplits;

  // Start state for chars: visible position, but we will fade them in via headline fade
  gsap.set(allChars, {
    willChange: "transform,opacity",
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transformOrigin: "50% 50%"
  });

  // ---------------------------------------------------------
  // Offscreen burst vectors (guaranteed out of viewport)
  // ---------------------------------------------------------
  function computeOffscreenTargets() {
    var vw = window.innerWidth || 1200;
    var vh = window.innerHeight || 800;
    var diag = Math.sqrt(vw * vw + vh * vh);

    // Push beyond diagonal so it exits no matter the angle.
    var radius = diag * 1.15;

    // Assign each char a consistent random angle + radius multiplier
    allChars.forEach(function (ch) {
      // random angle 0..2pi
      var a = Math.random() * Math.PI * 2;

      // vary slightly so it feels organic
      var r = radius * gsap.utils.random(0.85, 1.25);

      ch._burstX = Math.cos(a) * r;
      ch._burstY = Math.sin(a) * r;

      // optional slight rotation variance
      ch._burstR = gsap.utils.random(-140, 140);
    });
  }

  computeOffscreenTargets();

  // Recompute on refresh/resize for true offscreen
  ScrollTrigger.addEventListener("refreshInit", function () {
    computeOffscreenTargets();
    gsap.set(allChars, { x: 0, y: 0, rotate: 0, opacity: 1 });
  });

  // -----
