console.log("HERO: 3 VIDEOS (V2/V3 CURTAIN) + HEADLINE BURST (V5)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Prevent double init
  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

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
  if (old) old.kill();

  // ---- Elements ----
  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  // Clip reveal wrappers (must be full-bleed absolute/inset:0 in CSS)
  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  if (!headline || !h1) return;

  // Helper: Safari-safe clip-path set/tween
  function setCurtain(el, value) {
    if (!el) return;
    gsap.set(el, { clipPath: value, webkitClipPath: value });
  }

  function curtainClosed(el) {
    // Fully closed at centre (0 width) – opens outward
    setCurtain(el, "inset(0% 50% 0% 50%)");
  }

  function curtainOpen(tl, el, pos, dur) {
    if (!el) return tl.to({}, { duration: dur || 1.2 }, pos);
    return tl.to(
      el,
      {
        clipPath: "inset(0% 0% 0% 0%)",
        webkitClipPath: "inset(0% 0% 0% 0%)",
        duration: dur || 1.2,
        ease: "power2.inOut"
      },
      pos
    );
  }

  // ---- SplitText build (your logic) ----
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

  // Prevent headline flash
  gsap.set(headline, { autoAlpha: 0 });

  // Initial char state
  gsap.set(chars, {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    willChange: "transform"
  });

  // Initial reveal states
  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

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

  // Reset on refresh
  ScrollTrigger.addEventListener("refreshInit", function () {
    computeTargets();
    gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
    gsap.set(headline, { autoAlpha: 0 });
    curtainClosed(v2Reveal);
    curtainClosed(v3Reveal);
  });

  // Fade headline in (independent of scroll)
  gsap.to(headline, {
    delay: 0.2,
    autoAlpha: 1,
    duration: 0.9,
    ease: "power2.out",
    onComplete: function () {
      ScrollTrigger.refresh(true);
    }
  });

  // ---- Timeline (scrubbed) ----
  var tl = gsap.timeline();

  // Hold: video 1 running, headline visible
  tl.to({}, { duration: 0.8 });

  // Video 2 curtain open
  curtainOpen(tl, v2Reveal, "v2Open", 1.2);

  // Small hold
  tl.to({}, { duration: 0.35 });

  // Video 3 curtain open (on top)
  curtainOpen(tl, v3Reveal, "v3Open", 1.2);

  // Small hold
  tl.to({}, { duration: 0.5 });

  // Burst labels
  tl.addLabel("burstStart");

  tl.to(
    chars,
    {
      x: function (i, el) {
        return el._x;
      },
      y: function (i, el) {
        return el._y;
      },
      rotate: function (i, el) {
        return el._r;
      },
      opacity: 1,
      duration: 2.0,
      ease: "power3.in",
      stagger: { each: 0.01, from: "center" }
    },
    "burstStart"
  );

  tl.addLabel("burstEnd", "burstStart+=2.0");

  var burstStartTime = tl.labels.burstStart;
  var burstEndTime = tl.labels.burstEnd;

  ScrollTrigger.create({
    id: "heroSplitStack",
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

      if (t < burstStartTime) {
        gsap.set(headline, { autoAlpha: 1 });
        gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
      }

      if (t >= burstStartTime && t <= burstEndTime) {
        gsap.set(headline, { autoAlpha: 1 });
      }

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
