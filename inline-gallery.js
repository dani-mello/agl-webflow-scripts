/* inline-gallery.js
   - Webflow/component safe (class-based, no IDs)
   - Supports multiple galleries on a page
   - Builds & updates progress segments
   - Adds drag/swipe via Pointer Events
*/

(() => {
  const VISIBLE = 1.5;

  function initGallery(root) {
    if (root.dataset.igInit === "1") return;
    root.dataset.igInit = "1";

    const track = root.querySelector(".inline-gallery__track");
    const slides = track ? Array.from(track.querySelectorAll(".ig-slide")) : [];
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

    // --- Drag / swipe (pointer events) — smoother + resistance ---
let isDown = false;
let startX = 0;
let startTranslate = 0;
let currentTranslate = 0;
let moved = false;

let rafId = null;
let pendingX = null;

function getTranslateX(el) {
  const t = getComputedStyle(el).transform;
  if (!t || t === "none") return 0;
  const m = new DOMMatrixReadOnly(t);
  return m.m41;
}

function setTranslateX(x) {
  track.style.transform = `translate3d(${x}px, 0, 0)`;
}

function minTranslate() {
  // leftmost = last index
  return -maxIndex() * stepPx;
}
function maxTranslate() {
  // rightmost = first index
  return 0;
}

function applyWithResistance(x) {
  const minX = minTranslate();
  const maxX = maxTranslate();

  if (x > maxX) {
    const over = x - maxX;
    return maxX + over * 0.25; // resistance
  }
  if (x < minX) {
    const over = x - minX;
    return minX + over * 0.25; // resistance
  }
  return x;
}

// Attach drag to the mask
const mask = root.querySelector(".inline-gallery__mask") || root;
mask.style.touchAction = "pan-y";

function scheduleMove(x) {
  pendingX = x;
  if (rafId) return;
  rafId = requestAnimationFrame(() => {
    rafId = null;
    if (pendingX == null) return;
    setTranslateX(applyWithResistance(pendingX));
  });
}

function onDown(e) {
  if (e.button !== undefined && e.button !== 0) return;

  isDown = true;
  moved = false;

  track.style.transition = "none";

  startX = e.clientX;
  startTranslate = getTranslateX(track);
  currentTranslate = startTranslate;

  mask.setPointerCapture?.(e.pointerId);

  // prevent browser from “grabbing” images/links
  e.preventDefault();
}

function onMove(e) {
  if (!isDown) return;

  const dx = e.clientX - startX;
  if (Math.abs(dx) > 3) moved = true;

  currentTranslate = startTranslate + dx;
  scheduleMove(currentTranslate);

  e.preventDefault();
}

function onUp(e) {
  if (!isDown) return;
  isDown = false;

  // snap back with transition
  track.style.transition = "transform 300ms ease";

  const dx = e.clientX - startX;
  const threshold = stepPx * 0.18;

  if (dx < -threshold) goTo(index + 1);
  else if (dx > threshold) goTo(index - 1);
  else goTo(index);

  e.preventDefault();
}

mask.addEventListener("pointerdown", onDown, { passive: false });
mask.addEventListener("pointermove", onMove, { passive: false });
mask.addEventListener("pointerup", onUp, { passive: false });
mask.addEventListener("pointercancel", onUp, { passive: false });

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


      // capture on the same element that received pointerdown
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
      const threshold = stepPx * 0.18; // ~18% of slide step

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
        goTo(index);
      }, 60);
    });

    computeMetrics();
    goTo(0);
  }

  function initAll() {
    document.querySelectorAll(".inline-gallery").forEach(initGallery);
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
