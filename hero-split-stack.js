console.log("new hero v7");

(function () {

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

  // Stop anything forcing aria-hidden on this element
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
  // TEXT: SplitText lines + intro once (your v5 motion)
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
    // Make sure SplitText can calculate line breaks (no display:none)
    headline.style.setProperty("display", "block", "important");
    headline.style.setProperty("visibility", "visible", "important");
    // Keep it visually hidden until we animate
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

    // Put lines in start pose immediately (hidden)
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

    // Reveal container
    gsap.set(headline, { opacity: 1, visibility: "visible" });

    if (!lines.length) return;

    // Animate lines in (from current start pose)
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

  // Lock stacking order as you had
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

  // Prep curtains (unchanged)
  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

  // ✅ Build SplitText when measurable, then animate once on next frame
  ensureMeasurable();
  buildLines();

  requestAnimationFrame(function () {
    // Now we’re past first paint + SplitText is in place
    playIntro();
  });

  // If you resize, don’t kill your intro. Just rebuild lines if NOT played yet.
  ScrollTrigger.addEventListener("refreshInit", function () {
    headline.removeAttribute("aria-hidden");
    h1.removeAttribute("aria-hidden");

    ensureMeasurable();

    if (!played) {
      buildLines();
    }
  });

  // -----------------------------
  // TIMELINE: keep VIDEO animation exactly as-is
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

    // Keep headline visible (no explosion / no hide)
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

    // markers: true
  });
})();
