console.log("[YT] control v5 loaded ✅");

/* youtube-embed-control.js
   YouTube iframe API embed with click-to-toggle + sound support.
   HTML:
   <div class="video-embed js-yt-embed" data-yt-id="r0MGm-MgHkE" data-yt-muted="false">
     <div class="js-yt-player"></div>
   </div>
*/

(function () {
  "use strict";

  var EMBED_SEL = ".js-yt-embed";
  var PLAYER_SEL = ".js-yt-player";

  function loadYouTubeAPI() {
    return new Promise(function (resolve) {
      if (window.YT && window.YT.Player) return resolve();

      var existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) {
        var prevReady = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          if (typeof prevReady === "function") prevReady();
          resolve();
        };
        return;
      }

      var tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";

      var prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        resolve();
      };

      document.head.appendChild(tag);
    });
  }

  function getState(root) {
    if (!root.__ytState) {
      root.__ytState = { player: null, ready: false, queue: [] };
    }
    return root.__ytState;
  }

  function runOrQueue(root, fn) {
    var s = getState(root);
    if (s.ready && s.player) fn(s.player);
    else s.queue.push(fn);
  }

  function flushQueue(root) {
    var s = getState(root);
    while (s.queue.length) {
      var fn = s.queue.shift();
      try {
        fn(s.player);
      } catch (e) {}
    }
  }

  function initOne(root) {
    if (!root || root.dataset.ytInit === "1") return;
    root.dataset.ytInit = "1";

    var videoId = root.getAttribute("data-yt-id");
    var holder = root.querySelector(PLAYER_SEL);
    if (!videoId || !holder) return;

    var startMuted = (root.getAttribute("data-yt-muted") || "false") === "true";
    var s = getState(root);

    // Click to toggle play/pause
    root.style.cursor = "pointer";
    root.addEventListener("click", function () {
      runOrQueue(root, function (p) {
        var state = p.getPlayerState(); // 1 playing, 2 paused
        if (state === 1) p.pauseVideo();
        else p.playVideo();
      });
    });

    s.player = new YT.Player(holder, {
      videoId: videoId,
      playerVars: {
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3
      },
      events: {
        onReady: function () {
          s.ready = true;
          if (startMuted) s.player.mute();
          else s.player.unMute();
          flushQueue(root);
        }
      }
    });
  }

  function initAll() {
    var roots = Array.prototype.slice.call(document.querySelectorAll(EMBED_SEL));
    if (!roots.length) return;

    loadYouTubeAPI().then(function () {
      roots.forEach(initOne);
    });
  }

  // Webflow-safe run timing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Optional manual re-init hook
  window.YTEmbedInit = initAll;
})();
