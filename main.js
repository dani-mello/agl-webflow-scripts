/* AGL Webflow Scripts - main.js
   Tip: Never put secret keys in here.
*/

(() => {
  // Wait until the DOM exists
  const ready = (fn) => {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  // Wait until an element exists (Webflow components can mount after DOMContentLoaded)
  const waitFor = (selector, cb, timeout = 4000) => {
    const start = Date.now();

    const check = () => {
      const el = document.querySelector(selector);
      if (el) return cb(el);

      if (Date.now() - start > timeout) {
        console.warn(`[AGL] Timeout waiting for ${selector}`);
        return;
      }
      requestAnimationFrame(check);
    };

    check();
  };

  ready(() => {
    console.log("[AGL] main.js loaded ✅ v10");
    console.log("[AGL] page =", document.body?.dataset?.page);

    const page = document.body?.dataset?.page;

    const onPage = (name, fn) => {
      if (page === name) {
        console.log(`[AGL] Running ${name} page scripts ✅`);
        fn();
      }
    };

    // ----------------------------
    // Panel animation (shared helper)
    // ----------------------------
    function animatePanelLinks(panel) {
      if (!panel) return;

      const items = panel.querySelectorAll(".panel-anim-item");
      if (!items.length) return;

      if (typeof window.gsap === "undefined") return;

      gsap.killTweensOf(items);

      gsap.set(items, { autoAlpha: 0, y: 12 });

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          gsap.to(items, {
            autoAlpha: 1,
            y: 0,
            duration: 0.45,
            ease: "power3.out",
            stagger: 0.08,
            clearProps: "opacity,visibility,transform",
          });
        });
      });
    }

    // ----------------------------
    // NAV: Explore mega menu
    // Uses: data-nav="explore" on the trigger
    // ----------------------------
    (() => {
      waitFor('[data-nav="explore"]', (exploreTrigger) => {
        console.log("[AGL] explore trigger found ✅");

        const exploreMega = document.querySelector(".explore-mega");
        const explorePrimaryWrap = document.querySelector(".explore-primary");
        const exploreSecondary = document.querySelector(".explore-secondary");

        if (!exploreMega || !explorePrimaryWrap) {
          console.warn("[AGL] Explore mega pieces missing (mega/primary).");
          return;
        }

        const primaryItems = [
          ...document.querySelectorAll(".explore-primary .btn-options"),
        ];
        const panels = [
          ...document.querySelectorAll(".explore-secondary .secondary-panel"),
        ];

        let closeTimer = null;

        const closeExplore = () => {
          exploreMega.classList.remove("is-open");
          exploreSecondary?.classList.remove("is-open");
          panels.forEach((p) => p.classList.remove("is-active"));
          explorePrimaryWrap.classList.remove("has-selection");
          primaryItems.forEach((i) => i.classList.remove("is-selected"));
        };

        const openExplore = () => {
          if (exploreMega.classList.contains("is-open")) return;
          if (closeTimer) clearTimeout(closeTimer);

          document.querySelector(".prepare-mega")?.classList.remove("is-open");
          exploreMega.classList.add("is-open");

          requestAnimationFrame(() => animatePanelLinks(explorePrimaryWrap));
        };

        const scheduleClose = () => {
          closeTimer = setTimeout(() => {
            if (
              !exploreTrigger.matches(":hover") &&
              !exploreMega.matches(":hover")
            ) {
              closeExplore();
            }
          }, 220);
        };

        exploreTrigger.addEventListener("mouseenter", openExplore);
        exploreMega.addEventListener("mouseenter", openExplore);
        exploreTrigger.addEventListener("mouseleave", scheduleClose);
        exploreMega.addEventListener("mouseleave", scheduleClose);

        exploreTrigger.addEventListener("click", (e) => e.preventDefault());

        primaryItems.forEach((item) => {
          item.addEventListener("mouseenter", () => {
            if (closeTimer) clearTimeout(closeTimer);

            const key = item.dataset.panel;
            ex
