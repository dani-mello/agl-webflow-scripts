console.log("new hero v3 (Safari/Firefox/Opera hardened)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Prevent double init
  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }
  if (typeof SplitText === "undefined") {
    console.warn("SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Kill only our trigger if hot reloaded
  var old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill(true);

  // -----------------------------
  // Browser detection
  // -----------------------------
  var ua = navigator.userAgent;
  var isFirefox = /firefox/i.test(ua);

  // Safari = AppleWebKit + Safari but NOT Chrome/Chromium/Android
  var isSafari =
    /safari/i.test(ua) &&
    /applewebkit/i.test(ua) &&
    !/chrome|crios|chromium|android/i.test(ua);

  // Opera on Chromium identifies with OPR/
  var isOpera = /OPR\//i.test(ua) || /Opera/i.test(ua);

  // ✅ Use transform curtains on Safari + Opera (fixes Safari first-frame issues + Opera shake)
  var useTransformCurtain = isSafari || isOpera;

  // -----------------------------
  // Elements
  // -----------------------------
  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  var v1Reveal = root.querySelector(".c-hero_reveal.is-v1");
  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  var gradient = root.querySelector(".l-bottom-gradient");

  if (!headline || !h1) return;

  headline.removeAttribute("aria-hidden");
  h1.removeAttribute("aria-hidden");

  function findWrap(revealEl) {
    if (!revealEl) return null;
    return revealEl.querySelector(".c-hero_video-wrap") || null;
  }

  var v1Wrap = findWrap(v1Reveal);
  var v2Wrap = findWrap(v2Reveal);
  var v3
