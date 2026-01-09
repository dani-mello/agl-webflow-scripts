console.log(
  "%cSPLIT STACK JS LOADED (V17 - FADE IN + TRUE OFFSCREEN BURST)",
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

  var headline = root.querySelector(console.log(
  "%cSPLIT STACK JS LOADED (V16 - LOAD FADE + SCROLL BURST + VIDEOS)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing.");
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

  // --- Prevent any flashes (headline hidden in CSS already, but we enforce) ---
  gsap.set(headline, { autoAlpha: 0 });

  // --- Ensure panels start hidden but animatable ---
  gsap.set([p1, p2, p3], {
    opacity: 0,
    scale: 0.001,         // use tiny scale instead of 0 to avoid weird render edge cases
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  if (prefersReduced) {
    gsap.set(headline, { autoAlpha: 1 });
    gsap.set([p1, p2, p3], { opacity: 1, scale: 1, rotate: 0 });
    safePlay(v3);
    return;
  }

  // ---------------------------------------------------------
  // Split text with correct wrapping: words first, then chars
  // ---------------------------------------------------------
  var originalText = h1.textContent;

  // cleanup previous splits if any (designer/publish cycle)
  try {
    if (h1._splitWordCharSplits) {
      for (var r = 0; r < h1._splitWordCharSplits.length; r++) h1._splitWordCharSplits[r].revert();
    }
    if (h1._splitWords) h1._splitWords.revert();
  } catch (e) {}

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

  gsap.set(allChars, {
    willChange: "transform,opacity",
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transformOrigin: "50% 50%"
  });

  // ---------------------------------------------------------
  // Offscreen targets: guarantee OUTSIDE viewport
  // ---------------------------------------------------------
  function computeOffscreenTargets() {
    var vw = window.innerWidth || 1200;
    var vh = window.innerHeight || 800;
    var diag = Math.sqrt(vw * vw + vh * vh);
    var radius = diag * 1.35; // big enough to *definitely* leave screen

    allChars.forEach(function (ch) {
      var a = Math.random() * Math.PI * 2;
      var r = radius * gsap.utils.random(0.9, 1.15);
      ch._burstX = Math.cos(a) * r;
      ch._burstY = Math.sin(a) * r;
      ch._burstR = gsap.utils.random(-140, 140);
    });
  }

  computeOffscreenTargets();

  ScrollTrigger.addEventListener("refreshInit", function () {
    computeOffscreenTargets();
    gsap.set(allChars, { x: 0, y: 0, rotate: 0, opacity: 1 });
  });

  // ---------------------------------------------------------
  // Build scroll timeline (but only AFTER the load fade completes)
  // ---------------------------------------------------------
  function initScrollTimeline() {
    var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

    // Hold on scroll
    tl.to({}, { duration: 1.2 }); // increase = more hold before burst

    // Burst letters (NO fading while they move)
    tl.add(function () { safePlay(v1); }, "out");

    tl.to(allChars, {
      x: function (idx, el) { return el._burstX; },
      y: function (idx, el) { return el._burstY; },
      rotate: function (idx, el) { return el._burstR; },
      opacity: 1,              // keep visible while moving
      duration: 2.0,           // slower so you can SEE it
      ease: "power3.in",
      stagger: { each: 0.01, from: "center" }
    }, "out");

    // After they’ve flown out, hide the headline layer (no fade)
    tl.set(headline, { autoAlpha: 0 }, "out+=2.05");

    // Reveal video 1 (opacity + scale so you actually see it)
    tl.to(p1, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, "out+=0.2");

    // Video 2
    tl.to({}, { duration: 0.6 });
    tl.add(function () { safePlay(v2); }, "v2");
    tl.to(p2, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v2");

    // Video 3
    tl.to({}, { duration: 0.6 });
    tl.add(function () { safePlay(v3); }, "v3");
    tl.to(p3, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v3");

    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "+=10000",   // longer scroll = slower overall
      pin: true,
      scrub: 1.8,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      animation: tl,
      // markers: true, // uncomment to debug
      onLeave: function () { safePause(v1); safePause(v2); },
      onEnterBack: function () {
        safePlay(v1);

        // reset visuals when scrubbing back up
        gsap.set([p1, p2, p3], { opacity: 0, scale: 0.001, rotate: -20 });
        gsap.set(headline, { autoAlpha: 1 });
        gsap.set(allChars, { x: 0, y: 0, rotate: 0, opacity: 1 });

        computeOffscreenTargets();
      }
    });
  }

  // ---------------------------------------------------------
  // LOAD FADE (pre-scroll)
  // ---------------------------------------------------------
  gsap.to(headline, {
    autoAlpha: 1,
    duration: 0.8,
    ease: "power2.out",
    onComplete: function () {
      // Ensure ST sizes are correct after the load fade
      ScrollTrigger.refresh();
      initScrollTimeline();
    }
  });

  // Refresh after video metadata loads (Safari sizing fix)
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () { ScrollTrigger.refresh(); },
      { once: true }
    );
  });
})();
".c-hero_headline");
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

  // ---------------------------------------------------------
  // Timeline
  // ---------------------------------------------------------
  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // 1) Fade headline in
  tl.to(headline, { autoAlpha: 1, duration: 0.8 }, "in");

  // 2) Hold while scrolling
  tl.to({}, { duration: 1.0 }, "hold"); // increase to hold longer

  // 3) Burst letters outward (from each letter's current position)
  tl.add(function () { safePlay(v1); }, "out");

  tl.to(allChars, {
    x: function (i, el) { return el._burstX; },
    y: function (i, el) { return el._burstY; },
    rotate: function (i, el) { return el._burstR; },
    opacity: 0,
    duration: 1.6,                 // slower + more travel time
    ease: "power3.in",
    stagger: { each: 0.01, from: "center" }
  }, "out");

  // Fade headline layer away as letters fly
  tl.to(headline, { autoAlpha: 0, duration: 0.35 }, "out+=0.25");

  // 4) Video 1 grows/levels in
  tl.to(p1, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, "out");

  // 5) Video 2
  tl.to({}, { duration: 0.45 });
  tl.add(function () { safePlay(v2); }, "v2");
  tl.to(p2, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v2");

  // 6) Video 3
  tl.to({}, { duration: 0.45 });
  tl.add(function () { safePlay(v3); }, "v3");
  tl.to(p3, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v3");

  // ---------------------------------------------------------
  // ScrollTrigger (slower)
  // ---------------------------------------------------------
  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=9000",   // longer = slower
    pin: true,
    scrub: 1.8,      // softer scrub
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onLeave: function () {
      safePause(v1);
      safePause(v2);
    },
    onEnterBack: function () {
      safePlay(v1);

      // Reset panels + headline
      gsap.set([p1, p2, p3], { opacity: 0, scale: 0, rotate: -20 });
      gsap.set(headline, { autoAlpha: 0 });

      // Revert and rebuild splits (prevents weird DOM state on back scrub)
      try {
        if (h1._splitWordCharSplits) {
          for (var r = 0; r < h1._splitWordCharSplits.length; r++) {
            h1._splitWordCharSplits[r].revert();
          }
        }
        if (h1._splitWords) h1._splitWords.revert();
      } catch (e) {}

      h1.textContent = originalText;

      splitWords = new SplitText(h1, { type: "words" });
      wordCharSplits = [];
      allChars = [];
      for (var i2 = 0; i2 < splitWords.words.length; i2++) {
        var w2 = splitWords.words[i2];
        var sc2 = new SplitText(w2, { type: "chars" });
        wordCharSplits.push(sc2);
        allChars = allChars.concat(sc2.chars);
      }
      h1._splitWords = splitWords;
      h1._splitWordCharSplits = wordCharSplits;

      gsap.set(allChars, { x: 0, y: 0, rotate: 0, opacity: 1 });

      computeOffscreenTargets();
    }
  });

  // Refresh after video metadata loads
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () { ScrollTrigger.refresh(); },
      { once: true }
    );
  });
})();
