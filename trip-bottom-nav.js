// trip-bottom-nav-scroll.js
// Click + smooth scroll to section by slug
// Links: .btn-trip-bottom-nav[data-scroll-to="slug"]
// Targets: sections with id="slug"

(function () {
  if (window.__tripBottomNavScrollInit) return;
  window.__tripBottomNavScrollInit = true;

  const rem = () =>
    parseFloat(getComputedStyle(document.documentElement).fontSize);

  const cfg = {
    linkSel: ".btn-trip-bottom-nav",
    linkAttr: "data-scroll-to",

    // tweak these if needed
    extraOffsetPx: () => (window.innerWidth < 768 ? rem() * 3 : rem() * 6),
  };

  function scrollToId(id) {
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) return;

    const offset =
      typeof cfg.extraOffsetPx === "function"
        ? cfg.extraOffsetPx()
        : cfg.extraOffsetPx;

    const y = el.getBoundingClientRect().top + window.pageYOffset - offset;

    window.scrollTo({ top: y, behavior: "smooth" });
  }

  function init() {
    const links = Array.from(
      document.querySelectorAll(`${cfg.linkSel}[${cfg.linkAttr}]`)
    );
    if (!links.length) return;

    links.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = btn.getAttribute(cfg.linkAttr);
        scrollToId(id);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
