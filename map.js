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

  
  var regionData = {
  aoraki: {
    title: "Aoraki Mount Cook and Westland",
    description:
      "Our home turf. The heart of New Zealand alpinism. Where colossal glaciers and towering peaks provide a unique training ground for the world’s great ranges. Learning to climb here will take you safely to any mountain region on Earth.",
    url: "#aoraki-trips",
  },

  "methven-heliski": {
    title: "The Arrowsmiths",
    description:
      "Hidden behind the rolling Canterbury high country lies the Arrowsmiths, a formidable sanctuary of jagged, glaciated peaks and vast snowfields. Stretching between the Rangitata and Rakaia headwaters, this rugged wilderness is a playground for those seeking remote alpine summits and world-class heliskiing close to Christchurch.",
    url: "#arrowsmiths-trips",
  },

  aspiring: {
    title: "Mount Aspiring Region",
    description:
      "The Aspiring region offers a breathtaking tapestry of ancient glaciers, deep beech forests, and shimmering alpine lakes. It is a true wilderness playground with world-class climbing.",
    url: "#aspiring-trips",
  },

  fiordland: {
    title: "The Darrans - Fiordland",
    description:
      "Rising vertically from the depths of the fiords, the Darran Mountains are a realm of sheer granite giants and primeval wilderness. This is New Zealand’s most remote and rugged alpine frontier, where colossal rainfall has carved a landscape of prehistoric scale and world-class rock.",
    url: "#fiordland-trips",
  },

  "oteake-conservation-area": {
    title: "Oteake Range",
    description:
      "An expanse of golden tussock, stark scree slopes, and big-sky freedom. This unique Otago wilderness offers a timeless, off-the-beaten-path landscape perfect for remote alpine trekking and backcountry exploration—away from the jagged peaks.",
    url: "#oteake-trips",
  },

  remarkables: {
    title: "The Remarkables",
    description:
      "Rising sharply above Lake Wakatipu, the Remarkables are a serrated wall of sheer schist dominating the Queenstown horizon. Here lies a world-class alpine playground, offering some of the country’s most accessible and thrilling technical rock, ice, and mixed climbing.",
    url: "#remarkables-trips",
  },
};
  function initMap(container) {
    var regions = container.querySelectorAll(".map-region");
    var pins = container.querySelectorAll('g[id^="pin-"]');

    var panel = document.querySelector(".c-map_panel");
    var titleEl = document.getElementById("region-title");
    var descEl = document.getElementById("region-description");
    var linkEl = document.getElementById("region-link");

    // Mobile sizing
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

    // Mobile default panel
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
        duration: 1,
        ease: "power2.out",
        stagger: 0.25,
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
            trigger: svgEl,
            start: "top 50%",
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

 
  window.addEventListener("pageshow", function () {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      });
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadSvg);
  } else {
    loadSvg();
  }
})();
