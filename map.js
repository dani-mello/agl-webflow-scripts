// map.js
(function () {

  var owner = "dani-mello";
  var repo = "agl-webflow-scripts";
  var branchOrSha = "main";

  // Cache-bust so jsDelivr doesn't serve stale SVG
  var SVG_URL =
    "https://cdn.jsdelivr.net/gh/" +
    owner +
    "/" +
    repo +
    "@" +
    branchOrSha +
    "/map.svg?v=" +
    Date.now();

  var containerId = "agl-map-container";
  var PANEL_HIDDEN_CLASS = "is-hidden";
  var MAP_READY_CLASS = "is-map-ready";

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  // --------------------------------------------
  // Region copy (keys must match data-region)
  // --------------------------------------------
  var regionData = {
    aoraki: {
      title: "Aoraki / Mount Cook",
      description:
        "Glaciers, seracs, and serious alpine objectives — our home range.",
      url: "#aoraki-trips",
    },
    aspiring: {
      title: "Mount Aspiring",
      description: "Long approaches, rewarding ridges, and classic summit days.",
      url: "#aspiring-trips",
    },
    fiordland: {
      title: "Fiordland",
      description:
        "Remote granite, deep fiords, heavy weather — proper wilderness.",
      url: "#fiordland-trips",
    },
  };

  // --------------------------------------------
  // Init interactions + GSAP AFTER SVG inject
  // --------------------------------------------
  function initMap(container) {
    var regions = container.querySelectorAll(".map-region");
    var pins = container.querySelectorAll('g[id^="pin-"]');

    var panel = document.querySelector(".c-map_panel");
    var titleEl = document.getElementById("region-title");
    var descEl = document.getElementById("region-description");
    var linkEl = document.getElementById("region-link");

    // ---- MOBILE SIZE BOOST ----
    if (isMobile()) {
      container.style.width = "100%";
      container.style.maxWidth = "100%";
      container.style.minHeight = "520px";
    } else {
      container.style.minHeight = "";
    }

    container.classList.add(MAP_READY_CLASS);

    function setPanel(key) {
      var data = regionData[key];
      if (!data) return;

      if (titleEl) titleEl.textContent = data.title || "";
      if (descEl) descEl.textContent = data.description || "";

      if (linkEl) {
        linkEl.href = data.url || "#";
        linkEl.style.display = data.url ? "" : "none";
      }

      if (panel) panel.classList.remove(PANEL_HIDDEN_CLASS);
    }

    function hidePanel() {
      if (!isMobile()) return;
      if (panel) panel.classList.add(PANEL_HIDDEN_CLASS);
    }

    function clearActive() {
      regions.forEach(function (r) {
        r.classList.remove("map-region_active");
      });
    }

    // Instructional panel on mobile
    if (panel && isMobile()) {
      panel.classList.remove(PANEL_HIDDEN_CLASS);
      if (titleEl) titleEl.textContent = "Explore the map";
      if (descEl) descEl.textContent = "Tap a region to see trips and details.";
      if (linkEl) {
        linkEl.style.display = "none";
        linkEl.href = "#";
      }
    }

    var activeRegionKey = null;

    regions.forEach(function (regionEl) {
      var key = regionEl.getAttribute("data-region");

      regionEl.addEventListener("mouseenter", function () {
        if (isMobile()) return;
        if (activeRegionKey) return;
        setPanel(key);
      });

      regionEl.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        activeRegionKey = key;
        clearActive();
        regionEl.classList.add("map-region_active");
        setPanel(key);
      });
    });

    document.addEventListener("click", function (e) {
      if (!isMobile()) return;

      var clickedInsidePanel = panel && panel.contains(e.target);
      var clickedRegion =
        e.target && e.target.closest && e.target.closest(".map-region");

      if (!clickedInsidePanel && !clickedRegion) {
        activeRegionKey = null;
        clearActive();
        hidePanel();
      }
    });

    // --------------------------------------------
    // GSAP PIN ANIMATION
    // --------------------------------------------
    var hasGsap = typeof window.gsap !== "undefined";
    var hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

    if (!pins.length) return;

    var svgEl = container.querySelector("svg");
    if (svgEl) {
      pins.forEach(function (pin) {
        svgEl.appendChild(pin);
      });
    }

    pins.forEach(function (pin) {
      pin.style.transformBox = "fill-box";
      pin.style.transformOrigin = "50% 80%";
      pin.style.willChange = "transform, opacity";
    });

    if (hasGsap) {
      window.gsap.set(pins, { opacity: 0, y: 14, scale: 0.6 });
    } else {
      pins.forEach(function (pin) {
        pin.style.opacity = 1;
      });
      return;
    }

    function playPins() {
      window.gsap.to(pins, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.14,
        overwrite: "auto",
      });
    }

    if (hasScrollTrigger) {
      try {
        window.gsap.registerPlugin(window.ScrollTrigger);
      } catch (e) {}

      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.ScrollTrigger.create({
            trigger: container,
            start: "top 60%",
            once: true,
            onEnter: playPins,
          });

          window.ScrollTrigger.refresh();
        });
      });
    } else {
      requestAnimationFrame(function () {
        requestAnimationFrame(playPins);
      });
    }
  }

  // --------------------------------------------
  // Load SVG
  // --------------------------------------------
  function loadSvg() {
    var container = document.getElementById(containerId);
    if (!container) return;

    fetch(SVG_URL, { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw res;
        return res.text();
      })
      .then(function (svgText) {
        container.innerHTML = svgText;
        initMap(container);
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSvg);
  } else {
    loadSvg();
  }
})();
