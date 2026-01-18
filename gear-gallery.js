/* gear-gallery.js
   - Component safe (class-based, no IDs)
   - Supports multiple gear galleries on a page
   - Builds & updates progress segments
   - Drag/swipe via Pointer Events
   - Visible counts: Desktop 4, Tablet 3, Mobile 1
*/

(() => {
  const TABLET_BP = 991;
  const MOBILE_BP = 767;

  function getVisible() {
    if (window.matchMedia(`(max-width:${MOBILE_BP}px)`).matches) return 1;
    if (window.matchMedia(`(max-width:${TABLET_BP}px)`).matches) return 3;
    return 4;
  }

  function initGallery(root) {
    if (root.dataset.ggInit === "1") return;
    root.dataset.ggInit = "1";

    const mask = root.querySelector(".c-gear_gallery-mask") || root;
    const track = root.querySelector(".c-gear_gallery-track");
    const slides = track ? Array.from(track.querySelectorAll(".c-gear_gallery-slide")) : [];

    const prev = root.querySelector(".ig-prev");
    const next = root.querySelector(".ig-next");
    const progress = root.querySelector(".ig-progress");

    if (!track || slides.length < 2 || !progress) return;

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
      if (slides.length < 2) return;
      const r0 = slides[0].getBoundingClientRect();
      const r1 = slides[1].getBoundingClientRect();
      const gapPx = Math.max(0, Math.round(r1.left - r0.right));
      stepPx = Math.round(r0.width + gapPx);
    }

    function maxIndex() {
      const visible = getVisible();
      return Math.max(0, Math.ceil(N - visible));
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

    function goTo(i) {
      index = clampIndex(i);
      applyTransform();
      updateProgress();
      if (prev) prev.classList.toggle("is-disabled", index === 0);
      if (next) next.classList.toggle("is-disabled", index >= maxIndex());
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

    // Allow vertical scroll inside description, but capture horizontal drags
    mask.style.touchAction = "pan-y";

    function onDown(e) {
      // ignore right click / non-primary mouse
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

    // prevent click-through if dragged
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

    // Resize recalcs widths + max index for breakpoint visible changes
    let t;
    window.addEventListener("resize", () => {
      clearTimeout(t);
      t = setTimeout(() => {
        computeMetrics();
        goTo(index);
      }, 60);
    });

    computeMetrics();
    goTo(0);
  }

  function initAll() {
    document.querySelectorAll(".c-gear_gallery").forEach(initGallery);
  }

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
