console.log(
  "%c[AGL] theme-scroll.js V2 loaded ✅",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

/* theme-scroll.js
 * Toggles `.is-light` on `.page-wrapper` after 50% scroll.
 */

(function () {
  if (window.__agThemeScrollInit) return;
  window.__agThemeScrollInit = true;

  const WRAP_SELECTOR = ".page-wrapper";
  const LIGHT_CLASS = "is-light";
  const THRESHOLD = 0.5;

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

  applyTheme();
  window.addEventListener("scroll", applyTheme, { passive: true });
  window.addEventListener("resize", applyTheme);
})();
