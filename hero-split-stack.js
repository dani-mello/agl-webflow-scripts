console.log("SPLIT STACK JS LOADED (V16.2)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

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
    console.warn("Missing headline or h1");
    return;
  }

  // Prevent flashes
  gsap.set(headline, { autoAlpha: 0 });
  gsap.set([p1, p2, p3], {
    opacity: 0,
    scale: 0.001,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  // ---- SplitText (words → chars for proper wrapping)
  var originalText = h1.textContent;

  var splitWords = new SplitText(h1, { type: "words" });
  var allChars = [];

  for (var i = 0; i < splitWords.words.length; i++) {
    var word = splitWords.words[i];
    var charsSplit = new SplitText(word, { type: "chars" });
    allChars = allChars.concat(charsSplit.chars);
    word._charsSplit = charsSplit;
  }

  h1._wordsSplit = splitWords;

  gsap.set(allChars, {
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    willChange: "transform"
  });

  // ---- Compute OFFSCREEN targets
  function computeTargets() {
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var radius = Math.sqrt(vw * vw + vh * vh) * 1.4;

    for (var i = 0; i < allChars.length; i++) {
      var a = Math.random() * Math.PI * 2;
      allChars[i]._x = Math.cos(a) * radius;
      allChars[i]._y = Math.sin(a) * radius;
      allChars[i]._r = gsap.utils.random(-120, 120);
    }
  }

  computeTargets();

  // ---- LOAD FADE (no scroll yet)
  gsap.to(headline, {
    autoAlpha: 1,
    duration: 2,
    ease: "power2.out",
    onComplete: initScroll
  });

  function initScroll() {
    var tl = gsap.timeline();

    // Hold
    tl.to({}, { duration: 1.2 });

    // Letters fly out
    tl.to(allChars, {
      x: function (i, el) { return el._x; },
      y: function (i, el) { return el._y; },
      rotate: function (i, el) { return el._r; },
      duration: 2,
      ease: "power3.in",
      stagger: { each: 0.01, from: "center" }
    }, "out");

    tl.set(headline, { autoAlpha: 0 }, "out+=2");

    tl.to(p1, { opacity: 1, scale: 1, rotate: 0, duration: 1.2 }, "out+=0.2");
    tl.to(p2, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "+=0.6");
    tl.to(p3, { opacity: 1, scale: 1, rotate: 0, duration: 1.1 }, "+=0.6");

    ScrollTrigger.create({
      trigger: root,
      start: "top top",
      end: "+=10000",
      pin: true,
      scrub: 1.8,
      animation: tl,
      invalidateOnRefresh: true,
      onRefreshInit: computeTargets
    });
  }
})();
