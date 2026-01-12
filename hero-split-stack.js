console.log("new hero v3");

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
  // TEXT: SplitText (lines) intro once, then stay visible
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

    // ✅ Start hidden immediately (prevents flash)
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

    // show container
    gsap.set(headline, { autoAlpha: 1 });

    // animate lines in (your v5 motion)
    if (lines.length) {
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
  }

  buildLines();

  // ---- LOCK HEADLINE COLOUR ----
  var lockedColor = window.getComputedStyle(h1).color;
  gsap.set(h1, { color: lockedColor });
  if (lines.length) gsap.set(lines, { color: lockedColor });

  // ✅ stacking order
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

  // Hide headline initially to avoid any FOUC
  gsap.set(headline, { autoAlpha: 0 });

  curtainClosed(v2Reveal);
  curtainClosed(v3Reveal);

  ScrollTrigger.addEventListener("refreshInit", function () {
    // Rebuild safely on refresh (prevents nested wrappers)
    buildLines();

    lockedColor = window.getComputedStyle(h1).color;
    gsap.set(h1, { color: lockedColor });
    if (lines.length) gsap.set(lines, { color: lockedColor });

    // If we already played, keep it visible
    gsap.set(headline, { autoAlpha: headingPlayed ? 1 : 0 });

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

    onEnter: function () {
      playHeadingIntroOnce();
    },

    // If the page loads already at the top, onEnter can fire immediately,
    // but this makes it extra robust across browsers.
    onRefresh: function () {
      if (ScrollTrigger.isInViewport(root, 0.2)) playHeadingIntroOnce();
    },

    onEnterBack: function () {
      // keep visible
      gsap.set(headline, { autoAlpha: 1 });
    },

    onUpdate: function () {
      // keep visible always
      gsap.set(headline, { autoAlpha: 1 });
    }

    // markers: true
  });

  // Extra safety: if hero is already in view on load, play it.
  // (No delay — avoids “animates halfway through”)
  if (ScrollTrigger.isInViewport(root, 0.2)) {
    // wait one frame so SplitText wrappers are in place
    requestAnimationFrame(playHeadingIntroOnce);
  }
})();
