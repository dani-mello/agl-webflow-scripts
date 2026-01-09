console.log("HERO SPLIT STACK JS LOADED (V17)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Prevent double init (Webflow preview/publish/soft reload)
  if (root.dataset.heroInit === "1") return;
  root.dataset.heroInit = "1";

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }
  if (typeof SplitText === "undefined") {
    console.warn("SplitText missing");
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

  if (!headline || !h1) {
    console.warn("Missing .c-hero_headline or .c-hero_h1");
    return;
  }

  // Polite refresh (avoid nuking other pinned sections)
  var refreshQueued = false;
  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        refreshQueued = false;
        ScrollTrigger.refresh(true);
      });
    });
  }

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

  // ---- Ensure initial hidden states (CSS should also set these to avoid flashes)
  gsap.set(headline, { autoAlpha: 0 });
  gsap.set([p1, p2, p3], {
    opacity: 0,
    scale: 0.001,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  // ---- SplitText with correct wrapping: words -> chars
  var originalText = h1.textContent;

  // Cleanup prior split if any
  function revertSplits() {
    try {
      if (h1._splitWordCharSplits) {
        for (var r = 0; r < h1._splitWordCharSplits.length; r++) {
          h1._splitWordCharSplits[r].revert();
        }
      }
      if (h1._splitWords) h1._splitWords.revert();
    } catch (e) {}
    h1._splitWords = null;
    h1._splitWordCharSplits = null;
  }

  function buildChars() {
    revertSplits();
    h1.textContent = originalText;

    var splitWords = new SplitText(h1, { type: "words" });
    var wordCharSplits = [];
    var chars = [];

    for (var i = 0; i < splitWords.words.length; i++) {
      var word = splitWords.words[i];
      var charsSplit = new SplitText(word, { type: "chars" });
      wordCharSplits.push(charsSplit);
      chars = chars.concat(charsSplit.chars);
    }

    h1._splitWords = splitWords;
    h1._splitWordCharSplits = wordCharSplits;

    return chars;
  }

  var allChars = buildChars();

  gsap.set(allChars, {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    willChange: "transform"
  });

  // ---- Offscreen targets (guaranteed outside viewport)
  function computeTargets() {
    var vw = window.innerWidth || 1200;
    var vh = window.innerHeight || 800;
    var radius = Math.sqrt(vw * vw + vh * vh) * 1.35;

    for (var i = 0; i < allChars.length; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = radius * gsap.utils.random(0.9, 1.15);
      allChars[i]._x = Math.cos(a) * r;
      allChars[i]._y = Math.sin(a) * r;
      allChars[i]._r = gsap.utils.random(-140, 140);
    }
  }

  computeTargets();

  // Recompute targets on refresh
  ScrollTrigger.addEventListener("refreshInit", function () {
    computeTargets();
    gsap.set(allChars, { x: 0, y: 0, rotate: 0, opacity: 1 });
  });

  // ---- Load fade BEFORE scroll takes over
  gsap.to(headline, {
    delay: 0.25, // small delay (your request)
    autoAlpha: 1,
    duration: 0.8,
    ease: "power2.out",
    onComplete: function () {
      queueRefresh();
      initScrollTimeline();
    }
  });

  function initScrollTimeline() {
    // Kill existing hero trigger if present (safe, only ours)
    var old = ScrollTrigger.getById("heroSplitStack");
    if (old) old.kill();

    var tl = gsap.timeline();

    // Hold on scroll
    tl.to({}, { duration: 1.2 });

    // Letters fly out (NO fading)
    tl.add(function () { safePlay(v1); }, "out");
    tl.to(allChars, {
      x: function (i, el) { return el._x; },
      y: function (i, el) { return el._y; },
      rotate: function (i, el) { return el._r; },
      opacity: 1,
      duration: 2.0,
      ease: "power3.in",
      stagger: { each: 0.01, from: "center" }
    }, "out");

    // Hide headline only after the motion is visible
    tl.set(headline, { autoAlpha: 0 }, "out+=2.05");

    // Reveal panels (opacity + scale)
    tl.to(p1, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, "out+=0.2");

    tl.to({}, { duration: 0.6 });
    tl.add(function () { safePlay(v2); }, "v2");
    tl.to(p2, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v2");

    tl.to({}, { duration: 0.6 });
    tl.add(function () { safePlay(v3); }, "v3");
    tl.to(p3, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v3");

    ScrollTrigger.create({
      id: "heroSplitStack",
      trigger: root,
      start: "top top",
      end: "+=10000",
      pin: true,
      scrub: 1.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl,
      onLeave: function () { safePause(v1); safePause(v2); },
      onEnterBack: function () {
        // Reset panels + headline
        gsap.set([p1, p2, p3], { opacity: 0, scale: 0.001, rotate: -20 });
        gsap.set(headline, { autoAlpha: 1 });

        // Rebuild splits for clean back-scrub
        allChars = buildChars();
        gsap.set(allChars, { opacity: 1, x: 0, y: 0, rotate: 0, willChange: "transform" });
        computeTargets();
        safePlay(v1);
      }
      // markers: true
    });
  }

  // Refresh after video metadata loads (polite)
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener("loadedmetadata", function () {
      queueRefresh();
    }, { once: true });
  });

})();
