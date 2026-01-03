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
