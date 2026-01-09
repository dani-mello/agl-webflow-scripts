console.log(
  "%cSPLIT STACK JS LOADED (V2)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

/* hero-split-stack-scroll.js
   GSAP + ScrollTrigger must be loaded before this script.
*/
(function () {
  const root = document.querySelector(".c-hero");
  if (!root) return;

  gsap.registerPlugin(ScrollTrigger);

  const leftHalf  = root.querySelector(".c-hero_h1-split--left");
  const rightHalf = root.querySelector(".c-hero_h1-split--right");

  const p1 = root.querySelector(".c-hero_panel--v1");
  const p2 = root.querySelector(".c-hero_panel--v2");
  const p3 = root.querySelector(".c-hero_panel--v3");

  const v1 = p1?.querySelector("video");
  const v2 = p2?.querySelector("video");
  const v3 = p3?.querySelector("video");

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function safePlay(el) {
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  function safePause(el) {
    if (!el) return;
    try { el.pause(); } catch (e) {}
  }

  // Reduced motion: show final state, no pin/scrub
  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    gsap.set(leftHalf, { x: "-12vw" });
    gsap.set(rightHalf, { x: "12vw" });
    safePlay(v3);
    return;
  }

  // Initial states
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -6,
    transformOrigin: "50% 50%"
  });
  gsap.set([leftHalf, rightHalf], { x: 0 });

  // Timeline: map “events” to scroll
  const tl
