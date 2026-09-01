/*
Hero Split Stack
Alpine Guides

Do not modify without testing in:
Chrome / Safari / Firefox
*/

(function () {
  const root = document.querySelector(".c-hero");
  if (!root) return;

  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (prefersReduced) {
    window.__HERO_READY__ = true;
    return;
  }

  if (
    typeof gsap === "undefined" ||
    typeof ScrollTrigger === "undefined"
  ) {
    console.warn("GSAP / ScrollTrigger missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  const old = ScrollTrigger.getById("heroSplitStack");

  if (old) {
    old.kill(true);
  }

  const headline =
    root.querySelector(".c-hero_headline");

  const h1 =
    root.querySelector(".c-hero_h1");

  const v2Reveal =
    root.querySelector(".c-hero_reveal.is-v2");

  const v3Reveal =
    root.querySelector(".c-hero_reveal.is-v3");

  const gradient =
    root.querySelector(".l-bottom-gradient");

  const videos =
    Array.from(root.querySelectorAll("video"));

  if (
    !headline ||
    !h1 ||
    !v2Reveal ||
    !v3Reveal
  ) {
    console.warn("Hero elements missing");
    return;
  }

  // --------------------------------------------------
  // Base setup
  // --------------------------------------------------

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

  // Start v2 + v3 closed from centre
  gsap.set(
    [v2Reveal, v3Reveal],
    {
      left: "50%",
      xPercent: -50,
      width: "0%",
      transformOrigin: "50% 50%",
      overflow: "hidden"
    }
  );

  // --------------------------------------------------
  // Timeline
  // --------------------------------------------------

  const tl =
    gsap.timeline({
      paused: true
    });

  tl.to({}, {
    duration: 1.1
  });

  tl.to(v2Reveal, {
    width: "100%",
    duration: 1.8,
    ease: "power2.inOut"
  });

  tl.to({}, {
    duration: 0.7
  });

  tl.to(v3Reveal, {
    width: "100%",
    duration: 1.8,
    ease: "power2.inOut"
  });

  tl.to({}, {
    duration: 0.9
  });

  // --------------------------------------------------
  // Hero ScrollTrigger
  // --------------------------------------------------

  ScrollTrigger.create({
    id: "heroSplitStack",

    trigger: root,

    start: "top top",
    end: "+=4200",

    pin: true,
    pinSpacing: false,

    scrub: 1.2,

    anticipatePin: 1,


    // Hero must be measured before downstream pins.
    refreshPriority: 100,

    animation: tl
  });

  // --------------------------------------------------
  // IMPORTANT:
  // Hero gets ONE startup refresh only.
  //
  // Previously the video-ready callback and window.load
  // could both refresh ScrollTrigger, meaning the gallery
  // could be recalculated after it had already been built.
  // --------------------------------------------------

  let refreshQueued = false;
  let startupRefreshDone = false;

  function finishHeroSetup() {
    if (startupRefreshDone) return;
    if (refreshQueued) return;

    refreshQueued = true;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (startupRefreshDone) return;

        // Hero trigger first.
        ScrollTrigger.sort();

        // One global startup measurement.
        ScrollTrigger.refresh(true);

        startupRefreshDone = true;
        refreshQueued = false;

        // Split Gallery may now initialise.
        window.__HERO_READY__ = true;
      });
    });
  }

  // --------------------------------------------------
  // Wait until hero video dimensions are known.
  // --------------------------------------------------

  function videosReady() {
    if (!videos.length) {
      return true;
    }

    return videos.every(
      (video) => video.readyState >= 1
    );
  }

  if (videosReady()) {
    finishHeroSetup();
    return;
  }

  let remaining =
    videos.filter(
      (video) => video.readyState < 1
    ).length;

  function videoDone() {
    remaining--;

    if (remaining <= 0) {
      finishHeroSetup();
    }
  }

  videos.forEach((video) => {
    if (video.readyState >= 1) return;

    video.addEventListener(
      "loadedmetadata",
      videoDone,
      { once: true }
    );

    video.addEventListener(
      "error",
      videoDone,
      { once: true }
    );
  });

  // Safety fallback only.
  // It does NOT cause another refresh if the video
  // callbacks have already completed.
  setTimeout(() => {
    finishHeroSetup();
  }, 3000);
})();
