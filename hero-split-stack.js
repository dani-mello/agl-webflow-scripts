console.log("hero split stack v4 - simplified + stabler");

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

  const v1Reveal = root.querySelector(".c-hero_reveal.is-v1");
  const v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  const v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  const gradient = root.querySelector(".l-bottom-gradient");
  const videos = root.querySelectorAll("video");

  if (!headline || !h1 || !v1Reveal || !v2Reveal || !v3Reveal) return;

  // -----------------------------
  // Helpers
  // -----------------------------
  function forceLayer(el, z) {
    if (!el) return;
    Object.assign(el.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      overflow: "hidden"
    });
    if (z != null) el.style.zIndex = String(z);
  }

  function setupReveal(el, z) {
    if (!el) return;
    forceLayer(el, z);

    // Stable center reveal using width + xPercent
    gsap.set(el, {
      left: "50%",
      xPercent: -50,
      width: "0%",
      transformOrigin: "50% 50%",
      willChange: "width"
    });
  }

  function openReveal(tl, el, pos, dur) {
    if (!el) return;
    tl.to(
      el,
      {
        width: "100%",
        duration: dur,
        ease: "power2.inOut"
      },
      pos
    );
  }

  function resetReveal(el) {
    if (!el) return;
    gsap.set(el, {
      left: "50%",
      xPercent: -50,
      width: "0%"
    });
  }

  // -----------------------------
  // Base layout
  // -----------------------------
  root.style.overflow = "clip";
  root.style.position = root.style.position || "relative";
  root.style.backfaceVisibility = "hidden";
  root.style.transform = "translateZ(0)";

  forceLayer(v1Reveal, 1);
  setupReveal(v2Reveal, 2);
  setupReveal(v3Reveal, 3);

  gsap.set(headline, {
    position: "absolute",
    zIndex: 20,
    autoAlpha: 1,
    willChange: "transform"
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

  // -----------------------------
  // SplitText intro
  // -----------------------------
  const originalText = h1.textContent;
  let splitLines = null;
  let lines = [];
  let introPlayed = false;

  function revertSplit() {
    try {
      splitLines?.revert();
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
        opacity: 0,
        willChange: "transform, opacity"
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

  // Rebuild only on refreshInit, but do not replay once already played
  ScrollTrigger.addEventListener("refreshInit", () => {
    if (!introPlayed) buildSplit();
  });

  // -----------------------------
  // Main timeline
  // -----------------------------
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
  openReveal(tl, v2Reveal, ">", 1.8);
  tl.to({}, { duration: 0.28 });
  openReveal(tl, v3Reveal, ">", 1.8);
  tl.to({}, { duration: 0.9 });

  // -----------------------------
  // ScrollTrigger
  // -----------------------------
  const st = ScrollTrigger.create({
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

  // -----------------------------
  // Single controlled refresh
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

  // -----------------------------
  // Clean resize handling
  // -----------------------------
  let resizeTimer = null;
  window.addEventListener(
    "resize",
    () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        resetReveal(v2Reveal);
        resetReveal(v3Reveal);
        st.animation.progress(st.progress);
        ScrollTrigger.refresh();
      }, 180);
    },
    { passive: true }
  );
})();
