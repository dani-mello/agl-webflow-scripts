// bottom-nav.js
// Generic bottom fixed submenu (opens a panel + scrolls to section by slug)
// Works when sections have id="{slug}" and menu links have data-scroll-to="{slug}"
// Includes GSAP stagger entrance for links + responsive scroll offset

console.log(
  "%cBOTTOM NAV JS LOADED (V4)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  if (window.__bottomNavInit) return;
  window.__bottomNavInit = true;

  const rem = () =>
    parseFloat(getComputedStyle(document.documentElement).fontSize);

  const cfg = {
    root: ".c-bottom-nav",
    bar: ".c-bottom-nav_bar",          // whole bar is clickable
    panel: ".c-bottom-nav_panel",
    openClass: "is-open",
    linkAttr: "data-scroll-to",

    // Responsive offset:
    // mobile (<768px): 3rem
    // desktop: 6rem
    extraOffsetPx: () => (window.innerWidth < 768 ? rem() * 3 : rem() * 6),

    // Staggered items
    animItem: ".c-bottom-nav_link"
  };

  function init() {
    const nav = document.querySelector(cfg.root);
    if (!nav) return;

    const bar = nav.querySelector(cfg.bar);
    const panel = nav.querySelector(cfg.panel);
    if (!bar || !panel) return;

    // a11y
    if (!panel.id) panel.id = "bottomNavPanel";
    bar.setAttribute("aria-controls", panel.id);
    bar.setAttribute("aria-expanded", "false");

    const links = Array.from(nav.querySelectorAll(`[${cfg.linkAttr}]`));

    // ----------------------------
    // GSAP stagger (matches top menu feel)
    // ----------------------------
    const animatePanelLinks = (panelEl) => {
      if (!panelEl) return;

      const items = panelEl.querySelectorAll(cfg.animItem);
      if (!items.length) return;

      if (typeof window.gsap === "undefined") return;

      gsap.killTweensOf(items);
      gsap.set(items, { autoAlpha: 0, y: 12 });

      // Double rAF ensures layout is settled after panel opens
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gsap.to(items, {
            autoAlpha: 1,
            y: 0,
            duration: 0.4,
            ease: "power3.out",
            stagger: 0.08,
            clearProps: "opacity,visibility,transform"
          });
        });
      });
    };

    function openNav() {
      if (nav.classList.contains(cfg.openClass)) return;
      nav.classList.add(cfg.openClass);
      bar.setAttribute("aria-expanded", "true");
      animatePanelLinks(panel);
    }

    function closeNav() {
      nav.classList.remove(cfg.openClass);
      bar.setAttribute("aria-expanded", "false");
    }

    function toggleNav() {
      nav.classList.contains(cfg.openClass) ? closeNav() : openNav();
    }

    // Toggle (click anywhere on the bar)
    bar.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    });

    // ----------------------------
    // Scroll with responsive offset
    // ----------------------------
    function scrollToId(id) {
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;

      const offset =
        typeof cfg.extraOffsetPx === "function"
          ? cfg.extraOffsetPx()
          : cfg.extraOffsetPx;

      const y =
        el.getBoundingClientRect().top +
        window.pageYOffset -
        offset;

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
})();
