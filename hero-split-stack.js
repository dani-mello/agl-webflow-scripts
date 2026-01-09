console.log(
  "%cSPLIT STACK JS LOADED (V6)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

/* hero-split-stack-scroll.js (V6)
   Requires:
   - GSAP
   - ScrollTrigger
   - CSSRulePlugin  (for ::before / ::after animation)
*/
(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Make sure plugins exist
  if (typeof gsap === "undefined") {
    console.warn("GSAP not found. Load gsap.min.js before this script.");
    return;
  }
  if (typeof ScrollTrigger === "undefined") {
    console.warn("ScrollTrigger not found. Load ScrollTrigger.min.js before this script.");
    return;
  }
  if (typeof CSSRulePlugin === "undefined") {
    console.warn("CSSRulePlugin not found. Load CSSRulePlugin.min.js before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, CSSRulePlugin);

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

  // Grab pseudo-element rules (single-colon required here)
  // If your CSS selector is more specific, update these selectors to match.
  var beforeRule = CSSRulePlugin.getRule(".c-hero_h1:before");
  var afterRule  = CSSRulePlugin.getRule(".c-hero_h1:after");

  if (!beforeRule || !afterRule) {
    console.warn(
      "Couldn't find .c-hero_h1:before / :after rules. " +
      "Check that your CSS defines .c-hero_h1::before and .c-hero_h1::after on the published site."
    );
  }

  /* Reduced motion: show final state (no pin/scrub) */
  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    // Put headline in “opened + gone” state
    if (beforeRule) gsap.set(beforeRule, { x: "-12vw" });
    if (afterRule)  gsap.set(afterRule,  { x: "12vw"  });
    gsap.set(root.querySelector(".c-hero_headline"), { autoAlpha: 0 });

    safePlay(v3);
    return;
  }

  /* Initial state */
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  // Ensure headline is visible initially and pseudo splits are closed
  gsap.set(root.querySelector(".c-hero_headline"), { autoAlpha: 1 });
  if (beforeRule) gsap.set(beforeRule, { x: 0 });
  if (afterRule)  gsap.set(afterRule,  { x: 0 });

  /* Timeline */
  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // Event 1 – headline hold
  tl.to({}, { duration: 0.6 });

  // Event 2 – split headline + video 1 grows/levels
  tl.add(function () { safePlay(v1); }, "e2");

  if (beforeRule) tl.to(beforeRule, { x: "-12vw", duration: 0.9 }, "e2");
  if (afterRule)  tl.to(afterRule,  { x: "12vw",  duration: 0.9 }, "e2");

  // Fade headline away as it opens
  tl.to(".c-hero_headline", { autoAlpha: 0, duration: 0.35 }, "e2+=0.35");

  // Video 1
  tl.to(p1, { scale: 1, rotate: 0, duration: 1.1 }, "e2");

  // Event 3 – video 2
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v2); }, "e3");
  tl.to(p2, { scale: 1, rotate: 0, duration: 1.0 }, "e3");

  // Event 4 – video 3
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v3); }, "e4");
  tl.to(p3, { scale: 1, rotate: 0, duration: 1.0 }, "e4");

  /* ScrollTrigger (longer scroll = slower) */
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
      // Make headline visible again when scrubbing back up
      gsap.set(".c-hero_headline", { autoAlpha: 1 });
    }
  });

  /* Refresh after video metadata loads (Safari/iOS sizing fix) */
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () {
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  });
})();
