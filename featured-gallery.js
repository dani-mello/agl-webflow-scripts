(() => {
  const TABLET_BP = 991;
  const MOBILE_BP = 767;

  function getVisible() {
    if (window.matchMedia(`(max-width: ${MOBILE_BP}px)`).matches) return 1;
    if (window.matchMedia(`(max-width: ${TABLET_BP}px)`).matches) return 2;
    return 3;
  }

  function getGalleryRoot(wrapper) {
    return (
      wrapper.closest(".c-featured_gallery-wrap") ||
      wrapper.closest(".w-dyn-item") ||
      wrapper.closest("section") ||
      wrapper.parentElement ||
      wrapper
    );
  }

  function findControls(wrapper) {
    const root = getGalleryRoot(wrapper);

    let controls = wrapper.querySelector(".inline-gallery__controls");
    if (controls) return controls;

    controls = root.querySelector(".inline-gallery__controls");
    if (controls) return controls;

    const next = wrapper.nextElementSibling;
    if (next?.classList?.contains("inline-gallery__controls")) return next;

    return null;
  }

  function initGallery(wrapper) {
    if (wrapper.dataset.galleryInit === "1") return;
    wrapper.dataset.galleryInit = "1";

    const root = getGalleryRoot(wrapper);

    const track = wrapper.querySelector(".c-featured_gallery-track");
    const slides = track
      ? Array.from(track.querySelectorAll(".c-featured_gallery-slide"))
      : [];

    const controls = findControls(wrapper);

    const prev =
      controls?.querySelector(".ig-prev") ||
      wrapper.querySelector(".ig-prev");

    const next =
      controls?.querySelector(".ig-next") ||
      wrapper.querySelector(".ig-next");

    let progress =
      controls?.querySelector(".ig-progress") ||
      wrapper.querySelector(".ig-progress");

    if (!progress) {
      progress = document.createElement("div");
      progress.className = "ig-progress";
      if (controls) controls.appendChild(progress);
      else wrapper.appendChild(progress);
    }

    if (!track || slides.length < 2 || !progress) return;

    const N = slides.length;
    let index = 0;
    let stepPx = 0;

    progress.innerHTML = "";
    progress.style.display = "flex";
    progress.style.width = "100%";
    progress.style.alignItems = "center";
    progress.style.minHeight = "1px";

    for (let i = 0; i < N; i++) {
      const seg = document.createElement("div");
      seg.className = "ig-progress__seg";
      seg.style.flex = "1 1 0";
      seg.style.height = "1px";
      seg.style.borderRadius = "999px";
      seg.style.background = "#888";
      seg.style.opacity = "0.25";
      progress.appendChild(seg);
    }

    const segs = Array.from(progress.children);

    function computeMetrics() {
      if (slides.length < 2) {
        stepPx = 0;
        return;
      }
      const r0 = slides[0].getBoundingClientRect();
      const r1 = slides[1].getBoundingClientRect();
      const gapPx = Math.max(0, Math.round(r1.left - r0.right));
      stepPx = Math.round(r0.width + gapPx);
    }

    function maxIndex() {
      const visible = getVisible();
      return Math.max(0, N - visible);
    }

    function clampIndex(i) {
      return Math.max(0, Math.min(i, maxIndex()));
    }

    function applyTransform() {
      track.style.transform = `translate3d(${-index * stepPx}px, 0, 0)`;
    }

    function updateButtons() {
      if (prev) prev.classList.toggle("is-disabled", index === 0);
      if (next) next.classList.toggle("is-disabled", index >= maxIndex());
    }

    function updateProgress() {
      const visible = getVisible();

      segs.forEach((s) => {
        s.classList.remove("is-active", "is-current");
        s.style.opacity = "0.25";
      });

      const start = index;
      const end = Math.min(index + visible - 1, N - 1);

      for (let i = start; i <= end; i++) {
        if (segs[i]) {
          segs[i].classList.add("is-active");
          segs[i].style.opacity = "0.55";
        }
      }

      const current = Math.min(
        start + Math.floor(visible / 2),
        N - 1
      );

      if (segs[current]) {
        segs[current].classList.add("is-current");
        segs[current].style.opacity = "1";
      }
    }

    function goTo(i) {
      computeMetrics();
      index = clampIndex(i);
      applyTransform();
      updateProgress();
      updateButtons();
    }

    let isDown = false;
    let startX = 0;
    let startTranslate = 0;
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
      return -maxIndex() * stepPx;
    }

    function maxTranslate() {
      return 0;
    }

    function withResistance(x) {
      const minX = minTranslate();
      const maxX = maxTranslate();
      if (x > maxX) return maxX + (x - maxX) * 0.25;
      if (x < minX) return minX + (x - minX) * 0.25;
      return x;
    }

    function scheduleMove(x) {
      pendingX = x;
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (pendingX == null) return;
        setTranslateX(withResistance(pendingX));
      });
    }

    const mask =
      wrapper.querySelector(".c-featured_gallery-mask") || wrapper;
    mask.style.touchAction = "pan-y";

    function onDown(e) {
      if (e.button !== undefined && e.button !== 0) return;
      isDown = true;
      moved = false;

      computeMetrics();
      track.style.transition = "none";
      startX = e.clientX;
      startTranslate = getTranslateX(track);

      mask.setPointerCapture?.(e.pointerId);
      e.preventDefault();
    }

    function onMove(e) {
      if (!isDown) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      scheduleMove(startTranslate + dx);
      e.preventDefault();
    }

    function onUp(e) {
      if (!isDown) return;
      isDown = false;

      track.style.transition = "transform 300ms ease";
      const dx = e.clientX - startX;
      const threshold = Math.min(stepPx * 0.22, 120);

      if (dx < -threshold) goTo(index + 1);
      else if (dx > threshold) goTo(index - 1);
      else goTo(index);

      e.preventDefault();
      setTimeout(() => {
        moved = false;
      }, 0);
    }

    mask.addEventListener("pointerdown", onDown, { passive: false });
    mask.addEventListener("pointermove", onMove, { passive: false });
    mask.addEventListener("pointerup", onUp, { passive: false });
    mask.addEventListener("pointercancel", onUp, { passive: false });
    mask.addEventListener("pointerleave", onUp, { passive: false });

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

    if (next) {
      next.addEventListener("click", (e) => {
        e.preventDefault();
        if (next.classList.contains("is-disabled")) return;
        track.style.transition = "transform 300ms ease";
        goTo(index + 1);
      });
    }

    if (prev) {
      prev.addEventListener("click", (e) => {
        e.preventDefault();
        if (prev.classList.contains("is-disabled")) return;
        track.style.transition = "transform 300ms ease";
        goTo(index - 1);
      });
    }

    wrapper.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener(
        "load",
        () => {
          computeMetrics();
          goTo(index);
        },
        { once: true }
      );
    });

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
    document
      .querySelectorAll(
        ".c-featured_gallery, .c-featured_gallery-mobile, .c-about_partners"
      )
      .forEach(initGallery);
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
