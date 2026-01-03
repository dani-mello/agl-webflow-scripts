/* inline-gallery.js
   - Webflow/component safe (class-based, no IDs)
   - Supports multiple galleries on a page
   - Builds & updates progress segments
*/

(() => {
  const VISIBLE = 1.5; // 1.5 shows a peek of the next slide

  function initGallery(root) {
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

    window.addEventListener("resize", () => {
      computeMetrics();
      goTo(index);
    });

    computeMetrics();
    goTo(0);
  }

  function initAll() {
  const galleries = document.querySelectorAll(".inline-gallery");
  console.log("galleries found:", galleries.length);
  galleries.forEach(initGallery);
}

/* ---- Robust init (Webflow + normal sites) ---- */
function runOnceWhenReady(fn) {
  let ran = false;
  const run = () => {
    if (ran) return;
    ran = true;
    fn();
  };

  // DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }

  // Window load fallback (Webflow can inject/alter DOM after DOMContentLoaded)
  window.addEventListener("load", run, { once: true });

  // Webflow hook (if available)
  if (window.Webflow && typeof window.Webflow.push === "function") {
    window.Webflow.push(run);
  }

  // Last-resort fallback (covers weird embed/script order)
  setTimeout(run, 0);
  setTimeout(run, 300);
}

runOnceWhenReady(initAll);

