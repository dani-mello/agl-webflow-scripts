console.log("INTRO STATS COUNTER (V6 - IN VIEW + STAGGER + RESET)");

(function () {
  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  ready(function () {
    var root = document.querySelector(".c-intro_stats");
    if (!root) return;

    var counters = root.querySelectorAll(".u-h1[data-count]");
    if (!counters.length) return;

    var prefersReduced = false;
    if (window.matchMedia) {
      prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    // === TUNING CONTROLS ===
    var DURATION_MS = 2000; // speed of each count
    var STAGGER_MS = 400;   // delay between each counter start
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

    // ✅ Make sure they DON'T show final numbers before animating
    function setAllToZero() {
      for (var i = 0; i < counters.length; i++) {
        var raw = counters[i].getAttribute("data-count");
        if (!raw) continue;

        var parsed = parseCount(raw);
        if (isNaN(parsed.value)) continue;

        counters[i].textContent = prefersReduced
          ? parsed.value.toLocaleString() + parsed.suffix
          : "0" + parsed.suffix;
      }
    }

    function animateCount(el) {
      if (el.getAttribute("data-count-init") === "1") return;
      el.setAttribute("data-count-init", "1");

      var raw = el.getAttribute("data-count");
      if (!raw) return;

      var parsed = parseCount(raw);
      var value = parsed.value;
      var suffix = parsed.suffix;

      if (isNaN(value)) return;

      if (prefersReduced) {
        el.textContent = value.toLocaleString() + suffix;
        return;
      }

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

    function startAllStaggered() {
      for (var i = 0; i < counters.length; i++) {
        (function (el, index) {
          setTimeout(function () {
            animateCount(el);
          }, index * STAGGER_MS);
        })(counters[i], i);
      }
    }

    // ✅ Reset immediately on page load (so offscreen numbers aren’t “final”)
    setAllToZero();

    // Trigger when section is in view
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(
        function (entries) {
          for (var i = 0; i < entries.length; i++) {
            if (entries[i].isIntersecting) {
              // ✅ Reset again at trigger moment (in case Webflow swapped text later)
              setAllToZero();

              startAllStaggered();
              io.disconnect();
              break;
            }
          }
        },
        {
          threshold: 0.3,                 // change this to start later/earlier
          rootMargin: "0px 0px -20% 0px"  // tweak for “scroll a bit longer”
        }
      );

      io.observe(root);
    } else {
      setAllToZero();
      startAllStaggered();
    }
  });
})();
