/* youtube-embed-control.js
   - Webflow-friendly YouTube background embed with play/pause on scroll
   - Supports multiple embeds via: .js-yt-embed[data-yt-id="..."]
   - Uses IntersectionObserver, loads YT API once, prevents double init
*/

console.log("[YT] youtube-embed-control.js loaded ✅");

(function () {
  var EMBED_SELECTOR = ".js-yt-embed";
  var THRESHOLD = 0.5; // 0.25 starts sooner; 0.75 starts later

  // Track init per element + store players by element
  var players = new Map();

  // --------- Load YouTube IFrame API once ----------
  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();

    // If already loading, reuse promise
    if (window.__ytApiPromise) return window.__ytApiPromise;

    window.__ytApiPromise = new Promise(function (resolve) {
      // Queue resolves (in case multiple scripts load)
      window.__ytApiReadyCallbacks = window.__ytApiReadyCallbacks || [];
      window.__ytApiReadyCallbacks.push(resolve);

      // Create global handler once
      if (!window.__ytApiReadyHooked) {
        window.__ytApiReadyHooked = true;

        var previous = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          try {
            if (typeof previous === "function") previous();
          } catch (e) {}

          var cbs = window.__ytApiReadyCallbacks || [];
          while (cbs.length) {
            try {
              cbs.shift()();
            } catch (e) {}
          }
        };
      }

      // Inject script once
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        var tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });

    return window.__ytApiPromise;
  }

  // --------- Create a YouTube player inside an element ----------
  function createPlayer(el) {
    var videoId = el.getAttribute("data-yt-id");
    if (!videoId) return null;

    // Prevent double init
    if (el.dataset.ytInit === "1") return players.get(el) || null;
    el.dataset.ytInit = "1";

    // Create unique container for YT
    var containerId = el.id || ("yt_" + Math.random().toString(36).slice(2));
    el.id = containerId;

    var player = new window.YT.Player(containerId, {
      videoId: videoId,
      playerVars: {
        autoplay: 0, // we control it via IO
        mute: 1,
        controls: 0,
        loop: 1,
        playlist: videoId, // required for loop to work
        playsinline: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: function (e) {
          try {
            e.target.mute();
          } catch (err) {}
        }
      }
    });

    players.set(el, player);
    return player;
  }

  // --------- Visibility play/pause ----------
  function attachObserver(el, player) {
    if (!("IntersectionObserver" in window)) {
      // Fallback: just play immediately
      try {
        player.playVideo();
      } catch (e) {}
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!player) return;

          // Sometimes the player isn't ready yet; calls can fail safely
          if (entry.isIntersecting) {
            try {
              player.playVideo();
            } catch (e) {}
          } else {
            try {
              player.pauseVideo();
            } catch (e) {}
          }
        });
      },
      { threshold: THRESHOLD }
    );

    io.observe(el);
  }

  // --------- Init all embeds ----------
  function initAll() {
    var els = Array.prototype.slice.call(document.querySelectorAll(EMBED_SELECTOR));
    if (!els.length) return;

    loadYouTubeAPI().then(function () {
      els.forEach(function (el) {
        var player = createPlayer(el);
        if (player) attachObserver(el, player);
      });
    });
  }

  // Webflow runs scripts on DOM ready; also safe if loaded late
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();
