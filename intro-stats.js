console.log("INTRO STATS COUNTER (V4 - IN VIEW + STAGGER)");

(function () {
  // Run after DOM is ready (Webflow-safe)
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var root = document.querySelector(".c-intro_stats");
    if (!root) {
      console.log("Stats: .c-intro_stats not found");
      return;
    }

    var counters = root.querySelectorAll(".u-h1[data-count]");
    if (!counters.length) {
      console.log("Stats: no .u-h1[data-count] found");
      return;
    }

    var prefersReduced = false;
    if (window.matchMedia) {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // === TUNING CONTROLS ===
    var DURATION_MS = 1200; // overall speed of each count animation
    var STAGGER_MS = 200;   // delay between each counter start
    // =======================

    function parseCount(raw) {
      var numStr = String(raw).replace(/[^0-9]/g, "");
      var value = parseInt(numStr, 10);
      var suffix = String(raw).replace(/[0-9]/g, "");
      return { value: value, suffix: suffix };
    }

    function raf(fn) {
      return (window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); })(fn);
    }

    function animateCount(el) {
      // prevent double-run
      if (el.getAttribute("data-count-init") === "1") return;
      el.setAttribute("data-count-init", "1");

      var raw = el.getAttribute("data-count");
      if (!raw) return;

      var parsed = parseCount(raw);
      var value = parsed.value;
      var suffix = parsed.suffix;

      if (isNaN(value)) {
        console.warn("Stats: invalid data-count:", raw, el);
        return;
      }

      if (prefersReduced) {
        el.textContent = value.toLocaleString() + suffix;
        return;
      }

      // start visually from 0 so you can see it animate
      el.textContent = "0" + suffix;

      var duration = DURATION_MS;
      var startTime = new Date().getTime();

      function tick() {
        var now = new Date().getTime();
        var progress = (now - startTime) / duration;
        if (progress > 1) progress = 1;

        // easeOutQuad
        var eased = 1 - Math.pow(1 - progress, 2);
        var current = Math.floor(eased * value);

        el.textContent = current.toLocaleString() + suffix;

        if (progress < 1) raf(tick);
        else el.textContent = value.toLocaleString() + suffix;
      }

      raf(tick);
    }

    // Staggered start (one after another)
    function startAllStaggered() {
      for (var i = 0; i < counters.length; i++) {
        (function (el, index) {
          setTimeout(function () {
            animateCount(el);
          }, index * STAGGER_MS);
        })(counters[i], i);
      }
    }

    // Trigger when the SECTION is in view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              console.log("Stats: section in view → start (staggered)");
              startAllStaggered();
              io.disconnect(); // only once
              break;
            }
          }
        },
        { threshold: 0.3 }
      );

      io.observe(root);
    } else {
      // fallback
      startAllStaggered();
    }
  });
})();
