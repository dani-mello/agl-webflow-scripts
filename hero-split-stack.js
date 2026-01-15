console.log("new hero v1 NEW");

console.log("new hero v1 (safari/firefox patch)");

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

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

  var old = ScrollTrigger.getById("heroSplitStack");
  if (old) old.kill();

  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  // ✅ include v1 too (Firefox “half screen” is often the base layer not being full-bleed)
  var v1Reveal = root.querySelector(".c-hero_reveal.is-v1");
  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  var gradient = root.querySelector(".l-bottom-gradient");

  if (!headline || !h1) return;

  headline.removeAttribute("aria-hidden");
  h1.removeAttribute("aria-hidden");

  function forceFullBleed(el) {
    if (!el) return;
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
    el.style.overflow = "hidden"; // ✅ helps clip/mask in Safari/Firefox
  }
  forceFullBleed(v1Reveal);
  forceFullBleed(v2Reveal);
  forceFullBleed(v3Reveal);

  // -----------------------------
  // SAFARI fallback detection
  // -----------------------------
  var ua = navigator.userAgent;
  var isSafari = /^((?!chrome|android).)*safari/i.test(ua);
  // (desktop Safari & iOS Safari both match this)

  // Curtain methods:
  // - Default: clip-path (your current)
  // - Safari fallback: scaleX curtain (much more reliable for video)
  function setClip(el, value) {
    if (!el) return;
    gsap.set(el, { clipPath: value, webkitClipPath: value });
  }

  function curtainClosed(el) {
    if (!el) return;

    if (isSafari) {
      // ✅ Transform curtain from center
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

    if (isSafari) {
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

  // -----------------------------
  // TEXT: your SplitText block unchanged
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

  if (gradient) {
    gsap.set(gradient, {
      zIndex: 10,
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: "none",
      force3D: true
    });
  }
  gsap.set(headline, { zIndex: 20, position: "absolute" });

  // Prep curtains
  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

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
  // TIMELINE: unchanged timing/labels
  // -----------------------------
  var tl = gsap.timeline();

  if (gradient) gsap.set(gradient, { autoAlpha: 1 });
  if (gradient) tl.fromTo(gradient, { autoAlpha: 0.85 }, { autoAlpha: 1, duration: 0.6 }, 0);

  tl.to({}, { duration: 1 });
  curtainOpen(tl, v2Reveal, "v2Open", 2);
  tl.to({}, { duration: 0.35 });
  curtainOpen(tl, v3Reveal, "v3Open", 2);
  tl.to({}, { duration: 1 });

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
})();
