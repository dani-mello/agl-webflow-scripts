console.log(
  "%cSPLIT STACK JS LOADED (V3)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

/* hero-split-stack-scroll.js
   Requires GSAP + ScrollTrigger loaded before this script.
*/
(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  gsap.registerPlugin(ScrollTrigger);

  var leftHalf  = root.querySelector(".c-hero_h1-split--left");
  var rightHalf = root.querySelector(".c-hero_h1-split--right");

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

  /* Reduced motion: show final state */
  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    gsap.set(leftHalf,  { x: "-12vw" });
    gsap.set(rightHalf, { x: "12vw" });
    safePlay(v3);
    return;
  }

  /* Initial state */
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -6,
    transformOrigin: "50% 50%"
  });
  gsap.set([leftHalf, rightHalf], { x: 0 });

  /* Timeline */
  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // Event 1 – headline hold
  tl.to({}, { duration: 0.6 });

  // Event 2 – split headline + video 1
  tl.add(function () { safePlay(v1); }, "e2");
  tl.to(leftHalf,  { x: "-12vw", duration: 0.9 }, "e2");
  tl.to(rightHalf, { x: "12vw",  duration: 0.9 }, "e2");
  tl.to(p1, { scale: 1, rotate: 0, duration: 1.1 }, "e2");

  // Event 3 – video 2
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v2); }, "e3");
  tl.to(p2, { scale: 1, rotate: 0, duration: 1.0 }, "e3");

  // Event 4 – video 3
  tl.to({}, { duration: 0.25 });
  tl.add(function () { safePlay(v3); }, "e4");
  tl.to(p3, { scale: 1, rotate: 0, duration: 1.0 }, "e4");

  /* ScrollTrigger */
  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=5200",     // scroll distance
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
    }
  });

  /* Refresh after video metadata loads (Safari/iOS fix) */
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
