console.log(
  "%cSPLIT STACK JS LOADED (V14 - WRAP + ENTRANCE + BURST)",
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

  // ---------- HARD HIDE PANELS TO PREVENT FLASH ----------
  // Opacity:0 ensures no brief paint. scale/rotate set too.
  gsap.set([p1, p2, p3], {
    opacity: 0,
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  // Ensure headline visible initially
  gsap.set(headline, { autoAlpha: 1 });

  if (prefersReduced) {
    gsap.set([p1, p2, p3], { opacity: 1, scale: 1, rotate: 0 });
    gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // ---------- SPLIT TEXT BUT KEEP NATURAL WRAPS ----------
  // 1) Split into words first (preserves wrapping)
  var originalText = h1.textContent;

  // Revert any previous split (in case of Webflow preview reload)
  try { if (h1._splitWords) h1._splitWords.revert(); } catch(e){}
  try { if (h1._splitChars) h1._splitChars.revert(); } catch(e){}

  var splitWords = new SplitText(h1, { type: "words" });
  var allChars = [];

  // 2) Split each word into chars (word spans keep wrapping intact)
  for (var i = 0; i < splitWords.words.length; i++) {
    var w = splitWords.words[i];
    var splitChars = new SplitText(w, { type: "chars" });
    allChars = allChars.concat(splitChars.chars);

    // store to revert later
    w._splitChars = splitChars;
  }

  // store to revert later
  h1._splitWords = splitWords;

  gsap.set(allChars, {
    willChange: "transform,opacity",
    opacity: 0,
    x: 0,
    y: 20,
    rotate: -8,
    scale: 0.98,
    transformOrigin: "50% 50%"
  });

  // ---------- HELPERS FOR "FLY OFF SCREEN" ----------
  function flyX() {
    // ensure it goes WELL beyond viewport
    var vw = window.innerWidth || 1200;
    var dir = Math.random() < 0.5 ? -1 : 1;
    return dir * gsap.utils.random(vw * 0.6, vw * 1.2);
  }
  function flyY() {
    var vh = window.innerHeight || 800;
    var dir = Math.random() < 0.5 ? -1 : 1;
    return dir * gsap.utils.random(vh * 0.6, vh * 1.2);
  }

  // ---------- TIMELINE ----------
  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // A) Entrance: fade/spiral-ish in
  tl.to(allChars, {
    opacity: 1,
    y: 0,
    rotate: 0,
    scale: 1,
    duration: 1.25,
    stagger: { each: 0.015, from: "center" }
  }, "in");

  // B) Hold (scroll dead zone)
  tl.to({}, { duration: 1.0 }, "hold"); // increase for longer hold

  // C) Burst out from center to random directions, fully off screen
  tl.add(function () { safePlay(v1); }, "out");

  tl.to(allChars, {
    x: flyX,
    y: flyY,
    rotate: function () { return gsap.utils.random(-140, 140); },
    opacity: 0,
    duration: 1.4,
    ease: "power3.in",
    stagger: { each: 0.01, from: "center" }
  }, "out");

  // Fade headline layer away as it bursts
  tl.to(headline, { autoAlpha: 0, duration: 0.4 }, "out+=0.25");

  // D) Video 1 appears (also fade opacity to avoid flash)
  tl.to(p1, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, "out");

  // E) Video 2
  tl.to({}, { duration: 0.35 });
  tl.add(function () { safePlay(v2); }, "v2");
  tl.to(p2, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v2");

  // F) Video 3
  tl.to({}, { duration: 0.35 });
  tl.add(function () { safePlay(v3); }, "v3");
  tl.to(p3, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "v3");

  // ---------- SCROLLTRIGGER (slower = longer end + softer scrub) ----------
  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=8200",  // longer scroll = slower animation
    pin: true,
    scrub: 1.6,     // smoother / slower response
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onLeave: function () {
      safePause(v1);
      safePause(v2);
    },
    onEnterBack: function () {
      // When scrubbing back, restore headline + reset chars
      gsap.set(headline, { autoAlpha: 1 });
      gsap.set([p1, p2, p3], { opacity: 0, scale: 0, rotate: -20 });

      // Revert splits and re-split to avoid “broken” DOM on back scrub
      try {
        // revert per-word char splits
        for (var i = 0; i < splitWords.words.length; i++) {
          var w = splitWords.words[i];
          if (w && w._splitChars) w._splitChars.revert();
        }
        splitWords.revert();
      } catch (e) {}

      // restore text and rebuild splits
      h1.textContent = originalText;

      splitWords = new SplitText(h1, { type: "words" });
      allChars = [];
      for (var j = 0; j < splitWords.words.length; j++) {
        var w2 = splitWords.words[j];
        var sc2 = new SplitText(w2, { type: "chars" });
        allChars = allChars.concat(sc2.chars);
        w2._splitChars = sc2;
      }

      gsap.set(allChars, {
        opacity: 0,
        x: 0,
        y: 20,
        rotate: -8,
        scale: 0.98
      });

      safePlay(v1);
    }
  });

  // Refresh after video metadata loads (Safari sizing)
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () { ScrollTrigger.refresh(); },
      { once: true }
    );
  });
})();
