console.log("HERO HEADLINE ONLY (V1)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Prevent double init
  if (root.dataset.heroHeadlineInit === "1") return;
  root.dataset.heroHeadlineInit = "1";

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
  if (!headline || !h1) return;

  // kill only our trigger if hot reloaded
  var old = ScrollTrigger.getById("heroHeadlineOnly");
  if (old) old.kill();

  // --- helpers
  var originalText = h1.textContent;

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

  var chars = buildChars();

  gsap.set(headline, { autoAlpha: 0 });
  gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1, willChange: "transform" });

  function computeTargets() {
    var vw = window.innerWidth || 1200;
    var vh = window.innerHeight || 800;
    var radius = Math.sqrt(vw * vw + vh * vh) * 1.35; // guaranteed outside

    for (var i = 0; i < chars.length; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = radius * gsap.utils.random(0.9, 1.15);
      chars[i]._x = Math.cos(a) * r;
      chars[i]._y = Math.sin(a) * r;
      chars[i]._r = gsap.utils.random(-140, 140);
    }
  }

  computeTargets();

  // recompute per refresh (orientation/resize)
  ScrollTrigger.addEventListener("refreshInit", function () {
    computeTargets();
    gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
  });

  // --- fade in BEFORE scrolling
  gsap.to(headline, {
    delay: 0.3,          // tweak delay
    autoAlpha: 1,
    duration: 0.8,
    ease: "power2.out",
    onComplete: function () {
      ScrollTrigger.refresh(true);
    }
  });

  // --- scroll timeline (headline only)
  var tl = gsap.timeline({ defaults: { ease: "none" } });

  // Hold for a bit
  tl.to({}, { duration: 1.2 });

  // Fly out (no fading during travel)
  tl.to(chars, {
    x: function (i, el) { return el._x; },
    y: function (i, el) { return el._y; },
    rotate: function (i, el) { return el._r; },
    opacity: 1,
    duration: 2.0,
    ease: "power3.in",
    stagger: { each: 0.01, from: "center" }
  }, "out");

  // Hide headline only after the motion is clearly visible
  tl.set(headline, { autoAlpha: 0 }, "out+=2.05");

  ScrollTrigger.create({
    id: "heroHeadlineOnly",
    trigger: root,
    start: "top top",
    end: "+=5200",      // adjust scroll length here
    pin: true,
    scrub: 1.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onEnterBack: function () {
      // reset cleanly when scrubbing back up
      gsap.set(headline, { autoAlpha: 1 });
      chars = buildChars();
      gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1, willChange: "transform" });
      computeTargets();
    }
    // markers: true
  });
})();
