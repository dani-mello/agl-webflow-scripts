console.log("INTRO STATS COUNTER (V1)");

(function () {
  const counters = document.querySelectorAll(".c-intro_stats .u-h1");
  if (!counters.length) return;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  counters.forEach((el) => {
    const raw = el.getAttribute("data-count");
    if (!raw) return;

    const value = parseInt(raw.replace(/\D/g, ""), 10);
    const suffix = raw.replace(/[0-9]/g, "");

    let start = 0;
    const duration = prefersReduced ? 0 : 1200;
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * value);

      el.textContent = current.toLocaleString() + suffix;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = value.toLocaleString() + suffix;
      }
    }

    if (prefersReduced) {
      el.textContent = value.toLocaleString() + suffix;
    } else {
      requestAnimationFrame(update);
    }
  });
})();
