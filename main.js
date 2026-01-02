console.log("[AGL] main.js ✅", "v12", new Date().toISOString());

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
    const animatePanelLinks = (panel) => {
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
    };

    // ----------------------------
    // NAV: Explore mega menu
    // Requires: data-nav="explore" on trigger
    // ----------------------------
    waitFor('[data-nav="explore"]', (exploreTrigger) => {

      const exploreMega = document.querySelector(".explore-mega");
      const explorePrimaryWrap = document.querySelector(".explore-primary");
      const exploreSecondary = document.querySelector(".explore-secondary");

      if (!exploreMega || !explorePrimaryWrap) {
        console.warn("[AGL] Explore mega missing (.explore-mega/.explore-primary).");
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
          explorePrimaryWrap.classList.add("has-selection");
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
    });

    // ----------------------------
    // NAV: Prepare mega menu
    // Requires: data-nav="prepare" on trigger
    // ----------------------------
    waitFor('[data-nav="prepare"]', (trigger) => {

      const panel = document.querySelector(".prepare-mega");
      if (!panel) {
        console.warn("[AGL] Prepare mega panel missing (.prepare-mega).");
        return;
      }

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

     // ----------------------------
    // mobile: mobile menu
    // ----------------------------

     document.addEventListener("DOMContentLoaded", () => {

  const burger = document.querySelector('.nav-btn-mobile');
  const overlay = document.querySelector('.mobile-overlay');
  const panels = [...document.querySelectorAll('.mobile-panel')];

  let current = 'main';

  const getPanel = key => panels.find(p => p.dataset.target === key);

  const resetPanels = () => {
    panels.forEach(p => p.classList.remove('is-active', 'is-prev'));
  };

  const openOverlay = () => {
    overlay.classList.add('is-open');
    burger.classList.add('is-open');
    document.documentElement.classList.add('no-scroll');

    resetPanels();
    const main = getPanel('main');
    main?.classList.add('is-active');
    requestAnimationFrame(() => animatePanelLinks(main));
    current = 'main';
  };

  const closeOverlay = () => {
    overlay.classList.remove('is-open');
    burger.classList.remove('is-open');
    document.documentElement.classList.remove('no-scroll');
    resetPanels();
    current = 'main';
  };

  const goTo = (target) => {
    const next = getPanel(target);
    const curr = getPanel(current);
    if (!next || next === curr) return;

    curr?.classList.remove('is-active');
    curr?.classList.add('is-prev');

    next.classList.add('is-active');
    next.classList.remove('is-prev');

    requestAnimationFrame(() => animatePanelLinks(next));
    current = target;
  };

  burger?.addEventListener('click', e => {
    e.preventDefault();
    overlay.classList.contains('is-open') ? closeOverlay() : openOverlay();
  });

  overlay?.addEventListener('click', e => {

    const contact = e.target.closest('.mobile-contact');
    if (contact) {
      e.preventDefault();
      closeOverlay();
      document.querySelector('.contact-overlay')?.classList.add('is-open');
      document.documentElement.classList.add('no-scroll');
      return;
    }

    const back = e.target.closest('.btn-options-mobile-return');
    if (back) {
      e.preventDefault();
      goTo(back.dataset.back);
      return;
    }

    const go = e.target.closest('[data-go]');
    if (go) {
      e.preventDefault();
      goTo(go.dataset.go);
    }

  });

});

    // ----------------------------
    // Contact overlay open/close
    // ----------------------------
    (() => {
      const overlay = document.querySelector(".contact-overlay");
      if (!overlay) return;

      const open = () => {
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
          e.target.closest(".btn-main") ||
          e.target.closest(".mobile-contact");

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
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && overlay.classList.contains("is-open")) {
          close();
        }
      });
    })();

    // HOME ONLY (future)
    onPage("home", () => {});
  });
})();


window.Webflow ||= [];
window.Webflow.push(function () {

  // Use event delegation so it still works if Webflow re-renders elements
  function toggleFromEvent(e) {
    const btn = e.target.closest(".nav-btn-mobile");
    if (!btn) return;

    // Stop anything else from hijacking the click
    e.preventDefault();
    e.stopPropagation();

    const nav = btn.closest(".c-nav, .w-nav, nav, header") || document.body;

    const isOpen = !btn.classList.contains("is-open");
    btn.classList.toggle("is-open", isOpen);
    nav.classList.toggle("is-open", isOpen);

    // accessibility (optional)
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  // Capture phase helps if another handler is interfering
  document.addEventListener("click", toggleFromEvent, true);

  // iOS sometimes prefers touchstart
  document.addEventListener("touchstart", function (e) {
    toggleFromEvent(e);
  }, { capture: true, passive: false });

});



