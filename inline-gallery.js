/* inline-gallery.js
   - Webflow/component safe (class-based, no IDs)
   - Supports multiple galleries on a page
   - Builds & updates progress segments
*/

(() => {
  const VISIBLE = 1.5; // peek amount (we can make this responsive later)

  function initGallery(root) {
    // Prevent double init (Webflow can trigger multiple ready events)
    if (root.dataset.igInit === "1") return;
    root.dataset.igInit = "1";

    const track = root.querySelector(".inline-gallery__track");
    const slides = track ? Array.from(track.querySelectorAll(".ig-slide")) : [];
    const prev = root.querySelector(".ig-prev");
    const next = root.querySelector(".ig-next");
    const progress = root.querySelector(".ig-progress");

    if (!track || slides.length < 2 || !prev || !next || !progress) return;

    const N = slides.length;
    let index = 0;
    let stepPx = 0;

    // Build progress segments
    progress.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const seg = document.createElement("div");
      seg.className = "ig-progress__seg";
      progress.appendChild(seg);
    }
    const segs = Array.from(progress.children);

    function computeMetrics() {
      const r0 = slides[0].getBoundingClientRect();
      const r1 = slides[1].getBoundingClientRect();
      const gapPx = Math.max(0, Math.round(r1.left - r0.right));
      stepPx = Math.round(r0.width + gapPx);
    }

    function maxIndex() {
      return Math.max(0, Math.ceil(N - VISIBLE));
    }

    function clampIndex(i) {
      return Math.max(0, Math.min(i, maxIndex()));
    }

    function applyTransform() {
      track.style.transform = `translate3d(${-index * stepPx}px, 0, 0)`;
    }

    function updateButtons() {
      prev.classList.toggle("is-disabled", index === 0);
      next.classList.toggle("is-disabled", index >= maxIndex());
      prev.setAttribute("aria-disabled", index === 0 ? "true" : "false");
      next.setAttribute("aria-disabled", index >= maxIndex() ? "true" : "false");
    }

    function updateProgress() {
      segs.forEach((s) => s.classList.remove("is-active"));
      const active = Math.min(index, N - 1);
      if (segs[active]) segs[active].classList.add("is-active");
    }

    function goTo(i) {
      index = clampIndex(i);
      applyTransform();
      updateButtons();
      updateProgress();
    }

    function nextOne() { goTo(index + 1); }
    function prevOne() { goTo(index - 1); }

    next.addEventListener("click", (e) => {
      e.preventDefault();
      if (next.classList.contains("is-disabled")) return;
      nextOne();
    });

    prev.addEventListener("click", (e) => {
      e.preventDefault();
      if (prev.classList.contains("is-disabled")) return;
      prevOne();
    });

    // Resize handler (scoped) + debounced a bit
    let resizeT;
    const onResize = () => {
      clearTimeout(resizeT);
      resizeT = setTimeout(() => {
        computeMetrics();
        goTo(index);
      }, 50);
    };
    window.addEventListener("resize", onResize);

    // Initial
    computeMetrics();
    goTo(0);
  }

  function initAll() {
    document.querySelectorAll(".inline-gallery").forEach(initGallery);
  }

  // Robust init (Webflow + normal sites)
  function runOnceWhenReady(fn) {
    let ran = false;
    const run = () => {
      if (ran) return;
      ran = true;
      fn();
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", run, { once: true });
    } else {
      run();
    }

    window.addEventListener("load", run, { once: true });

    if (window.Webflow && typeof window.Webflow.push === "function") {
      window.Webflow.push(run);
    }

    setTimeout(run, 0);
    setTimeout(run, 300);
  }

  runOnceWhenReady(initAll);
})();
