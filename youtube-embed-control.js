console.log("[YT] control v2 loaded ✅");

(function () {
  var EMBED_SELECTOR = ".js-yt-embed";
  var PLAYER_SELECTOR = ".js-yt-player";

  // When should it start playing?
  // 0.25 = earlier, 0.6 = later
  var THRESHOLD = 0.5;

  // Optional: if you want it to restart when it re-enters view
  var RESTART_ON_ENTER = false;

  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (window.__ytApiPromise) return window.__ytApiPromise;

    window.__ytApiPromise = new Promise(function (resolve, reject) {
      var src = "https://www.youtube.com/iframe_api";

      // Hook ready
      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        try { if (typeof prev === "function") prev(); } catch (e) {}
        resolve();
      };

      // Inject script once
      if (!document.querySelector('script[src="' + src + '"]')) {
        var tag = document.createElement("script");
        tag.src = src;
        tag.onerror = function () {
          reject(new Error("YouTube iframe_api failed to load (blocked?)"));
        };
        document.head.appendChild(tag);
      }
    });

    return window.__ytApiPromise;
  }

  function initEmbed(el) {
    if (el.dataset.ytInit === "1") return;
    el.dataset.ytInit = "1";

    var videoId = el.getAttribute("data-yt-id");
    if (!videoId) return;

    var mount = el.querySelector(PLAYER_SELECTOR);
    if (!mount) {
      console.warn("[YT] Missing .js-yt-player inside", el);
      return;
    }

    if (!mount.id) mount.id = "yt_" + Math.random().toString(36).slice(2);

    var player = new window.YT.Player(mount.id, {
      videoId: videoId,
      playerVars: {
        autoplay: 0,
        mute: 1,
        controls: 0,
        loop: 1,
        playlist: videoId, // required for loop
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

    // IntersectionObserver play/pause
    if (!("IntersectionObserver" in window)) return;

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          // Only control once player is ready-ish
          if (!player || typeof player.playVideo !== "function") return;

          if (entry.isIntersecting) {
            if (RESTART_ON_ENTER) {
              try { player.seekTo(0, true); } catch (e) {}
            }
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
      console.warn("[YT] No elements found for", EMBED_SELECTOR);
      return;
    }

    loadYouTubeAPI()
      .then(function () {
        els.forEach(initEmbed);
      })
      .catch(function (err) {
        console.warn("[YT] API blocked or failed:", err.message);
      });
  }

  // Webflow-friendly init
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
  window.addEventListener("load", initAll);
})();
