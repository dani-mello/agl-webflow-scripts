console.log("new hero v5");

(function () {
  console.log("HERO v6 (TEXT FIX) LOADED");

  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (root.dataset.heroSplitStackInit === "1") return;
  root.dataset.heroSplitStackInit = "1";

  // ✅ Reduced motion support
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

  var v2Reveal = root.querySelector(".c-hero_reveal.is-v2");
  var v3Reveal = root.querySelector(".c-hero_reveal.is-v3");

  // ✅ bottom gradient
  var gradient = root.querySelector(".l-bottom-gradient");

  if (!headline || !h1) return;

  // -----------------------------
  // HARD OVERRIDES (beats CSS !important)
  // -----------------------------
  function hardShow(el) {
    if (!el) return;
    el.style.setProperty("visibility", "visible", "important");
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("display", "block", "important");
  }
  function hardHide(el) {
    if (!el) return;
    el.style.setProperty("visibility", "hidden", "important");
    el.style.setProperty("opacity", "0", "important");
  }

  // We want container visible (so it can participate in layout/stacking),
  // but text lines hidden until animation.
  hardShow(headline);

  function forceFullBleed(el) {
    if (!el) return;
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.right = "0";
    el.style.bottom = "0";
    el.style.left = "0";
    el.style.width = "100%";
    el.style.height = "100%";
  }
  forceFullBleed(v2Reveal);
  forceFullBleed(v3Reveal);

  function setClip(el, value) {
    if (!el) return;
    gsap.set(el, { clipPath: value, webkitClipPath: value });
  }

  function curtainClosed(el) {
    setClip(el, "polygon(50% 0%, 50% 0%, 50% 100%, 50% 100%)");
  }

  function curtainOpen(tl, el, pos, dur) {
    if (!el) return tl.to({}, { duration: dur || 1.2 }, pos);

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
  // TEXT: SplitText lines (your v5 motion), no outro
  // -----------------------------
  var originalText = h1.textContent;
  var splitLines = null;
  var lines = [];
  var headingPlayed = false;

  function revertLineSplit() {
    try {
      if (splitLines) splitLines.revert();
    } catch (e) {}
    splitLines = null;
    lines = [];
  }

  function buildLines() {
    revertLineSplit();
    h1.textContent = originalText;

    // Optional: accessibility helper
    if (!h1.hasAttribute("aria-label")) {
      h1.setAttribute("aria-label", h1.textContent.trim());
    }

    splitLines = new SplitText(h1, {
      type: "lines",
      linesClass: "u-split-line"
    });

    lines = splitLines.lines || [];

    // Put lines into “hidden start pose” immediately
    if (lines.length) {
      gsap.set(lines, {
        yPercent: 120,
        x: -18,
        rotate: 1,
        opacity: 0,
        willChange: "transform"
      });
    }

    return lines;
  }

  function playHeadingIntroOnce() {
    if (headingPlayed) return;
    headingPlayed = true;

    // Force the container visible (even if CSS fights us)
    hardShow(headline);

    // If we failed to split, at least show the H1
    if (!lines || !lines.length) {
      console.warn("No SplitText lines found — showing raw H1");
      h1.style.setProperty("visibility", "visible", "important");
      h1.style.setProperty("opacity", "1", "important");
      return;
    }

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

  buildLines();

  // ---- LOCK HEADLINE COLOUR ----
  var lockedColor = window.getComputedStyle(h1).color;
  gsap.set(h1, { color: lockedColor });
  if (lines.length) gsap.set(lines, { color: lockedColor });

  // ✅ stacking order (as you had)
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

  // Keep curtains closed initially (unchanged)
  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

  ScrollTrigger.addEventListener("refreshInit", function () {
    buildLines();

    lockedColor = window.getComputedStyle(h1).color;
    gsap.set(h1, { color: lockedColor });
    if (lines.length) gsap.set(lines, { color: lockedColor });

    // If already played, keep visible; otherwise keep container visible + lines hidden
    hardShow(headline);

    curtainClosed(v2Reveal);
    curtainClosed(v3Reveal);

    if (gradient) gsap.set(gradient, { zIndex: 10 });
    gsap.set(headline, { zIndex: 20 });
  });

  // -----------------------------
  // TIMELINE: keep VIDEO animation exactly as-is
  // -----------------------------
  var tl = gsap.timeline();

  if (gradient) gsap.set(gradient, { autoAlpha: 1 });
  if (gradient)
    tl.fromTo(gradient, { autoAlpha: 0.85 }, { autoAlpha: 1, duration: 0.6 }, 0);

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

    // Fire the intro as soon as the pinned hero is active
    onEnter: function () {
      playHeadingIntroOnce();
    },

    onEnterBack: function () {
      hardShow(headline);
    },

    onUpdate: function () {
      // keep visible always
      hardShow(headline);
    }

    // markers: true
  });

  // ✅ Fallback: run intro right after init (prevents “never shows” cases)
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      playHeadingIntroOnce();
      ScrollTrigger.refresh(true);
    });
  });
})();
