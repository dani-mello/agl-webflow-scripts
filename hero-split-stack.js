console.log(
  "%cSPLIT STACK JS LOADED (V8 - LETTER SCATTER)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  var root = document.querySelector(".c-hero");
  if (!root) return;

  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") {
    console.warn("GSAP/ScrollTrigger missing. Load them before this script.");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Elements
  var headline = root.querySelector(".c-hero_headline");
  var h1 = headline ? headline.querySelector(".c-hero_h1") : null;

  // FX overlay container (must exist in HTML)
  // <div class="c-hero_h1-fx" aria-hidden="true"></div>
  var fx = headline ? headline.querySelector(".c-hero_h1-fx") : null;

  var p1 = root.querySelector(".c-hero_panel--v1");
  var p2 = root.querySelector(".c-hero_panel--v2");
  var p3 = root.querySelector(".c-hero_panel--v3");

  var v1 = p1 ? p1.querySelector("video") : null;
  var v2 = p2 ? p2.querySelector("video") : null;
  var v3 = p3 ? p3.querySelector("video") : null;

  var prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Helpers
  function safePlay(el) {
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    try {
      var p = el.play();
      if (p && typeof p.catch === "function") p.catch(function () {});
    } catch (e) {}
  }

  function safePause(el) {
    if (!el) return;
    try {
      el.pause();
    } catch (e) {}
  }

  function buildFxLetters() {
    if (!h1 || !fx) return false;

    var text = h1.textContent || "";
    fx.innerHTML = "";

    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      var span = document.createElement("span");
      span.className = "char";
      span.textContent = ch === " " ? "\u00A0" : ch;
      fx.appendChild(span);
    }
    return true;
  }

  // Reduced motion fallback
  if (prefersReduced) {
    gsap.set([p1, p2, p3], { scale: 1, rotate: 0 });
    if (headline) gsap.set(headline, { autoAlpha: 0 });
    safePlay(v3);
    return;
  }

  // Initial states
  gsap.set([p1, p2, p3], {
    scale: 0,
    rotate: -20,
    transformOrigin: "50% 50%"
  });

  if (headline) gsap.set(headline, { autoAlpha: 1 });

  // Make sure FX layer exists and is built
  var hasFx = buildFxLetters();
  if (!hasFx) {
    console.warn(
      "Missing .c-hero_h1 and/or .c-hero_h1-fx inside .c-hero_headline. " +
        "Add: <h1 class='c-hero_h1'>...</h1><div class='c-hero_h1-fx' aria-hidden='true'></div>"
    );
  }

  if (fx) gsap.set(fx, { autoAlpha: 1 });

  // Timeline
  var tl = gsap.timeline({ defaults: { ease: "power3.inOut" } });

  // Event 1 - headline hold
  tl.to({}, { duration: 0.6 });

  // Event 2 - scatter letters + video 1 grows
  tl.add(
    function () {
      safePlay(v1);
    },
    "e2"
  );

  if (fx) {
    if (h1) tl.set(h1, { opacity: 0 }, "e2");

    var chars = fx.querySelectorAll(".char");
    tl.to(
      chars,
      {
        x: function () {
          return gsap.utils.random(-260, 260);
        },
        y: function () {
          return gsap.utils.random(-220, 220);
        },
        rotate: function () {
          return gsap.utils.random(-60, 60);
        },
        opacity: 0,
        duration: 0.9,
        ease: "power3.inOut",
        stagger: { each: 0.012, from: "random" }
      },
      "e2"
    );

    // Fade headline layer away
    tl.to(headline, { autoAlpha: 0, duration: 0.35 }, "e2+=0.35");
  } else {
    tl.to(headline, { autoAlpha: 0, duration: 0.35 }, "e2+=0.35");
  }

  // Video 1
  tl.to(p1, { scale: 1, rotate: 0, duration: 1.1 }, "e2");

  // Event 3 - video 2
  tl.to({}, { duration: 0.25 });
  tl.add(
    function () {
      safePlay(v2);
    },
    "e3"
  );
  tl.to(p2, { scale: 1, rotate: 0, duration: 1.0 }, "e3");

  // Event 4 - video 3
  tl.to({}, { duration: 0.25 });
  tl.add(
    function () {
      safePlay(v3);
    },
    "e4"
  );
  tl.to(p3, { scale: 1, rotate: 0, duration: 1.0 }, "e4");

  // ScrollTrigger
  ScrollTrigger.create({
    trigger: root,
    start: "top top",
    end: "+=5200",
    pin: true,
    scrub: 1.2,
    anticipatePin: 1,
    invalidateOnRefresh: true,
    animation: tl,
    onLeave: function () {
      safePause(v1);
      safePause(v2);
    },
    onEnterBack: function () {
      safePlay(v1);

      if (headline) gsap.set(headline, { autoAlpha: 1 });

      if (fx && hasFx) {
        buildFxLetters();
        var charsBack = fx.querySelectorAll(".char");
        gsap.set(charsBack, { x: 0, y: 0, rotate: 0, opacity: 1 });
      }

      if (h1) gsap.set(h1, { opacity: 1 });
    }
  });

  // Refresh after video metadata loads (Safari/iOS sizing fix)
  [v1, v2, v3].forEach(function (vid) {
    if (!vid) return;
    vid.addEventListener(
      "loadedmetadata",
      function () {
        ScrollTrigger.refresh();
      },
      { once: true }
    );
  });
})();
