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
    const wrap = document.querySelector(WRAP_SELECTOR);
    if (!wrap) return;

    wrap.classList.toggle(LIGHT_CLASS, getProgress() >= THRESHOLD);
  }

  // Init + listeners
  applyTheme();
  window.addEventListener("scroll", applyTheme, { passive: true });
  window.addEventListener("resize", applyTheme);
})();
