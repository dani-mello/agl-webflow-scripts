

/* theme-scroll.js
 * Toggles `.is-light` on <body> after 50% scroll.
 */

(function () {
  if (window.__agThemeScrollInit) return;
  window.__agThemeScrollInit = true;

  const LIGHT_CLASS = "is-light";
  const THRESHOLD = 0.5;

  function getProgress() {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || 0;
    const maxScroll = (doc.scrollHeight - window.innerHeight) || 1;
    return scrollTop / maxScroll;
  }

  function applyTheme() {
    const shouldBeLight = getProgress() >= THRESHOLD;
    document.body.classList.toggle(LIGHT_CLASS, shouldBeLight);
  }

  // Force dark on load
  document.body.classList.remove(LIGHT_CLASS);

  applyTheme();
  window.addEventListener("scroll", applyTheme, { passive: true });
  window.addEventListener("resize", applyTheme);
})();
