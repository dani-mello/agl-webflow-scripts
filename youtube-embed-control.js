console.log("[YT] youtube-embed-control.js loaded ✅");

(function () {
  var EMBED_SELECTOR = ".js-yt-embed";
  var PLAYER_SELECTOR = ".js-yt-player";
  var THRESHOLD = 0.5;

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__ytApiPromise) return window.__ytApiPromise;

    window.__ytApiPromise = new Promise(function (resolve) {
      window.__ytApiReadyCallbacks = window.__ytApiReadyCallbacks || [];
      window.__ytApiReadyCallbacks.push(resolve);

      if (!window.__ytApiReadyHooked) {
        window.__ytApiReadyHooked = true;

        var prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          try { if (typeof prev === "function") prev(); } catch (e) {}
          var cbs = window.__ytApiReadyCallbacks || [];
          while (cbs.length) {
            try { cbs.shift()(); } catch (e) {}
          }
        };
      }

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        var tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    });

    return window.__ytApiPromise;
  }

  function initOne(el) {
    if (el.dataset.ytInit === "1") return;
    el.dataset.ytInit = "1";

    var videoId = el.getAttribute("data-yt-id");
    if (!videoId) return;

    var mount = el.querySelector(PLAYER_SELECTOR);
    if (!mount) {
      console.warn("[YT] Missing .js-yt-player inside embed", el);
      return;
    }

    // Ensure mount has an id
    if (!mount.id) mount.id = "yt_" + Math.random().toString(36).slice(2);

    var player = new window.YT.Player(mount.id, {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        mute: 1,
        controls: 0,
        loop: 1,
        playlist: videoId,
        playsinline: 1,
        rel: 0,
        modestbranding: 1
      },
      events: {
        onReady: function (e) {
          try { e.target.mute(); } catch (err) {}
        }
      }
    });

    // Play/pause on visibility
    if (!("IntersectionObserver" in window)) {
      try { player.playVideo(); } catch (e) {}
      return;
    }

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            try { player.playVideo(); } catch (e) {}
          } else {
            try { player.pauseVideo(); } catch (e) {}
          }
        });
      },
      { threshold: THRESHOLD }
    );

    io.observe(el);
  }

  function initAll() {
    var els = document.querySelectorAll(EMBED_SELECTOR);
    if (!els.length) {
      console.warn("[YT] No embeds found for", EMBED_SELECTOR);
      return;
    }

    loadYouTubeAPI().then(function () {
      els.forEach(initOne);
    });
  }

  // Webflow: run on DOM ready + also after full load (covers some edge cases)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
  window.addEventListener("load", function () {
    // If something rendered late (tabs/IX2), this can catch it
    initAll();
  });
})();
