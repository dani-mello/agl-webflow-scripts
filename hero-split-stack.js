console.log("HERO HEADLINE ONLY (V1.1 - reset on scrub)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

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

  var old = ScrollTrigger.getById("heroHeadlineOnly");
  if (old) old.kill();

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
    var radius = Math.sqrt(vw * vw + vh * vh) * 1.35;

    for (var i = 0; i < chars.length; i++) {
      var a = Math.random() * Math.PI * 2;
      var r = radius * gsap.utils.random(0.9, 1.15);
      chars[i]._x = Math.cos(a) * r;
      chars[i]._y = Math.sin(a) * r;
      chars[i]._r = gsap.utils.random(-140, 140);
    }
  }

  computeTargets();

  ScrollTrigger.addEventListener("refreshInit", function () {
    computeTargets();
    gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
  });

  // Fade in on load (not tied to scroll)
  gsap.to(headline, {
    delay: 0.3,
    autoAlpha: 1,
    duration: 0.8,
    ease: "power2.out",
    onComplete: function () {
      ScrollTrigger.refresh(true);
    }
  });

  // Timeline
  var tl = gsap.timeline();

  // Hold
  tl.to({}, { duration: 1.2 });

  // Label when burst starts
  tl.addLabel("burstStart");

  // Fly out
  tl.to(chars, {
    x: function (i, el) { return el._x; },
    y: function (i, el) { return el._y; },
    rotate: function (i, el) { return el._r; },
    opacity: 1,
    duration: 2.0,
    ease: "power3.in",
    stagger: { each: 0.01, from: "center" }
  }, "burstStart");

  // Label when burst ends
  tl.addLabel("burstEnd", "burstStart+=2.0");

  // IMPORTANT: don't permanently hide the headline in the timeline.
  // We'll control visibility based on progress in onUpdate.

  var burstStartTime = tl.labels.burstStart;
  var burstEndTime = tl.labels.burstEnd;

  var st = ScrollTrigger.create({
    id: "heroHeadlineOnly",
    trigger: root,
    start: "top top",
    end: "+=5200",
    pin: true,
    scrub: 1.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,

    onUpdate: function () {
      var t = tl.time();

      // When before burst: headline must be visible and chars must be home
      if (t < burstStartTime) {
        gsap.set(headline, { autoAlpha: 1 });
        // keep chars reset while user scrubs around in the hold zone
        gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
      }

      // During burst: headline visible so you can see letters leaving
      if (t >= burstStartTime && t <= burstEndTime) {
        gsap.set(headline, { autoAlpha: 1 });
      }

      // After burst: hide headline (letters are gone)
      if (t > burstEndTime) {
        gsap.set(headline, { autoAlpha: 0 });
      }
    },

    onEnterBack: function () {
      // Coming back from below: show headline again
      gsap.set(headline, { autoAlpha: 1 });
    }
    // markers: true
  });

})();
