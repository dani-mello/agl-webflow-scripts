// bottomnav-stopper.js
// Generic bottom nav stopper
// Keeps bottom nav fixed until it reaches a stop marker

(function () {
  if (window.__BOTTOMNAV_STOPPER__) return;
  window.__BOTTOMNAV_STOPPER__ = true;

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  }

  onReady(() => {
    const nav = document.querySelector(".js-trip-bottomnav-move");
    const stopEl = document.querySelector(".js-trip-bottomnav-stop");
    if (!nav || !stopEl) return;

    function update() {
      const navH = nav.offsetHeight || 0;
      const stopRect = stopEl.getBoundingClientRect();
      const overlap = Math.max(0, navH - stopRect.top);
      nav.style.transform = overlap ? `translateY(${-overlap}px)` : "translateY(0)";
    }

    let raf = 0;
    function requestUpdate() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    }

    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    update();
  });
})();
