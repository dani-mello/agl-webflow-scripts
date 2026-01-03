console.log("[AGL MAP] SVG injected. Length:", svgText.length);


(function () {
  var owner = 'dani-mello';
  var repo  = 'agl-webflow-scripts';
  var branchOrSha = 'main'; // jsDelivr will resolve this to the pinned SHA you already load

  var SVG_URL =
    'https://cdn.jsdelivr.net/gh/' +
    owner + '/' + repo + '@' + branchOrSha + '/map.svg';

  var containerId = 'agl-map-container';

  function loadSvg() {
    var container = document.getElementById(containerId);
    if (!container) return;

    fetch(SVG_URL)
      .then(function (res) {
        if (!res.ok) throw res;
        return res.text();
      })
      .then(function (svg) {
        container.innerHTML = svg;

        // IMPORTANT: init only AFTER SVG exists
        initMap();
      })
      .catch(function (err) {
        console.error('Failed to load map.svg', err);
      });
  }

  // --------------------------------------------
  // ALL your GSAP + interaction logic goes here
  // --------------------------------------------

document.addEventListener("DOMContentLoaded", function () {
  // ----- CONFIG -----
  const PANEL_HIDDEN_CLASS = "is-hidden";
  const isMobile = () => window.matchMedia("(max-width: 768px)").matches;

  // Your region copy goes here (injecting via JS is fine)
  const regionData = {
    "aoraki": {
      title: "Aoraki / Mount Cook",
      description: "Glaciers, seracs, and serious alpine objectives — our home range.",
      url: "#aoraki-trips"
    },
    "aspiring": {
      title: "Mount Aspiring",
      description: "Long approaches, rewarding ridges, and classic summit days.",
      url: "#aspiring-trips"
    },
    "fiordland": {
      title: "Fiordland",
      description: "Remote granite, deep fiords, heavy weather — proper wilderness.",
      url: "#fiordland-trips"
    }
    // add the rest...
  };

  // ----- DOM -----
  const regions = document.querySelectorAll(".map-region");
  const pins = document.querySelectorAll('g[id^="pin-"]');

  const panel = document.querySelector(".c-map_panel");
  const titleEl = document.getElementById("region-title");
  const descEl  = document.getElementById("region-description");
  const linkEl  = document.getElementById("region-link");

  if (!regions.length || !panel || !titleEl || !descEl || !linkEl) return;

  let activeRegionKey = null;

  function setPanel(key){
    const data = regionData[key];
    if (!data) return;

    titleEl.textContent = data.title;
    descEl.textContent = data.description;
    linkEl.href = data.url || "#";
    panel.classList.remove(PANEL_HIDDEN_CLASS);
  }

  function hidePanel(){
    // On desktop you might want it always visible — so only auto-hide on mobile
    if (!isMobile()) return;
    panel.classList.add(PANEL_HIDDEN_CLASS);
  }

  function clearActive(){
    regions.forEach(r => r.classList.remove("map-region_active"));
  }

  // Start: on mobile, hide panel until first tap
  if (isMobile()) panel.classList.add(PANEL_HIDDEN_CLASS);

  // ----- INTERACTIONS -----
  regions.forEach((regionEl) => {
    const key = regionEl.dataset.region;

    regionEl.addEventListener("mouseenter", () => {
      if (isMobile()) return;
      if (activeRegionKey) return;
      setPanel(key);
    });

    regionEl.addEventListener("click", (e) => {
      e.stopPropagation();
      activeRegionKey = key;
      clearActive();
      regionEl.classList.add("map-region_active");
      setPanel(key);
    });
  });

  // Tap/click outside hides panel (mobile only)
  document.addEventListener("click", (e) => {
    if (!isMobile()) return;
    const clickedInsidePanel = panel.contains(e.target);
    const clickedRegion = e.target.closest(".map-region");
    if (!clickedInsidePanel && !clickedRegion) {
      activeRegionKey = null;
      clearActive();
      hidePanel();
    }
  });

  // ----- GSAP ANIMATION -----
  const hasGsap = typeof gsap !== "undefined";
  if (hasGsap) {
    const tl = gsap.timeline();

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
      // IMPORTANT: set pins to hidden at time 0 so they don't flash visible
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
});

