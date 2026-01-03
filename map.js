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
  function initMap() {
    var regions = document.querySelectorAll('.map-region');
    var pins    = document.querySelectorAll('g[id^="pin-"]');

    if (!regions.length) return;

    // Example GSAP entrance
    if (typeof gsap !== 'undefined') {
      var tl = gsap.timeline();

      tl.from('.map-region path', {
        opacity: 0,
        scale: 0.95,
        transformOrigin: '50% 50%',
        duration: 0.6,
        ease: 'power2.out',
        stagger: 0.06
      });

      if (pins.length) {
        tl.set(pins, { opacity: 0, scale: 0.6, y: 14 }, 0);
        tl.to(pins, {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: 0.18
        }, '-=0.25');
      }
    }

    // region click / hover logic continues here…
  }

  // Run
  loadSvg();
})();

