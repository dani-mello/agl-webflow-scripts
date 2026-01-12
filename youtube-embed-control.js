console.log("[YT] control v3 loaded ✅");

(function () {
  const EMBED_SEL = ".js-yt-embed";
  const BTN_SOUND_SEL = ".js-yt-sound";
  const BTN_UNMUTE_SEL = ".js-yt-unmute";

  // Load YT API once
  function loadYouTubeAPI() {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) return resolve();
      const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
      if (existing) return (window.onYouTubeIframeAPIReady = resolve);

      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      window.onYouTubeIframeAPIReady = resolve;
      document.head.appendChild(tag);
    });
  }

  const players = new Map(); // rootEl -> YT.Player

  function setMuted(root, player, muted) {
    if (!player) return;
    if (muted) {
      player.mute();
      root.classList.remove("is-audible");
      root.classList.add("is-muted");
    } else {
      player.unMute();
      // set a sensible default volume (optional)
      try { player.setVolume(80); } catch (e) {}
      root.classList.add("is-audible");
      root.classList.remove("is-muted");
    }

    const btn = root.querySelector(BTN_SOUND_SEL);
    if (btn) {
      btn.setAttribute("aria-pressed", String(!muted));
      btn.textContent = muted ? "Sound off" : "Sound on";
    }
  }

  function initOne(root) {
    const id = root.getAttribute("data-yt-id");
    if (!id) return;

    // prevent double init
    if (root.dataset.ytInit === "1") return;
    root.dataset.ytInit = "1";

    const holder = root.querySelector(".js-yt-player");
    if (!holder) return;

    const startMuted = (root.getAttribute("data-yt-muted") || "true") === "true";

    const player = new YT.Player(holder, {
      videoId: id,
      playerVars: {
        autoplay: 0,          // you control when to play
        controls: 0,
        playsinline: 1,
        rel: 0,
        modestbranding: 1,
        iv_load_policy: 3
        // NOTE: mute is handled via API calls below
      },
      events: {
        onReady: () => {
          players.set(root, player);
          setMuted(root, player, startMuted);

          // If you want it to start immediately (muted), uncomment:
          // player.playVideo();
        }
      }
    });

    // Toggle sound button
    const soundBtn = root.querySelector(BTN_SOUND_SEL);
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const isMuted = player.isMuted();
        setMuted(root, player, !isMuted);
      });
    }

    // Big “Tap for sound” overlay
    const unmuteBtn = root.querySelector(BTN_UNMUTE_SEL);
    if (unmuteBtn) {
      unmuteBtn.addEventListener("click", () => {
        // user gesture: safe to unmute + play
        setMuted(root, player, false);
        player.playVideo();
      });
    }
  }

  async function initAll() {
    const roots = Array.from(document.querySelectorAll(EMBED_SEL));
    if (!roots.length) return;

    await loadYouTubeAPI();
    roots.forEach(initOne);
  }

  initAll();

  // OPTIONAL: expose helpers if you’re triggering via ScrollTrigger
  window.YTEmbed = {
    play(rootEl) {
      const p = players.get(rootEl);
      if (p) p.playVideo();
    },
    pause(rootEl) {
      const p = players.get(rootEl);
      if (p) p.pauseVideo();
    },
    mute(rootEl) {
      const p = players.get(rootEl);
      if (p) setMuted(rootEl, p, true);
    },
    unmute(rootEl) {
      const p = players.get(rootEl);
      if (p) setMuted(rootEl, p, false);
    }
  };
})();
