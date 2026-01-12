console.log("[YT] control v5 loaded ✅");

(function () {
  const EMBED_SEL = ".js-yt-embed";
  const PLAYER_SEL = ".js-yt-player";

  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();

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

  function getState(root) {
    if (!root.__ytState) root.__ytState = { player: null, ready: false, queue: [] };
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

  function initOne(root) {
    if (!root || root.dataset.ytInit === "1") return;
    root.dataset.ytInit = "1";

    const videoId = root.getAttribute("data-yt-id");
    const holder = root.querySelector(PLAYER_SEL);
    if (!videoId || !holder) return;

    const startMuted = (root.getAttribute("data-yt-muted") || "false") === "true";
    const s = getState(root);

    // Click to toggle play/pause (bind once, guaranteed)
    root.style.cursor = "pointer";
    root.addEventListener("click", function (e) {
      // if you later add buttons/links inside, you can ignore them here
      // if (e.target.closest("button,a")) return;

      runOrQueue(root, (p) => {
        const state = p.getPlayerState(); // 1 playing, 2 paused
        if (state === 1) p.pauseVideo();
        else p.playVideo();
      });
    });

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
          if (startMuted) s.player.mute();
          else s.player.unMute();
          flushQueue(root);
        }
      }
    });
  }

  async function initAll() {
    const roots = Array.from(
