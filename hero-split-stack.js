console.log(
  "%cSPLIT STACK JS LOADED (V12 - SplitText + ScrambleText)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing. Load them before this script.");
    return;
  }

  // These may or may not be globally available depending on how you're loading GSAP/plugins
  if (typeof SplitText === "undefined") {
    console.warn("SplitText is not available globally. Make sure SplitText is loaded before this script.");
    return;
  }
  if (typeof ScrambleTextPlugin === "undefined") {
    console.warn("ScrambleTextPlugin is not available globally. Make sure ScrambleTextPlugin is loaded before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

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

  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // Initial video panels
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  gsap.set(headline, { autoAlpha: 1 });

  // Split the REAL H1 (SEO/LLM safe because the text is still in the H1)
  // SplitText handles accessibility nicely; still, keep it simple.
  var split = new SplitText(h1, { type: "chars" });
  var chars = split.chars;

  // Make sure chars animate smoothly
  gsap.set(chars, { willChange: "transform,opacity", opacity: 1, x: 0, y: 0, rotate: 0 });

  var originalText = h1.textContent;

  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // Event 1: headline hold
  tl.to({}, { duration: 0.6 });

  // Event 2: scramble burst + scatter + fade headline + video 1
  tl.add(function () { safePlay(v1); }, "e2");

  // Optional "decoder" burst (short and punchy)
  tl.to(h1, {
    duration: 0.35,
    scrambleText: {
      text: originalText,
      chars: "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      tweenLength: false
    }
  }, "e2");

  // Scatter letters off-screen
  tl.to(chars, {
    x: function () { return gsap.utils.random(-260, 260); },
    y: function () { return gsap.utils.random(-220, 220); },
    rotate: function () { return gsap.utils.random(-60, 60); },
    opacity: 0,
    duration: 0.9,
    stagger: { each: 0.012, from: "random" }
  }, "e2+=0.05");

  // Fade out the whole headline layer as video takes over
  tl.to(headline, { autoAlpha: 0, duration: 0.35 }, "e2+=0.35");

  // Video 1 grow/level
  tl.to(p1, { scale: 1, rotate: 0, duration: 1.1 }, "e2");

  // Event 3: video 2
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v2); }, "e3");
  tl.to(p2, { scale: 1, rotate: 0, duration: 1.0 }, "e3");

  // Event 4: video 3
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v3); }, "e4");
  tl.to(p3, { scale: 1, rotate: 0, duration: 1.0 }, "e4");

  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=5200",
    pin: true,
    scrub: 1.2,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onLeave: function () {
      safePause(v1);
      safePause(v2);
    },
    onEnterBack: function () {
      safePlay(v1);

      // Reset headline so it can replay when scrubbing back
      gsap.set(headline, { autoAlpha: 1 });
      gsap.set(chars, { opacity: 1, x: 0, y: 0, rotate: 0 });
      // Restore original text (ScrambleText changes it during tween)
      h1.textContent = originalText;

      // Re-split to avoid stale spans in some browsers
      try {
        split.revert();
        split = new SplitText(h1, { type: "chars" });
        chars = split.chars;
        gsap.set(chars, { willChange: "transform,opacity", opacity: 1, x: 0, y: 0, rotate: 0 });
      } catch (e) {}
    }
  });

  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () { ScrollTrigger.refresh(); },
      { once: true }
    );
  });
})();
