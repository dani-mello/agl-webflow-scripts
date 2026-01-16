

(function () {
  "use strict";

  var EMBED_SEL = ".js-yt-embed";
  var PLAYER_SEL = ".js-yt-player";
  var BTN_SOUND_SEL = ".js-yt-sound";
  var BTN_UNMUTE_SEL = ".js-yt-unmute";

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
    if (!root.__ytState) root.__ytState = { player: null, ready: false, queue: [] };
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
      try { fn(s.player); } catch (e) {}
    }
  }

  function updateUI(root, muted) {
    var soundBtn = root.querySelector(BTN_SOUND_SEL);
    if (soundBtn) {
      soundBtn.setAttribute("aria-pressed", String(!muted));
      soundBtn.textContent = muted ? "Sound off" : "Sound on";
    }

    // overlay is visible when muted; hidden when audible
    if (muted) {
      root.classList.remove("is-audible");
      root.classList.add("is-muted");
    } else {
      root.classList.add("is-audible");
      root.classList.remove("is-muted");
    }
  }

  function setMuted(root, player, muted) {
    if (!player) return;
    if (muted) player.mute();
    else {
      player.unMute();
      try { player.setVolume(80); } catch (e) {}
    }
    updateUI(root, muted);
  }

  function initOne(root) {
    if (!root || root.dataset.ytInit === "1") return;
    root.dataset.ytInit = "1";

    var videoId = root.getAttribute("data-yt-id");
    var holder = root.querySelector(PLAYER_SEL);
    if (!videoId || !holder) return;

    var startMuted = (root.getAttribute("data-yt-muted") || "false") === "true";
    var s = getState(root);

    // Click video area toggles play/pause.
    // BUT ignore clicks on the sound buttons.
    root.style.cursor = "pointer";
    root.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest(BTN_SOUND_SEL + "," + BTN_UNMUTE_SEL)) {
        return;
      }
      runOrQueue(root, function (p) {
        var st = p.getPlayerState(); // 1 playing, 2 paused
        if (st === 1) p.pauseVideo();
        else p.playVideo();
      });
    });

    // Sound toggle button
    var soundBtn = root.querySelector(BTN_SOUND_SEL);
    if (soundBtn) {
      soundBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        runOrQueue(root, function (p) {
          setMuted(root, p, !p.isMuted());
        });
      });
    }

    // Big “Tap for sound” overlay: unmute + play (user gesture)
    var unmuteBtn = root.querySelector(BTN_UNMUTE_SEL);
    if (unmuteBtn) {
      unmuteBtn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        runOrQueue(root, function (p) {
          setMuted(root, p, false);
          p.playVideo();
        });
      });
    }

    // Create player
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
          setMuted(root, s.player, startMuted);
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

  // Webflow-safe timing
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Optional: manual re-init (for CMS loads, tabs, etc.)
  window.YTEmbedInit = initAll;
})();
