/* theme-scroll.js
 * Alpine Guides — Theme switch on scroll (50% threshold)
 * Toggles `.is-light` on `.page-wrapper`
 */

console.log(
  "%c[AGL] theme-scroll.js loaded ✅",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (window.__agThemeScrollInit) return;
  window.__agThemeScrollInit = true;

  const WRAP_SELECTOR = ".page-wrapper";
  const LIGHT_CLASS = "is-light";
  const THRESHOLD = 0.5; // 50%

  function getProgress() {
    const doc = document.documentElement;
    const scrollTop = window.pageYOffset || doc.scrollTop || 0;
    const maxScroll = (doc.scrollHeight - window.innerHeight) || 1;
    return scrollTop / maxScroll;
  }

  function applyTheme() {
    const shouldLight = getProgress() < THRESHOLD; // <-- inverted
wrap.classList.toggle(LIGHT_CLASS, shouldLight);

  }

  // Init + listeners
  applyTheme();
  window.addEventListener("scroll", applyTheme, { passive: true });
  window.addEventListener("resize", applyTheme);
})();
