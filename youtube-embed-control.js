console.log("[YT] control v4 loaded ✅");

(function () {
  const EMBED_SEL = ".js-yt-embed";
  const PLAYER_SEL = ".js-yt-player";

  // ---------- Load API once ----------
  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();

      // if script already injected, just hook ready
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = function () {
          if (typeof prev === "function") prev();
          resolve();
        };
        return;
      }

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = function () {
        if (typeof prev === "function") prev();
        resolve();
      };
      document.head.appendChild(tag);
    });
  }

  // ---------- Helpers ----------
  function getState(root) {
    if (!root.__ytState) {
      root.__ytState = {
        player: null,
        ready: false,
        queue: []
      };
    }
    return root.__ytState;
  }

  function runOrQueue(root, fn) {
    const s = getState(root);
    if (s.ready && s.player) fn(s.player);
    else s.queue.push(fn);
  }

  function flushQueue(root) {
    const s = getState(root);
    while (s.queue.length) {
      const fn = s.queue.shift();
      try { fn(s.player); } catch (e) {}
    }
  }

  // ---------- Init one embed ----------
  function initOne(root) {
    if (!root || root.dataset.ytInit === "1") return;
    root.dataset.ytInit = "1";

    const videoId = root.getAttribute("data-yt-id");
    if (!videoId) return;

    const holder = root.querySelector(PLAYER_SEL);
    if (!holder) return;

    const startMuted = (root.getAttribute("data-yt-muted") || "true") === "true";

    const s = getState(root);

    s.player = new YT.Player(holder, {
      videoId,
      playerVars: {
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3
      },
      events: {
        onReady: () => {
          s.ready = true;

          // apply mute state
          if (startMuted) s.player.mute();
          else s.player.unMute();

          flushQueue(root);
        }
      }
    });
  }

  // ---------- Init all ----------
  async function initAll() {
    const roots = Array.from(document.querySelectorAll(EMBED_SEL));
    if (!roots.length) return;

    await loadYouTubeAPI();
    roots.forEach(initOne);
  }

  initAll();

  // ---------- Public API ----------
  window.YTEmbed = {
    get(elOrSelector) {
      const root =
        typeof elOrSelector === "string"
          ? document.querySelector(elOrSelector)
          : elOrSelector;
      if (!root) return null;
      return getState(root).player || null;
    },

    play(elOrSelector) {
      const root =
        typeof elOrSelector === "string"
          ? document.querySelector(elOrSelector)
          : elOrSelector;
      if (!root) return;
      runOrQueue(root, (p) => p.playVideo());
    },

    pause(elOrSelector) {
      const root =
        typeof elOrSelector === "string"
          ? document.querySelector(elOrSelector)
          : elOrSelector;
      if (!root) return;
      runOrQueue(root, (p) => p.pauseVideo());
    },

    toggle(elOrSelector) {
      const root =
        typeof elOrSelector === "string"
          ? document.querySelector(elOrSelector)
          : elOrSelector;
      if (!root) return;
      runOrQueue(root, (p) => {
        const state = p.getPlayerState();
        // 1 = playing, 2 = paused
        if (state === 1) p.pauseVideo();
        else p.playVideo();
      });
    }
  };
})();

