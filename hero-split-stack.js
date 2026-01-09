console.log(
  "%cSPLIT STACK JS LOADED (V13 - SplitText Scatter)",
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
    console.warn("SplitText not available globally. Ensure it's loaded before this script.");
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

  // Split the REAL H1 (still SEO/LLM readable)
  var originalText = h1.textContent;
  var split = new SplitText(h1, { type: "chars" });
  var chars = split.chars;

  // Make the chars animatable
  gsap.set(chars, {
    willChange: "transform,opacity",
    opacity: 1,
    x: 0,
    y: 0,
    rotate: 0,
    transformOrigin: "50% 50%"
  });

  // Helper: outward "burst" vectors
  function burstX() {
    // random left/right with stronger push
    var dir = Math.random() < 0.5 ? -1 : 1;
    return dir * gsap.utils.random(180, 520);
  }
  function burstY() {
    var dir = Math.random() < 0.5 ? -1 : 1;
    return dir * gsap.utils.random(140, 420);
  }

  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // Event 1: hold
  tl.to({}, { duration: 0.6 });

  // Event 2: letters scatter + fade headline + video 1
  tl.add(function () { safePlay(v1); }, "e2");

  // Optional: tiny "pop" before scattering (feels premium)
  tl.to(chars, { scale: 1.03, duration: 0.12, stagger: { each: 0.006, from: "center" } }, "e2");

  // Scatter each character to its own direction
  tl.to(chars, {
    x: burstX,
    y: burstY,
    rotate: function () { return gsap.utils.random(-90, 90); },
    opacity: 0,
    scale: function () { return gsap.utils.random(0.85, 1.2); },
    duration: 0.95,
    stagger: { each: 0.012, from: "random" }
  }, "e2+=0.08");

  // Fade out whole headline layer as video takes over
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

      // Reset headline + chars so it replays nicely when scrubbing back
      gsap.set(headline, { autoAlpha: 1 });

      try {
        split.revert();
        h1.textContent = originalText;
        split = new SplitText(h1, { type: "chars" });
        chars = split.chars;
        gsap.set(chars, { opacity: 1, x: 0, y: 0, rotate: 0, scale: 1, willChange: "transform,opacity" });
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
