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

  // Add a hook class so you can size it easily in CSS
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

    // ---- MOBILE SIZE BOOST (optional but useful) ----
    // This won't break desktop. If you prefer CSS-only, you can remove this block.
    // It gives the container more presence on small screens.
    if (isMobile()) {
      container.style.width = "100%";
      container.style.maxWidth = "100%";
      container.style.minHeight = "520px"; // tweak: 480–650 depending on your design
    } else {
      container.style.minHeight = "";
    }

    // Add hook class for CSS targeting
    container.classList.add(MAP_READY_CLASS);

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

    // Start: show an instructional panel on mobile so people know it's clickable
if (panel && isMobile()) {
  panel.classList.remove(PANEL_HIDDEN_CLASS);

  if (titleEl) titleEl.textContent = "Explore the map";
  if (descEl) descEl.textContent = "Tap a region to see trips and details.";
  if (linkEl) {
    linkEl.style.display = "none"; // hide link until a region is selected
    linkEl.href = "#";
  }
}


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
    // GSAP PIN ANIMATION (only when in view)
    // --------------------------------------------
    var hasGsap = typeof window.gsap !== "undefined";
    var hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

    console.log("[AGL MAP] GSAP present?", hasGsap, "ScrollTrigger present?", hasScrollTrigger);

    if (!pins.length) return;

    // Ensure pins render above regions (SVG stacking order)
    var svgEl = container.querySelector("svg");
    if (svgEl) {
      pins.forEach(function (pin) {
        svgEl.appendChild(pin);
      });
    }

    // Force SVG transform behavior so scale/y work on <g>
    pins.forEach(function (pin) {
      pin.style.transformBox = "fill-box";
      pin.style.transformOrigin = "50% 80%";
      pin.style.willChange = "transform, opacity";
    });

    // Set initial hidden state so they don't flash before trigger
    if (hasGsap) {
      window.gsap.set(pins, { opacity: 0, y: 14, scale: 0.6 });
    } else {
      // Fallback: no GSAP, just show them
      pins.forEach(function (pin) {
        pin.style.opacity = 1;
      });
      return;
    }

    function playPins() {
      console.log("[AGL MAP] animating pins now…");

      window.gsap.to(pins, {
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
      });
    }

    // If ScrollTrigger exists, trigger at 60% viewport
    if (hasScrollTrigger) {
      // Safety: register once here (Webflow sometimes runs scripts in weird order)
      try {
        window.gsap.registerPlugin(window.ScrollTrigger);
      } catch (e) {}

      // Animate AFTER paint (important for injected SVG)
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.ScrollTrigger.create({
            trigger: container,        // your map container
            start: "top 60%",          // ✅ only when map is in view
            once: true,                // ✅ run once (remove if you want replay)
            onEnter: playPins,
            // markers: true,          // uncomment to debug
          });

          // Make sure ST calculates positions correctly after SVG injection
          window.ScrollTrigger.refresh();
        });
      });
    } else {
      // Fallback: no ScrollTrigger → animate on paint
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          playPins();
        });
      });
    }
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
