console.log("[AGL MAP] SVG injected. Length:", svgText.length);
console.log("[AGL MAP] container:", container);

(function () {
  var owner = "dani-mello";
  var repo = "agl-webflow-scripts";
  var branchOrSha = "main";

  var SVG_URL =
    "https://cdn.jsdelivr.net/gh/" +
    owner + "/" + repo + "@" + branchOrSha + "/map.svg";

  var containerId = "agl-map-container";

  // --------------------------------------------
  // Load SVG then init AFTER it exists in the DOM
  // --------------------------------------------
  function loadSvg() {
    var container = document.getElementById(containerId);
    if (!container) {
      console.warn("[AGL MAP] Container not found:", containerId);
      return;
    }

    fetch(SVG_URL)
      .then(function (res) {
        if (!res.ok) throw res;
        return res.text();
      })
      .then(function (svgText) {
        container.innerHTML = svgText;

        console.log("[AGL MAP] SVG injected. Length:", svgText.length);
        console.log("[AGL MAP] container:", container);

        // IMPORTANT: init only AFTER SVG exists
        initMap();
      })
      .catch(function (err) {
        console.error("[AGL MAP] Failed to load map.svg", err);
      });
  }

  // --------------------------------------------
  // All interactions + GSAP (runs after SVG inject)
  // --------------------------------------------
  function initMap() {
    // ----- CONFIG -----
    var PANEL_HIDDEN_CLASS = "is-hidden";
    var isMobile = function () {
      return window.matchMedia("(max-width: 768px)").matches;
    };

    // Region data
    var regionData = {
      aoraki: {
        title: "Aoraki / Mount Cook",
        description: "Glaciers, seracs, and serious alpine objectives — our home range.",
        url: "#aoraki-trips"
      },
      aspiring: {
        title: "Mount Aspiring",
        description: "Long approaches, rewarding ridges, and classic summit days.",
        url: "#aspiring-trips"
      },
      fiordland: {
        title: "Fiordland",
        description: "Remote granite, deep fiords, heavy weather — proper wilderness.",
        url: "#fiordland-trips"
      }
      // add the rest...
    };

    // ----- DOM (NOW the SVG exists) -----
    var regions = document.querySelectorAll(".map-region");
    var pins = document.querySelectorAll('g[id^="pin-"]');

    var panel = document.querySelector(".c-map_panel");
    var titleEl = document.getElementById("region-title");
    var descEl = document.getElementById("region-description");
    var linkEl = document.getElementById("region-link");

    if (!regions.length) {
      console.warn("[AGL MAP] No .map-region found inside injected SVG.");
      return;
    }
    if (!panel || !titleEl || !descEl || !linkEl) {
      console.warn("[AGL MAP] Panel elements missing. Check your IDs/classes.");
      return;
    }

    var activeRegionKey = null;

    function setPanel(key) {
      var data = regionData[key];
      if (!data) return;

      titleEl.textContent = data.title;
      descEl.textContent = data.description;
      linkEl.href = data.url || "#";
      panel.classList.remove(PANEL_HIDDEN_CLASS);
    }

    function hidePanel() {
      if (!isMobile()) return;
      panel.classList.add(PANEL_HIDDEN_CLASS);
    }

    function clearActive() {
      regions.forEach(function (r) {
        r.classList.remove("map-region_active");
      });
    }

    // Start: on mobile, hide panel until first tap
    if (isMobile()) panel.classList.add(PANEL_HIDDEN_CLASS);

    // ----- INTERACTIONS -----
    regions.forEach(function (regionEl) {
      var key = regionEl.dataset.region;

      regionEl.addEventListener("mouseenter", function () {
        if (isMobile()) return;
        if (activeRegionKey) return;
        setPanel(key);
      });

      regionEl.addEventListener("click", function (e) {
        e.stopPropagation();
        activeRegionKey = key;
        clearActive();
        regionEl.classList.add("map-region_active");
        setPanel(key);
      });
    });

    // Tap/click outside hides panel (mobile only)
    document.addEventListener("click", function (e) {
      if (!isMobile()) return;

      var clickedInsidePanel = panel.contains(e.target);
      var clickedRegion = e.target.closest(".map-region");

      if (!clickedInsidePanel && !clickedRegion) {
        activeRegionKey = null;
        clearActive();
        hidePanel();
      }
    });

    // ----- GSAP ANIMATION -----
    var hasGsap = typeof gsap !== "undefined";
    if (hasGsap) {
      var tl = gsap.timeline();

      tl.from(".map-region path", {
        opacity: 0,
        scale: 0.95,
        transformOrigin: "50% 50%",
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.06,
        delay: 0.1
      });

      if (pins.length) {
        tl.set(pins, { opacity: 0, scale: 0.6, y: 14, transformOrigin: "50% 50%" }, 0);

        tl.to(pins, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: "power2.out",
          stagger: 0.18
        }, "-=0.25");
      }
    }
  }

  // Kickoff
  document.addEventListener("DOMContentLoaded", loadSvg);
})();
