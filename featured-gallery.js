/* featured-gallery.js
   - Webflow/component safe (class-based, no IDs)
   - Supports multiple featured galleries on a page
   - Shows 3 slides desktop, 1 slide mobile (via responsive VISIBLE)
   - Builds & updates progress segments
   - Adds drag/swipe via Pointer Events
*/

(() => {
  const MOBILE_BP = 767; // match your Webflow breakpoint

  function getVisible() {
    return window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches ? 1 : 3;
  }

  function initGallery(root) {
    // Prevent double init
    if (root.dataset.featuredInit === "1") return;
    root.dataset.featuredInit = "1";

    const track = root.querySelector(".c-featured_gallery-track");
    const slides = track
      ? Array.from(track.querySelectorAll(".c-featured_gallery-slide"))
      : [];

    const prev = root.querySelector(".ig-prev");
    const next = root.querySelector(".ig-next");
    const progress = root.querySelector(".ig-progress");

    // Require only what we need for progress + sliding
    if (!track || slides.length < 2 || !progress) return;

    const N = slides.length;
    let index = 0;
    let stepPx = 0;

    // Build progress segments (clear first)
    progress.innerHTML = "";
    for (let i = 0; i < N; i++) {
      const seg = document.createElement("div");
      seg.className = "ig-progress__seg";
      progress.appendChild(seg);
    }
    const segs = Array.from(progress.children);

    function computeMetrics() {
      if (slides.length < 2) { stepPx = 0; return; }
      const r0 = slides[0].getBoundingClientRect();
      const r1 = slides[1].getBoundingClientRect();
      const gapPx = Math.max(0, Math.round(r1.left - r0.right));
      stepPx = Math.round(r0.width + gapPx);
    }

    function maxIndex() {
      const VISIBLE = getVisible();
      return Math.max(0, Math.ceil(N - VISIBLE));
    }

    function clampIndex(i) {
      return Math.max(0, Math.min(i, maxIndex()));
    }

    function applyTransform() {
      track.style.transform = `translate3d(${-index * stepPx}px, 0, 0)`;
    }

    function updateProgress() {
      segs.forEach((s) => s.classList.remove("is-active"));
      const active = Math.min(index, N - 1);
      segs[active]?.classList.add("is-active");
    }

    function updateButtons() {
      if (prev) prev.classList.toggle("is-disabled", index === 0);
      if (next) next.classList.toggle("is-disabled", index >= maxIndex());
    }

    function goTo(i) {
      index = clampIndex(i);
      applyTransform();
      updateProgress();
      updateButtons();
    }

    // --- Drag / swipe (pointer events) ---
    let isDown = false;
    let startX = 0;
    let startTranslate = 0;
    let moved = false;

    function getTranslateX(el) {
      const t = getComputedStyle(el).transform;
      if (!t || t === "none") return 0;
      const m = new DOMMatrixReadOnly(t);
      return m.m41;
    }

    function setTranslateX(x) {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    // Attach drag to the mask (better UX)
    const mask = root.querySelector(".c-featured_gallery-mask") || root;
    mask.style.touchAction = "pan-y";

    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;

      isDown = true;
      moved = false;

      track.style.transition = "none";
      startX = e.clientX;
      startTranslate = getTranslateX(track);

      mask.setPointerCapture?.(e.pointerId);
    }

    function onMove(e) {
      if (!isDown) return;

      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;

      setTranslateX(startTranslate + dx);
    }

    function onUp(e) {
      if (!isDown) return;
      isDown = false;

      track.style.transition = "transform 300ms ease";

      const dx = e.clientX - startX;
      const threshold = stepPx * 0.18;

      if (dx < -threshold) goTo(index + 1);
      else if (dx > threshold) goTo(index - 1);
      else goTo(index);
    }

    mask.addEventListener("pointerdown", onDown);
    mask.addEventListener("pointermove", onMove);
    mask.addEventListener("pointerup", onUp);
    mask.addEventListener("pointercancel", onUp);
    mask.addEventListener("pointerleave", onUp);

    // Prevent click-through if user dragged
    mask.addEventListener(
      "click",
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    // Buttons (optional)
    if (next) {
      next.addEventListener("click", (e) => {
        e.preventDefault();
        if (next.classList.contains("is-disabled")) return;
        goTo(index + 1);
      });
    }
    if (prev) {
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        if (prev.classList.contains("is-disabled")) return;
        goTo(index - 1);
      });
    }

    // Resize
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        computeMetrics();
        goTo(index); // re-clamp + re-apply for new visible count
      }, 60);
    });

    computeMetrics();
    goTo(0);
  }

  function initAll() {
    document.querySelectorAll(".c-featured").forEach(initGallery);
  }

  // Webflow + normal sites
  const run = () => initAll();
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
  window.addEventListener("load", run, { once: true });
  setTimeout(run, 0);
  setTimeout(run, 300);
  if (window.Webflow && typeof window.Webflow.push === "function") {
    window.Webflow.push(run);
  }
})();
