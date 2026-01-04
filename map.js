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
    console.log(
      "[AGL MAP] panel/title/desc/link:",
      !!panel,
      !!titleEl,
      !!descEl,
      !!linkEl
    );

    // --- PANEL HELPERS ---
    function setPanel(key) {
      console.log("[AGL MAP] setPanel key:", key, "has data?", !!regionData[key]);

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

    // Start: hide panel on mobile until first tap
    if (panel && isMobile()) panel.classList.add(PANEL_HIDDEN_CLASS);

    // --- REGION INTERACTIONS ---
    var activeRegionKey = null;

    regions.forEach(function (regionEl) {
      // In SVG, getAttribute is more reliable than dataset in some cases
      var key = regionEl.getAttribute("data-region");

      console.log("[AGL MAP] region bind:", regionEl.id || "(no id)", "key:", key);

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

    // Tap/click outside hides panel (mobile only)
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
    // GSAP PIN ANIMATION (more reliable for <g>)
    // --------------------------------------------
    var hasGsap = typeof window.gsap !== "undefined";
    console.log("[AGL MAP] GSAP present?", hasGsap);

    if (!pins.length) return;

    // Ensure pins render above regions (SVG stacking order)
    var svgEl = container.querySelector("svg");
    if (svgEl) {
      pins.forEach(function (pin) {
        svgEl.appendChild(pin);
      });
    }

    if (!hasGsap) return;

    // Force SVG transform behavior so scale/y work on <g>
    pins.forEach(function (pin) {
      pin.style.transformBox = "fill-box";
      pin.style.transformOrigin = "50% 80%";
      pin.style.willChange = "transform, opacity";
    });

    // Animate AFTER paint (very important for injected SVG)
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        console.log("[AGL MAP] animating pins now…");

        window.gsap.fromTo(
          pins,
          { opacity: 0, y: 14, scale: 0.6 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.55,
            ease: "power2.out",
            stagger: 0.14,
            overwrite: "auto",
            onComplete: function () {
              console.log("[AGL MAP] pin animation complete ✅");
            },
          }
        );
      });
    });
  }

  // --------------------------------------------
  // Load SVG into container
  // --------------------------------------------
  function loadSvg() {
    var container = document.getElementById(containerId);

    console.log(
      "[AGL MAP] container found?",
      !!container,
      "id:",
      containerId,
      container
    );

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

        var regionsCount = container.querySelectorAll(".map-region").length;
        var pinsCount = container.querySelectorAll('g[id^="pin-"]').length;
        console.log("[AGL MAP] regions found:", regionsCount, "pins:", pinsCount);

        initMap(container);
      })
      .catch(function (err) {
        console.error("[AGL MAP] Failed to load map.svg", err);
      });
  }

  // Run once DOM is ready (Webflow often runs scripts after DOM is already ready)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSvg);
  } else {
    loadSvg();
  }
})();
