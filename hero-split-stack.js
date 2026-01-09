console.log(
  "%cSPLIT STACK JS LOADED (V7)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing. Load them before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  var leftHalf  = root.querySelector(".c-hero_split-half--left");
  var rightHalf = root.querySelector(".c-hero_split-half--right");
  var headline  = root.querySelector(".c-hero_headline");

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

  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    gsap.set(leftHalf,  { x: "-12vw" });
    gsap.set(rightHalf, { x: "12vw" });
    gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // Initial
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  gsap.set(headline, { autoAlpha: 1 });
  gsap.set([leftHalf, rightHalf], { x: 0 });

  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  tl.to({}, { duration: 0.6 });

  tl.add(function () { safePlay(v1); }, "e2");
  tl.to(leftHalf,  { x: "-12vw", duration: 0.9 }, "e2");
  tl.to(rightHalf, { x: "12vw",  duration: 0.9 }, "e2");
  tl.to(headline,  { autoAlpha: 0, duration: 0.35 }, "e2+=0.35");
  tl.to(p1, { scale: 1, rotate: 0, duration: 1.1 }, "e2");

  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v2); }, "e3");
  tl.to(p2, { scale: 1, rotate: 0, duration: 1.0 }, "e3");

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
      gsap.set(headline, { autoAlpha: 1 });
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
