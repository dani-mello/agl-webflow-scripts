// bottom-nav.js
// Generic bottom fixed submenu (opens a panel + scrolls to section by slug)
// Works when your sections have id="{slug}" and menu links have data-scroll-to="{slug}"

console.log(
  "%cBOTTOM NAV JS LOADED (V1)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (window.__bottomNavInit) return;
  window.__bottomNavInit = true;

  const cfg = {
    root: ".c-bottom-nav",
    toggle: ".c-bottom-nav_toggle",
    panel: ".c-bottom-nav_panel",
    openClass: "is-open",
    linkAttr: "data-scroll-to",
    // If you have a fixed header too, add its px height here.
    extraOffsetPx: 0
  };

  function init() {
    const nav = document.querySelector(cfg.root);
    if (!nav) return;

    const toggle = nav.querySelector(".c-bottom-nav_bar");
    const panel = nav.querySelector(cfg.panel);
    if (!toggle || !panel) return;

    // a11y hooks
    if (!panel.id) panel.id = "bottomNavPanel";
    toggle.setAttribute("aria-controls", panel.id);
    toggle.setAttribute("aria-expanded", "false");

    const links = Array.from(nav.querySelectorAll(`[${cfg.linkAttr}]`));

    function openNav() {
      nav.classList.add(cfg.openClass);
      toggle.setAttribute("aria-expanded", "true");
    }

    function closeNav() {
      nav.classList.remove(cfg.openClass);
      toggle.setAttribute("aria-expanded", "false");
    }

    function toggleNav() {
      nav.classList.contains(cfg.openClass) ? closeNav() : openNav();
    }

    // Toggle
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    // Scroll handler
    function scrollToId(id) {
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;

      const y =
        el.getBoundingClientRect().top +
        window.pageYOffset -
        cfg.extraOffsetPx;

      window.scrollTo({ top: y, behavior: "smooth" });
    }

    // Click a category
    links.forEach((a) => {
      a.addEventListener("click", (e) => {
        e.preventDefault();
        const id = a.getAttribute(cfg.linkAttr);
        scrollToId(id);
        closeNav();
      });
    });

    // Click outside closes
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains(cfg.openClass)) return;
      if (nav.contains(e.target)) return;
      closeNav();
    });

    // ESC closes
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeNav();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

// --- Toggle icon (two-line + -> x) : BULLETPROOF VERSION ---
const toggleItems = nav.querySelector(".c-bottom-nav_toggle-items");
const lineH = nav.querySelector(".c-bottom-nav_toggle-line._h");
const lineV = nav.querySelector(".c-bottom-nav_toggle-line._v");

function forceToggleGeometry() {
  if (!toggleItems || !lineH || !lineV) return;

  // Force a predictable box for rotation
  toggleItems.style.position = "relative";
  toggleItems.style.width = "22px";
  toggleItems.style.height = "22px";

  // Force both lines to overlay at the same pivot
  [lineH, lineV].forEach((ln) => {
    ln.style.position = "absolute";
    ln.style.left = "50%";
    ln.style.top = "50%";
    ln.style.width = "22px";
    ln.style.height = "2px";
    ln.style.transformOrigin = "center";
    ln.style.transition = "transform 220ms cubic-bezier(0.22,1,0.36,1)";
  });
}

function setPlus() {
  if (!lineH || !lineV) return;
  lineH.style.transform = "translate(-50%, -50%) rotate(0deg)";
  lineV.style.transform = "translate(-50%, -50%) rotate(90deg)";
}

function setX() {
  if (!lineH || !lineV) return;
  lineH.style.transform = "translate(-50%, -50%) rotate(45deg)";
  lineV.style.transform = "translate(-50%, -50%) rotate(-45deg)";
}

// Call once on init
forceToggleGeometry();
setPlus();


  
})();
