console.log("hero split stack clean v2");

(function () {
  const root = document.querySelector(".c-hero");
  if (!root) return;

  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) return;

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    console.warn("GSAP / ScrollTrigger missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill(true);

  const headline = root.querySelector(".c-hero_headline");
  const h1 = root.querySelector(".c-hero_h1");
  const v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  const v3Reveal = root.querySelector(".c-hero_reveal.is-v3");
  const gradient = root.querySelector(".l-bottom-gradient");
  const videos = root.querySelectorAll("video");

  if (!headline || !h1 || !v2Reveal || !v3Reveal) {
    console.warn("Hero elements missing");
    return;
  }

  // -----------------------------
  // Base setup
  // -----------------------------
  gsap.set(root, {
    position: "relative",
    overflow: "hidden"
  });

  gsap.set(headline, {
    autoAlpha: 1,
    zIndex: 20
  });

  if (gradient) {
    gsap.set(gradient, {
      autoAlpha: 1,
      zIndex: 10
    });
  }

  // Start v2 + v3 closed from center
  gsap.set([v2Reveal, v3Reveal], {
    left: "50%",
    xPercent: -50,
    width: "0%",
    transformOrigin: "50% 50%",
    overflow: "hidden"
  });

  // -----------------------------
  // Timeline
  // -----------------------------
  const tl = gsap.timeline({ paused: true });

  tl.to({}, { duration: 1.1 });

  tl.to(v2Reveal, {
    width: "100%",
    duration: 1.8,
    ease: "power2.inOut"
  });

  tl.to({}, { duration: 0.7 });

  tl.to(v3Reveal, {
    width: "100%",
    duration: 1.8,
    ease: "power2.inOut"
  });

  tl.to({}, { duration: 0.9 });

  // -----------------------------
  // ScrollTrigger
  // -----------------------------
  ScrollTrigger.create({
    id: "heroSplitStack",
    trigger: root,
    start: "top top",
    end: "+=4200",
    pin: true,
    scrub: 1.2,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl
  });

  // -----------------------------
  // Refresh once videos know size
  // -----------------------------
  let refreshQueued = false;

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        refreshQueued = false;
      });
    });
  }

  function allVideosReady() {
    if (!videos.length) return true;
    for (let i = 0; i < videos.length; i++) {
      if (videos[i].readyState < 1) return false;
    }
    return true;
  }

  if (allVideosReady()) {
    queueRefresh();
  } else {
    let waiting = 0;

    videos.forEach((video) => {
      if (video.readyState < 1) waiting++;
    });

    if (!waiting) {
      queueRefresh();
    } else {
      function done() {
        waiting--;
        if (waiting <= 0) queueRefresh();
      }

      videos.forEach((video) => {
        if (video.readyState < 1) {
          video.addEventListener("loadedmetadata", done, { once: true });
          video.addEventListener("error", done, { once: true });
        }
      });
    }
  }

  window.addEventListener("load", queueRefresh, { once: true });
})();
