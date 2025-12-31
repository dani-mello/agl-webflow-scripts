/* AGL Webflow Scripts - main.js
   Tip: Never put secret keys in here.
*/

(() => {
  // Avoid running before the DOM exists
  const ready = (fn) => {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  ready(() => {
     console.log("[AGL] page =", document.body.dataset.page);
    console.log("[AGL] main.js loaded ✅");

    // ---- PASTE YOUR EXISTING JS BELOW THIS LINE ----

     const page = document.body.dataset.page;

const onPage = (name, fn) => {
  if (page === name) {
    console.log(`[AGL] Running ${name} page scripts`);
    fn();
  }
};

const exists = (selector) => document.querySelector(selector);


onPage("home", () => {
  console.log("[AGL] inside home callback ✅");
  // (keep home-only animations in here later)
});

   

  // panel animation      
function animatePanelLinks(panel) {
  if (!panel) return;

  const items = panel.querySelectorAll('.panel-anim-item');
  if (!items.length) return;

  gsap.killTweensOf(items);

  // Hide immediately, no animation yet
  gsap.set(items, {
    autoAlpha: 0,
    y: 12
  });

  // Wait TWO frames so layout + panel animation finish
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.45,
        ease: "power3.out",
        stagger: 0.08,
        clearProps: "opacity,visibility,transform"
      });
    });
  });
} 



   
// nav explore open and close
     
document.addEventListener("DOMContentLoaded", () => {

  const exploreTrigger = document.querySelector('.nav-explore-trigger');
  const exploreMega = document.querySelector('.explore-mega');
  const explorePrimaryWrap = document.querySelector('.explore-primary');
  const exploreSecondary = document.querySelector('.explore-secondary');

  const primaryItems = [...document.querySelectorAll('.explore-primary .btn-options')];
  const panels = [...document.querySelectorAll('.explore-secondary .secondary-panel')];

  let closeTimer = null;

  const closeExplore = () => {
    exploreMega?.classList.remove('is-open');
    exploreSecondary?.classList.remove('is-open');
    panels.forEach(p => p.classList.remove('is-active'));
    explorePrimaryWrap?.classList.remove('has-selection');
    primaryItems.forEach(i => i.classList.remove('is-selected'));
  };

  const openExplore = () => {
    if (exploreMega.classList.contains('is-open')) return;
    if (closeTimer) clearTimeout(closeTimer);
    document.querySelector('.prepare-mega')?.classList.remove('is-open');
    exploreMega?.classList.add('is-open');

    // Animate PRIMARY once on open
    requestAnimationFrame(() => {
      animatePanelLinks(explorePrimaryWrap);
    });
  };

  const scheduleClose = () => {
    closeTimer = setTimeout(() => {
      if (
        !exploreTrigger.matches(':hover') &&
        !exploreMega.matches(':hover')
      ) {
        closeExplore();
      }
    }, 220);
  };

  exploreTrigger?.addEventListener('mouseenter', openExplore);
  exploreMega?.addEventListener('mouseenter', openExplore);
  exploreTrigger?.addEventListener('mouseleave', scheduleClose);
  exploreMega?.addEventListener('mouseleave', scheduleClose);

  exploreTrigger?.addEventListener('click', e => e.preventDefault());

  primaryItems.forEach(item => {
    item.addEventListener('mouseenter', () => {
      if (closeTimer) clearTimeout(closeTimer);

      const key = item.dataset.panel;
      explorePrimaryWrap?.classList.add('has-selection');
      primaryItems.forEach(i => i.classList.remove('is-selected'));
      item.classList.add('is-selected');

      if (!key || key === "none") return;

      exploreSecondary?.classList.add('is-open');

      panels.forEach(panel => {
        const active = panel.dataset.panel === key;
        panel.classList.toggle('is-active', active);

        if (active) {
          requestAnimationFrame(() => animatePanelLinks(panel));
        }
      });
    });

    item.addEventListener('click', e => {
      if (item.dataset.panel !== "none") e.preventDefault();
    });
  });

});

// nav prepare open and close

document.addEventListener("DOMContentLoaded", () => {

  const trigger = document.querySelector('.nav-prepare-trigger');
  const panel = document.querySelector('.prepare-mega');
  let closeTimer = null;

  const position = () => {
    if (!trigger || !panel) return;
    panel.style.left = trigger.getBoundingClientRect().left + "px";
  };

  const open = () => {
    if (panel.classList.contains('is-open')) return;
    if (closeTimer) clearTimeout(closeTimer);
    document.querySelector('.explore-mega')?.classList.remove('is-open');
    position();
    panel.classList.add('is-open');

    requestAnimationFrame(() => animatePanelLinks(panel));
  };

  const scheduleClose = () => {
    closeTimer = setTimeout(() => {
      if (!trigger.matches(':hover') && !panel.matches(':hover')) {
        panel.classList.remove('is-open');
      }
    }, 220);
  };

  trigger?.addEventListener('mouseenter', open);
  panel?.addEventListener('mouseenter', open);
  trigger?.addEventListener('mouseleave', scheduleClose);
  panel?.addEventListener('mouseleave', scheduleClose);

  trigger?.addEventListener('click', e => e.preventDefault());
  window.addEventListener('resize', () => panel.classList.contains('is-open') && position());

});




// nav mobile open and close
        
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



   
// contact open and close

document.addEventListener("DOMContentLoaded", () => {
  const overlay = document.querySelector(".contact-overlay");
  if (!overlay) return;

  const open = () => {
    console.log("CONTACT OPEN");

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
    // DEBUG: uncomment for 5 seconds if needed
    // console.log("clicked:", e.target);

    // OPEN: either data attribute OR your desktop button class
    const openBtn =
      e.target.closest('[data-open="contact"]') ||
      e.target.closest('.btn-main') ||             // desktop contact button class
      e.target.closest('.mobile-contact');         // mobile contact button class (if needed)

    if (openBtn) {
      e.preventDefault();
      open();
      return;
    }

    // CLOSE: either data attribute OR your close button class
    const closeBtn =
      e.target.closest('[data-close="contact"]') ||
      e.target.closest('.contact-close');

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
});




   
   
});










    // ---- PASTE YOUR EXISTING JS ABOVE THIS LINE ----
  });
})();
