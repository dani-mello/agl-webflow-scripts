/* AGL Webflow Scripts - main.js
   Tip: Never put secret keys in here.
*/

(() => {
  // Avoid running before the DOM exists
  const ready = (fn) => {
     const waitFor = (selector, cb, timeout = 3000) => {
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

    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  ready(() => {
   console.log("[AGL] main.js loaded ✅ v10");
    console.log("[AGL] page =", document.body.dataset.page);

    const page = document.body.dataset.page;

    const onPage = (name, fn) => {
      if (page === name) {
        console.log(`[AGL] Running ${name} page scripts ✅`);
        fn();
      }
    };

    const exists = (selector) => document.querySelector(selector);

    // ----------------------------
    // Panel animation (shared helper)
    // ----------------------------
    function animatePanelLinks(panel) {
      if (!panel) return;

      const items = panel.querySelectorAll(".panel-anim-item");
      if (!items.length) return;

      // If GSAP isn't present, fail gracefully (no animation, no errors)
      if (typeof window.gsap === "undefined") return;

      gsap.killTweensOf(items);

      // Hide immediately, no animation yet
      gsap.set(items, { autoAlpha: 0, y: 12 });

      // Wait TWO frames so layout + panel animation finish
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
    // ----------------------------
    (() => {
waitFor('.nav-explore-trigger', (exploreTrigger) => {
   console.log("[AGL] explore nav mounted ✅");

  const exploreMega = document.querySelector('.explore-mega');
  const explorePrimaryWrap = document.querySelector('.explore-primary');
  const exploreSecondary = document.querySelector('.explore-secondary');

  // rest of your nav code here
});


      // If this nav doesn't exist on the page, do nothing.
      if (!exploreTrigger || !exploreMega) return;

      const primaryItems = [
        ...document.querySelectorAll(".explore-primary .btn-options"),
      ];
      const panels = [
        ...document.querySelectorAll(".explore-secondary .secondary-panel"),
      ];

      let closeTimer = null;

      const closeExplore = () => {
        exploreMega?.classList.remove("is-open");
        exploreSecondary?.classList.remove("is-open");
        panels.forEach((p) => p.classList.remove("is-active"));
        explorePrimaryWrap?.classList.remove("has-selection");
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
          explorePrimaryWrap?.classList.add("has-selection");
          primaryItems.forEach((i) => i.classList.remove("is-selected"));
          item.classList.add("is-selected");

          if (!key || key === "none") return;

          exploreSecondary?.classList.add("is-open");

          panels.forEach((panel) => {
            const active = panel.dataset.panel === key;
            panel.classList.toggle("is-active", active);

            if (active) requestAnimationFrame(() => animatePanelLinks(panel));
          });
        });

        item.addEventListener("click", (e) => {
          if (item.dataset.panel !== "none") e.preventDefault();
        });
      });
    })();

    // ----------------------------
// NAV: Prepare mega menu
// ----------------------------
(() => {
  waitFor(".nav-prepare-trigger", (trigger) => {
    const panel = document.querySelector(".prepare-mega");
    if (!panel) return;

    let closeTimer = null;

    const position = () => {
      panel.style.left = trigger.getBoundingClientRect().left + "px";
    };

    const open = () => {
      if (panel.classList.contains("is-open")) return;
      if (closeTimer) clearTimeout(closeTimer);

      document.querySelector(".explore-mega")?.classList.remove("is-open");
      position();
      panel.classList.add("is-open");

      requestAnimationFrame(() => animatePanelLinks(panel));
    };

    const scheduleClose = () => {
      closeTimer = setTimeout(() => {
        if (!trigger.matches(":hover") && !panel.matches(":hover")) {
          panel.classList.remove("is-open");
        }
      }, 220);
    };

    trigger.addEventListener("mouseenter", open);
    panel.addEventListener("mouseenter", open);
    trigger.addEventListener("mouseleave", scheduleClose);
    panel.addEventListener("mouseleave", scheduleClose);

    trigger.addEventListener("click", (e) => e.preventDefault());

    window.addEventListener("resize", () => {
      if (panel.classList.contains("is-open")) position();
    });
  });
})();



    // ----------------------------
    // Contact overlay open/close
    // ----------------------------
    (() => {
      const overlay = document.querySelector(".contact-overlay");
      if (!overlay) return;

      const open = () => {
        // Close any other menus
        document.querySelector(".explore-mega")?.classList.remove("is-open");
        document.querySelector(".prepare-mega")?.classList.remove("is-open");
        document.querySelector(".mobile-overlay")?.classList.remove("is-open");
        document.querySelector(".nav-btn-mobile")?.classList.remove("is-open");

        overlay.classList.add("is-open");
        document.documentElement.classList.add("no-scroll");
      };

      const close = () => {
        overlay.classList.remove("is-open");
        document.documentElement.classList.remove("no-scroll");
      };

      document.addEventListener("click", (e) => {
        const openBtn =
          e.target.closest('[data-open="contact"]') ||
          e.target.closest(".btn-main") || // desktop contact button class
          e.target.closest(".mobile-contact"); // mobile contact button class

        if (openBtn) {
          e.preventDefault();
          open();
          return;
        }

        const closeBtn =
          e.target.closest('[data-close="contact"]') ||
          e.target.closest(".contact-close");

        if (closeBtn) {
          e.preventDefault();
          close();
          return;
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) {
          close();
        }
      });
    })();

    // ----------------------------
    // HOME ONLY (future)
    // ----------------------------
    onPage("home", () => {
      // Put home-only animations here later.
      // console.log("[AGL] home-only animations go here");
    });
  });
})();
