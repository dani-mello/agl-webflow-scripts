/* hero-split-stack.js
   Requires GSAP loaded before this script.
*/
(function () {
  const root = document.querySelector(".c-hero");
  if (!root) return;

  const leftHalf  = root.querySelector(".c-hero_h1-split--left");
  const rightHalf = root.querySelector(".c-hero_h1-split--right");

  const panels = {
    v1: root.querySelector(".c-hero_panel--v1"),
    v2: root.querySelector(".c-hero_panel--v2"),
    v3: root.querySelector(".c-hero_panel--v3"),
  };

  const videos = Array.from(root.querySelectorAll(".c-hero_video"));

  // Respect reduced motion
  const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Helper: play videos safely (mobile policies vary)
  function tryPlay(el) {
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    const p = el.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }

  // If reduced motion: show final state (video 3 full screen, no split anim)
  if (prefersReduced) {
    // Hide headline layer by splitting it offscreen quickly
    leftHalf.style.transform = "translateX(-10vw)";
    rightHalf.style.transform = "translateX(10vw)";

    Object.values(panels).forEach((p) => {
      if (!p) return;
      p.style.transform = "scale(1) rotate(0deg)";
    });

    // Ensure top layer is visible (v3 last in stack)
    tryPlay(videos[2]);
    return;
  }

  // Initial states
  gsap.set([panels.v1, panels.v2, panels.v3], {
    scale: 0,
    rotate: -6,            // “tilted a few degrees to the left”
    transformOrigin: "50% 50%"
  });

  // Keep headline halves aligned at start
  gsap.set([leftHalf, rightHalf], { x: 0 });

  // Build timeline
  const tl = gsap.timeline({
    defaults: { ease: "power3.inOut" }
  });

  // Event 1: Hold H1 for impact
  tl.to({}, { duration: 0.6 }); // pause

  // Event 2: Split H1 + grow video 1 simultaneously
  tl.add(() => tryPlay(videos[0]), "e2");
  tl.to(leftHalf,  { x: "-12vw", duration: 0.9 }, "e2");
  tl.to(rightHalf, { x: "12vw",  duration: 0.9 }, "e2");
  tl.to(panels.v1, {
    scale: 1,
    rotate: 0,             // slight clockwise movement to straight
    duration: 1.1
  }, "e2");

  // Small beat
  tl.to({}, { duration: 0.25 });

  // Event 3: Video 2 grows on top
  tl.add(() => tryPlay(videos[1]), "e3");
  tl.to(panels.v2, {
    scale: 1,
    rotate: 0,
    duration: 1.0
  }, "e3");

  // Small beat
  tl.to({}, { duration: 0.25 });

  // Event 4: Video 3 grows on top (final frame)
  tl.add(() => tryPlay(videos[2]), "e4");
  tl.to(panels.v3, {
    scale: 1,
    rotate: 0,
    duration: 1.0
  }, "e4");

  // Optional: stop earlier videos to save CPU once covered
  tl.add(() => {
    if (videos[0]) videos[0].pause();
    if (videos[1]) videos[1].pause();
  });
})();
