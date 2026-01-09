console.log("HERO HEADLINE + VIDEO GROW (V2)");

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

  // NEW: video move wrapper
  var bgMove = root.querySelector(".c-hero_bg-move");

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

  // Prevent headline flash (also do opacity:0 in CSS if possible)
  gsap.set(headline, { autoAlpha: 0 });

  // Initial char state
  gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1, willChange: "transform" });

  // NEW: initial video state (70vw-ish + tilt)
  if (bgMove) {
    gsap.set(bgMove, { scale: 0.7, rotate: -20, transformOrigin: "50% 50%" });
  }

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
    if (bgMove) gsap.set(bgMove, { scale: 0, rotate: -20 });
  });

  // Fade in headline BEFORE scroll takes over
  gsap.to(headline, {
    delay: 1,
    autoAlpha: 1,
    duration: 1.5,
    ease: "power2.out",
    onComplete: function () {
      ScrollTrigger.refresh(true);
    }
  });

  // Timeline (scrubbed)
  var tl = gsap.timeline();

  // VIDEO grow/untwist happens early (while headline is holding)
  // You can adjust duration to control how long it takes across scroll.
  if (bgMove) {
    tl.to(bgMove, { scale: 1, rotate: 0, duration: 1.2, ease: "power2.out" }, 0);
  }

  // Hold for a bit (after video settles)
  tl.to({}, { duration: 1.0 });

  tl.addLabel("burstStart");

  // Letters fly out
  tl.to(chars, {
    x: function (i, el) { return el._x; },
    y: function (i, el) { return el._y; },
    rotate: function (i, el) { return el._r; },
    opacity: 1,
    duration: 2.0,
    ease: "power3.in",
    stagger: { each: 0.01, from: "center" }
  }, "burstStart");

  tl.addLabel("burstEnd", "burstStart+=2.0");

  var burstStartTime = tl.labels.burstStart;
  var burstEndTime = tl.labels.burstEnd;

  ScrollTrigger.create({
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

      // Before burst: headline visible, chars home
      if (t < burstStartTime) {
        gsap.set(headline, { autoAlpha: 1 });
        gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
      }

      // During burst: keep headline visible so you can see letters leave
      if (t >= burstStartTime && t <= burstEndTime) {
        gsap.set(headline, { autoAlpha: 1 });
      }

      // After burst: hide headline (letters are gone)
      if (t > burstEndTime) {
        gsap.set(headline, { autoAlpha: 0 });
      }
    },

    onEnterBack: function () {
      gsap.set(headline, { autoAlpha: 1 });
    }

    // markers: true
  });
})();
