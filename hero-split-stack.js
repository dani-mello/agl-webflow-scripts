(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

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

  var old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill();

  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  // ✅ NEW: bottom gradient
  var gradient = root.querySelector(".l-bottom-gradient");

  if (!headline || !h1) return;

  function forceFullBleed(el) {
    if (!el) return;
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
  }
  forceFullBleed(v2Reveal);
  forceFullBleed(v3Reveal);

  function setClip(el, value) {
    if (!el) return;
    gsap.set(el, { clipPath: value, webkitClipPath: value });
  }

  function curtainClosed(el) {
    setClip(el, "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)");
  }

  function curtainOpen(tl, el, pos, dur) {
    if (!el) return tl.to({}, { duration: dur || 1.2 }, pos);

    return tl.to(
      el,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        webkitClipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: dur || 1.2,
        ease: "power2.inOut"
      },
      pos
    );
  }

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

  // ---- LOCK HEADLINE COLOUR ----
  var lockedColor = window.getComputedStyle(h1).color;
  gsap.set(h1, { color: lockedColor });
  gsap.set(chars, { color: lockedColor });

  // ✅ NEW: enforce correct stacking order (prevents the seam + keeps headline above gradient)
  // videos (z 1-3) < gradient (z 10) < headline (z 20)
  if (gradient) {
    gsap.set(gradient, {
      zIndex: 10,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      force3D: true
    });
  }
  gsap.set(headline, { zIndex: 20, position: "absolute" });

  gsap.set(headline, { autoAlpha: 0 });

  gsap.set(chars, {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    willChange: "transform"
  });

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

  ScrollTrigger.addEventListener("refreshInit", function () {
    computeTargets();

    gsap.set(chars, { x: 0, y: 0, rotate: 0, opacity: 1 });
    gsap.set(headline, { autoAlpha: 0 });

    lockedColor = window.getComputedStyle(h1).color;
    gsap.set(h1, { color: lockedColor });
    gsap.set(chars, { color: lockedColor });

    curtainClosed(v2Reveal);
    curtainClosed(v3Reveal);

    // keep gradient stacking stable on refresh
    if (gradient) gsap.set(gradient, { zIndex: 10 });
    gsap.set(headline, { zIndex: 20 });
  });

  // Headline fade in (before scroll)
  gsap.to(headline, {
    delay: 3,
    autoAlpha: 1,
    duration: 2,
    ease: "power2.out",
    onComplete: function () {
      ScrollTrigger.refresh(true);
    }
  });

  var tl = gsap.timeline();

  // Optional: make gradient slightly stronger as scroll begins (helps hide seams)
  // If you want it constant, delete these two lines.
  if (gradient) gsap.set(gradient, { autoAlpha: 1 });
  if (gradient) tl.fromTo(gradient, { autoAlpha: 0.85 }, { autoAlpha: 1, duration: 0.6 }, 0);

  tl.to({}, { duration: 1 });
  curtainOpen(tl, v2Reveal, "v2Open", 2);
  tl.to({}, { duration: 0.35 });
  curtainOpen(tl, v3Reveal, "v3Open", 2);
  tl.to({}, { duration: 1 });

  tl.addLabel("burstStart");

  tl.to(
    chars,
    {
      x: function (i, el) { return el._x; },
      y: function (i, el) { return el._y; },
      rotate: function (i, el) { return el._r; },
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
