// faq-bottom-nav.js
// Bottom fixed FAQ category chooser (panel opens upward)
// Requires: none (vanilla JS)
// Usage: include after the FAQ nav markup exists (before </body> is ideal)

console.log(
  "%cFAQ BOTTOM NAV JS LOADED (V1)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  // Prevent double-binding
  if (window.__faqBottomNavInit) return;
  window.__faqBottomNavInit = true;

  const SELECTORS = {
    root: ".c-faq-nav",
    toggle: ".c-faq-nav_toggle",
    panel: ".c-faq-nav_panel",
    link: ".c-faq-nav_link"
  };

  function initFaqBottomNav() {
    const nav = document.querySelector(SELECTORS.root);
    if (!nav) return;

    const toggle = nav.querySelector(SELECTORS.toggle);
    const panel = nav.querySelector(SELECTORS.panel);
    const links = Array.from(nav.querySelectorAll(SELECTORS.link));

    if (!toggle || !panel) return;

    // Ensure panel has an id for aria-controls
    if (!panel.id) panel.id = "faqNavPanel";

    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-controls", panel.id);

    function openNav() {
      nav.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeNav() {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleNav() {
      nav.classList.contains("is-open") ? closeNav() : openNav();
    }

    // Toggle click
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    // Close after selecting a category (anchor link)
    links.forEach((a) => {
      a.addEventListener("click", () => closeNav());
    });

    // Click outside closes (works even with fixed + overlay-ish layouts)
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target)) return;
      closeNav();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  // Init on DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFaqBottomNav);
  } else {
    initFaqBottomNav();
  }
})();
