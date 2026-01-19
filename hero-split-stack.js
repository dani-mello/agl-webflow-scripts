console.log("new hero v3 (Safari/Firefox/Opera hardened)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  // Prevent double init
  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReduced) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP or ScrollTrigger missing");
    return;
  }
  if (typeof SplitText === "undefined") {
    console.warn("SplitText missing");
    return;
  }

  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Kill only our trigger if hot reloaded
  var old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill(true);

  // -----------------------------
  // Browser detection
  // -----------------------------
  var ua = navigator.userAgent;
  var isFirefox = /firefox/i.test(ua);

  // Safari = AppleWebKit + Safari but NOT Chrome/Chromium/Android
  var isSafari =
    /safari/i.test(ua) &&
    /applewebkit/i.test(ua) &&
    !/chrome|crios|chromium|android/i.test(ua);

  // Opera on Chromium identifies with OPR/
  var isOpera = /OPR\//i.test(ua) || /Opera/i.test(ua);

  // ✅ Use transform curtains on Safari + Opera (fixes Safari first-frame issues + Opera shake)
  var useTransformCurtain = isSafari || isOpera;

  // -----------------------------
  // Elements
  // -----------------------------
  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  var v1Reveal = root.querySelector(".c-hero_reveal.is-v1");
  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  var gradient = root.querySelector(".l-bottom-gradient");

  if (!headline || !h1) return;

  headline.removeAttribute("aria-hidden");
  h1.removeAttribute("aria-hidden");

  function findWrap(revealEl) {
    if (!revealEl) return null;
    return revealEl.querySelector(".c-hero_video-wrap") || null;
  }

  var v1Wrap = findWrap(v1Reveal);
  var v2Wrap = findWrap(v2Reveal);
  var v3Wrap = findWrap(v3Reveal);

  // Collect videos (for metadata-based refresh)
  var videos = root.querySelectorAll("video");

  // -----------------------------
  // Full-bleed helper
  // -----------------------------
  function forceFullBleed(el) {
    if (!el) return;
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.overflow = "hidden";
  }

  forceFullBleed(v1Reveal);
  forceFullBleed(v2Reveal);
  forceFullBleed(v3Reveal);
  forceFullBleed(v1Wrap);
  forceFullBleed(v2Wrap);
  forceFullBleed(v3Wrap);

  // Ensure headline always sits above
  gsap.set(headline, { zIndex: 20, position: "absolute" });

  if (gradient) {
    gsap.set(gradient, {
      zIndex: 10,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none"
    });
  }

  // -----------------------------
  // Curtains
  // - Default: clip-path
  // - Safari + Opera: scaleX transform (more stable for video)
  // -----------------------------
  function setClip(el, value) {
    if (!el) return;
    gsap.set(el, { clipPath: value, webkitClipPath: value });
  }

  function curtainClosed(el) {
    if (!el) return;

    if (useTransformCurtain) {
      gsap.set(el, {
        transformOrigin: "50% 50%",
        scaleX: 0,
        force3D: true
      });
    } else {
      setClip(el, "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)");
    }
  }

  function curtainOpen(tl, el, pos, dur) {
    if (!el) return tl.to({}, { duration: dur || 1.2 }, pos);

    if (useTransformCurtain) {
      return tl.to(
        el,
        {
          scaleX: 1,
          duration: dur || 1.2,
          ease: "power2.inOut",
          force3D: true
        },
        pos
      );
    }

    return tl.to(
      el,
      {
        clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        webkitClipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
        duration: dur || 1.2,
        ease: "power2.inOut"
      },
      pos
    );
  }

  // Prep curtains (v1 stays visible as base)
  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

  // -----------------------------
  // SplitText
  // -----------------------------
  var originalText = h1.textContent;
  var splitLines = null;
  var lines = [];
  var played = false;

  function revertSplit() {
    try {
      if (splitLines) splitLines.revert();
    } catch (e) {}
    splitLines = null;
    lines = [];
  }

  function ensureMeasurable() {
    headline.style.setProperty("display", "block", "important");
    headline.style.setProperty("visibility", "visible", "important");
    gsap.set(headline, { opacity: 0 });
  }

  function buildLines() {
    revertSplit();
    h1.textContent = originalText;

    if (!h1.hasAttribute("aria-label")) {
      h1.setAttribute("aria-label", h1.textContent.trim());
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
        willChange: "transform"
      });
    }
  }

  function playIntro() {
    if (played) return;
    played = true;

    gsap.set(headline, { opacity: 1, visibility: "visible" });

    if (!lines.length) return;

    gsap.to(lines, {
      yPercent: 0,
      x: 0,
      rotate: 0,
      opacity: 1,
      duration: 1.1,
      ease: "power3.out",
      stagger: 0.3,
      overwrite: true
    });
  }

  ensureMeasurable();
  buildLines();
  requestAnimationFrame(function () {
    playIntro();
  });

  ScrollTrigger.addEventListener("refreshInit", function () {
    headline.removeAttribute("aria-hidden");
    h1.removeAttribute("aria-hidden");
    ensureMeasurable();
    if (!played) buildLines();
  });

  // -----------------------------
  // Timeline
  // -----------------------------
  var tl = gsap.timeline();

  if (gradient) gsap.set(gradient, { autoAlpha: 1 });
  if (gradient) {
    tl.fromTo(
      gradient,
      { autoAlpha: 0.85 },
      { autoAlpha: 1, duration: 0.6 },
      0
    );
  }

  tl.to({}, { duration: 1 });
  curtainOpen(tl, v2Reveal, "v2Open", 2);
  tl.to({}, { duration: 0.35 });
  curtainOpen(tl, v3Reveal, "v3Open", 2);
  tl.to({}, { duration: 1 });

  // -----------------------------
  // ScrollTrigger
  // -----------------------------
  ScrollTrigger.create({
    id: "heroSplitStack",
    trigger: root,
    start: "top top",
    end: "+=5200",
    pin: true,
    scrub: 1.6,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,

    // Safari often behaves better with fixed pinning.
    // Opera is Chromium; leaving default is usually fine, but fixed is safe here too.
    pinType: isSafari ? "fixed" : undefined,

    onUpdate: function () {
      headline.style.setProperty("visibility", "visible", "important");
      headline.style.setProperty("display", "block", "important");
      gsap.set(headline, { opacity: 1 });
    },
    onEnterBack: function () {
      headline.style.setProperty("visibility", "visible", "important");
      headline.style.setProperty("display", "block", "important");
      gsap.set(headline, { opacity: 1 });
    }
  });

  // -----------------------------
  // Refresh AFTER video metadata is known
  // Fixes: Safari first frame offset, Firefox starting late, general layout drift
  // -----------------------------
  var refreshQueued = false;

  function queueRefresh() {
    if (refreshQueued) return;
    refreshQueued = true;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        try {
          // Nudge layout (forces paint)
          root.style.transform = "translateZ(0)";
          root.offsetHeight;
          root.style.transform = "";

          ScrollTrigger.refresh();
        } catch (e) {}
        refreshQueued = false;
      });
    });
  }

  function videoReady(v) {
    return v && v.readyState >= 1; // HAVE_METADATA
  }

  var anyPending = false;
  for (var i = 0; i < videos.length; i++) {
    if (!videoReady(videos[i])) anyPending = true;
  }

  if (!anyPending) {
    queueRefresh();
  } else {
    for (var j = 0; j < videos.length; j++) {
      (function (v) {
        if (!v) return;
        v.addEventListener("loadedmetadata", queueRefresh, { once: true });
        v.addEventListener("canplay", queueRefresh, { once: true });
      })(videos[j]);
    }
  }

  window.addEventListener("load", queueRefresh, { once: true });

  if (isFirefox) {
    window.addEventListener(
      "resize",
      function () {
        queueRefresh();
      },
      { passive: true }
    );
  }
})();
