// map.js
(function () {
  console.log("%c[AGL MAP] map.js loaded", "font-weight:bold; font-size:14px;");

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

  function isMobile() {
    return window.matchMedia("(max-width: 768px)").matches;
  }

  // --------------------------------------------
  // Region copy (keys must match data-region)
  // --------------------------------------------
  var regionData = {
    aoraki: {
      title: "Aoraki / Mount Cook",
      description: "Glaciers, seracs, and serious alpine objectives — our home range.",
      url: "#aoraki-trips",
    },
    aspiring: {
      title: "Mount Aspiring",
      description: "Long approaches, rewarding ridges, and classic summit days.",
      url: "#aspiring-trips",
    },
    fiordland: {
      title: "Fiordland",
      description: "Remote granite, deep fiords, heavy weather — proper wilderness.",
      url: "#fiordland-trips",
    },
  };

  // --------------------------------------------
  // Init interactions + GSAP AFTER SVG inject
  // --------------------------------------------
  function initMap(container) {
    // IMPORTANT: query INSIDE injected SVG
    var regions = container.querySelectorAll(".map-region");
    var pins = container.querySelectorAll('g[id^="pin-"]');

    var panel = document.querySelector(".c-map_panel");
    var titleEl = document.getElementById("region-title");
    var descEl = document.getElementById("region-description");
    var linkEl = document.getElementById("region-link");

    console.log("[AGL MAP] regions found:", regions.length, "pins:", pins.length);

    if (!regions.length || !panel || !titleEl || !descEl || !linkEl) {
      console.warn("[AGL MAP] Missing regions or panel elements.", {
        regions: regions.length,
        panel: !!panel,
        titleEl: !!titleEl,
        descEl: !!descEl,
        linkEl: !!linkEl,
      });
      return;
    }

    var activeRegionKey = null;

    function setPanel(key) {
      var data = regionData[key];
      if (!data) {
        console.warn("[AGL MAP] No regionData for key:", key);
        return;
      }

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
      // NodeList.forEach is fine in modern browsers; keeping as-is
      regions.forEach(function (r) {
        r.classList.remove("map-region_active");
      });
    }

    // Start: hide panel on mobile until first tap
    if (isMobile()) panel.classList.add(PANEL_HIDDEN_CLASS);

    regions.forEach(function (regionEl) {
      var key = regionEl.dataset.region;
      if (!key) console.warn("[AGL MAP] region missing data-region:", regionEl);

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

    // --------------------------------------------
    // GSAP animation (optional)
    // --------------------------------------------
    if (typeof gsap !== "undefined") {
      var tl = gsap.timeline();

      tl.from(container.querySelectorAll(".map-region path"), {
        opacity: 0,
        scale: 0.95,
        transformOrigin: "50% 50%",
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.06,
        delay: 0.1,
      });

      if (pins.length) {
        // hide pins at time 0 (no flash)
        tl.set(
          pins,
          { opacity: 0, scale: 0.6, y: 14, transformOrigin: "50% 50%" },
          0
        );

        tl.to(
          pins,
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.5,
            ease: "power2.out",
            stagger: 0.18,
          },
          "-=0.25"
        );
      }
    } else {
      console.warn("[AGL MAP] GSAP not found — skipping animation.");
    }
  }

  // --------------------------------------------
  // Load SVG into container
  // --------------------------------------------
  function loadSvg() {
    var container = document.getElementById(containerId);

    console.log("[AGL MAP] container found?", !!container, "id:", containerId, container);

    if (!container) {
      console.warn("[AGL MAP] Container not found:", containerId);
      return;
    }

    console.log("[AGL MAP] SVG_URL =", SVG_URL);

    fetch(SVG_URL, { cache: "no-store" })
      .then(function (res) {
        console.log(
          "[AGL MAP] fetch status:",
          res.status,
          "ok:",
          res.ok,
          "final url:",
          res.url
        );

        if (!res.ok) {
          // often a CDN 404 returns HTML — show a preview
          return res.text().then(function (txt) {
            console.error(
              "[AGL MAP] Bad response body (first 200):",
              txt.slice(0, 200)
            );
            throw res;
          });
        }

        return res.text();
      })
      .then(function (svgText) {
        console.log("[AGL MAP] first 120 chars:", svgText.slice(0, 120));

        container.innerHTML = svgText;

        console.log("[AGL MAP] SVG injected. Length:", svgText.length);

        // extra sanity check counts (same as initMap but before)
        var regionsCount = container.querySelectorAll(".map-region").length;
        var pinsCount = container.querySelectorAll('g[id^="pin-"]').length;
        console.log("[AGL MAP] regions found:", regionsCount, "pins:", pinsCount);

        initMap(container);
      })
      .catch(function (err) {
        console.error("[AGL MAP] Failed to load map.svg", err);
      });
  }

  // Run once DOM is ready
  if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadSvg);
} else {
  // DOM already ready (very common in Webflow)
  loadSvg();
}

})();
