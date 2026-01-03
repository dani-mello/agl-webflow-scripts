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

    console.log("[IG] initGallery", {
      hasTrack: !!track,
      slides: slides.length,
      hasProgress: !!progress,
      hasPrev: !!prev,
      hasNext: !!next
    });

    // ✅ For debugging: only require track + slides + progress
    if (!track || slides.length < 2 || !progress) {
      console.warn("[IG] Skipping gallery (missing required elements)");
      return;
    }

    const N = slides.length;
    let index = 0;
    let stepPx = 0;

    // Build progress segments
for (let i = 0; i < N; i++) {
  const seg = document.createElement("div");
  seg.className = "ig-progress__seg";

  // DEBUG: force visible no matter what CSS is doing
  seg.style.background = "#ff00ff";
  seg.style.opacity = "0.25";
  seg.style.height = "2px";
  seg.style.borderRadius = "999px";

  progress.appendChild(seg);
}

    const segs = Array.from(progress.children);
    console.log("[IG] segments built:", segs.length);

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
    }

    // Wire buttons only if they exist
    if (next) {
      next.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(index + 1);
      });
    }
    if (prev) {
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        goTo(index - 1);
      });
    }

    window.addEventListener("resize", () => {
      computeMetrics();
      goTo(index);
    });

    computeMetrics();
    goTo(0);
  }

  function initAll() {
    const galleries = document.querySelectorAll(".inline-gallery");
    console.log("[IG] initAll galleries found:", galleries.length);
    galleries.forEach(initGallery);
  }

  // Robust init (works in Webflow preview + published)
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
