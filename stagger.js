console.log("STAGGER v10");

(() => {
  if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);

  if (window.__staggerInitV10) return;
  window.__staggerInitV10 = true;

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function hasHero() {
    return !!document.querySelector(".c-hero");
  }

  function layoutReady() {
    const hpinReady = !!window.__HPIN_READY__;
    const heroReady = !hasHero() || !!window.__HERO_READY__;
    return hpinReady && heroReady;
  }

  function waitForLayout(cb) {
    if (layoutReady()) {
      cb();
      return;
    }
    requestAnimationFrame(() => waitForLayout(cb));
  }

  function delayedRefresh(delay = 0) {
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          ScrollTrigger.sort();
          ScrollTrigger.refresh();
        });
      });
    }, delay);
  }

  function waitForImagesIn(container) {
    const images = Array.from(container.querySelectorAll("img"));
    if (!images.length) return Promise.resolve();

    const pending = images.filter((img) => !img.complete);

    if (!pending.length) return Promise.resolve();

    return new Promise((resolve) => {
      let remaining = pending.length;

      function done() {
        remaining--;
        if (remaining <= 0) resolve();
      }

      pending.forEach((img) => {
        img.addEventListener("load", done, { once: true });
        img.addEventListener("error", done, { once: true });
      });
    });
  }

  function initStagger(parent) {
    const items = Array.from(parent.querySelectorAll(".js-stagger-item"));
    if (!items.length) return;

    const start = parent.getAttribute("data-stagger-start") || "top 88%";
    const each = parseFloat(parent.getAttribute("data-stagger-amount") || "0.1");
    const dist = parseFloat(parent.getAttribute("data-stagger-distance") || "30");
    const scaleFrom = parseFloat(parent.getAttribute("data-stagger-scale") || "0.7");
    const duration = parseFloat(parent.getAttribute("data-stagger-duration") || "1");
    const ease = parent.getAttribute("data-stagger-ease") || "power3.out";

    if (prefersReduced) {
      gsap.set(items, { opacity: 1, clearProps: "all" });
      return;
    }

    const queue = [];
    let ticking = false;

    function flushQueue() {
      if (!queue.length) {
        ticking = false;
        return;
      }

      const batch = queue.splice(0, queue.length);

      batch.sort((a, b) => items.indexOf(a) - items.indexOf(b));

      gsap.to(batch, {
        opacity: 1,
        x: 0,
        y: 0,
        scale: 1,
        duration,
        ease,
        stagger: { each },
        overwrite: true,
        clearProps: "transform"
      });

      ticking = false;
    }

    function queueItem(el) {
      if (el.dataset.staggerShown === "1") return;
      el.dataset.staggerShown = "1";
      queue.push(el);

      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        flushQueue();
      });
    }

    items.forEach((el, i) => {
      const signX = i % 2 === 0 ? -1 : 1;
      const signY = i % 3 === 0 ? -1 : 1;

      gsap.set(el, {
        opacity: 0,
        scale: scaleFrom,
        x: signX * dist,
        y: signY * dist
      });

      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        invalidateOnRefresh: true,
        onEnter: () => {
          queueItem(el);
        }
        // markers: true
      });
    });
  }

  async function initAll() {
    const parents = Array.from(document.querySelectorAll(".js-stagger"));

    for (const parent of parents) {
      if (parent.dataset.staggerInit === "1") continue;

      await waitForImagesIn(parent);

      parent.dataset.staggerInit = "1";
      initStagger(parent);
    }

    ScrollTrigger.sort();
    ScrollTrigger.refresh();

    delayedRefresh(250);
  }

  function boot() {
    initAll();
  }

  waitForLayout(() => {
    if (document.readyState === "complete") {
      boot();
    } else {
      window.addEventListener(
        "load",
        () => {
          boot();
        },
        { once: true }
      );
    }
  });

  window.addEventListener(
    "load",
    () => {
      waitForLayout(() => {
        delayedRefresh(350);
      });
    },
    { once: true }
  );
})();
