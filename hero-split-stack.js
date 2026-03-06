
console.log("hero split stack v4.2 - mapped to real structure");

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
    typeof ScrollTrigger === "undefined" ||
    typeof SplitText === "undefined"
  ) {
    console.warn("GSAP / ScrollTrigger / SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  const old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill(true);

  const headline = root.querySelector(".c-hero_headline");
  const h1 = headline?.querySelector(".c-hero_h1");
  const gradient = root.querySelector(".l-bottom-gradient");

  const layers = root.querySelectorAll(".c-hero_layer");
  const reveals = root.querySelectorAll(".c-hero_reveal");
  const videos = root.querySelectorAll("video");

  // expected:
  // layer 1 = base video
  // reveal 1 = second video reveal
  // reveal 2 = third video reveal
  const baseLayer = layers[0];
  const v2Reveal = reveals[0];
  const v3Reveal = reveals[1];

  if (!headline || !h1 || !baseLayer || !v2Reveal || !v3Reveal) {
    console.warn("Hero structure incomplete");
    return;
  }

  gsap.set(root, {
    position: "relative",
    overflow: "hidden"
  });

  gsap.set(layers, {
    position: "absolute",
    inset: 0
  });

  gsap.set(baseLayer, { zIndex: 1 });
  if (layers[1]) gsap.set(layers[1], { zIndex: 2 });
  if (layers[2]) gsap.set(layers[2], { zIndex: 3 });

  gsap.set([v2Reveal, v3Reveal], {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    left: "50%",
    xPercent: -50,
    width: "0%"
  });

  gsap.set(headline, {
    position: "absolute",
    zIndex: 20,
    autoAlpha: 1
  });

  if (gradient) {
    gsap.set(gradient, {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 10,
      pointerEvents: "none",
      autoAlpha: 1
    });
  }

  // SplitText intro
  const originalText = h1.textContent;
  let splitLines = null;
  let lines = [];
  let introPlayed = false;

  function revertSplit() {
    try {
      if (splitLines) splitLines.revert();
    } catch (e) {}
    splitLines = null;
    lines = [];
  }

  function buildSplit() {
    revertSplit();
    h1.textContent = originalText;

    if (!h1.hasAttribute("aria-label")) {
      h1.setAttribute("aria-label", originalText.trim());
    }

    splitLines = new SplitText(h1, {
      type: "lines",
      linesClass: "u-split-line"
    });

    lines = splitLines.lines || [];

    if (lines.length) {
      gsap.set(lines, {
        yPercent: 120,
        x: -18,
        rotate: 1,
        opacity: 0
      });
    }
  }

  function playIntro() {
    if (introPlayed) return;
    introPlayed = true;

    if (!lines.length) return;

    gsap.to(lines, {
      yPercent: 0,
      x: 0,
      rotate: 0,
      opacity: 1,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.28,
      overwrite: true
    });
  }

  buildSplit();
  requestAnimationFrame(() => playIntro());

  const tl = gsap.timeline({ paused: true });

  if (gradient) {
    tl.fromTo(
      gradient,
      { autoAlpha: 0.82 },
      { autoAlpha: 1, duration: 0.6 },
      0
    );
  }

  tl.to({}, { duration: 0.9 });
  tl.to(
    v2Reveal,
    {
      width: "100%",
      duration: 1.8,
      ease: "power2.inOut"
    },
    ">"
  );
  tl.to({}, { duration: 0.28 });
  tl.to(
    v3Reveal,
    {
      width: "100%",
      duration: 1.8,
      ease: "power2.inOut"
    },
    ">"
  );
  tl.to({}, { duration: 0.9 });

  ScrollTrigger.create({
    id: "heroSplitStack",
    trigger: root,
    start: "top top",
    end: "+=4200",
    pin: true,
    scrub: 1.1,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl
  });

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
    let remaining = videos.length;

    function handleReady() {
      remaining--;
      if (remaining <= 0) queueRefresh();
    }

    videos.forEach((video) => {
      if (video.readyState >= 1) {
        handleReady();
      } else {
        video.addEventListener("loadedmetadata", handleReady, { once: true });
        video.addEventListener("error", handleReady, { once: true });
      }
    });
  }

  window.addEventListener("load", queueRefresh, { once: true });
})();

