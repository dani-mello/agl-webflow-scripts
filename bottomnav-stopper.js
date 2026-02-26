
(() => {
  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn, { once: true });
    } else fn();
  }

  function onWebflowReady(fn) {
    window.Webflow ||= [];
    window.Webflow.push(fn);
  }

  function initTripBottomNavStop() {
    const mover = document.querySelector(".js-trip-bottomnav-move");
    const stopEl = document.querySelector(".js-trip-bottomnav-stop");

    if (!mover || !stopEl || !window.gsap || !window.ScrollTrigger) return;

    // safe to call even if already registered
    try { gsap.registerPlugin(ScrollTrigger); } catch (e) {}

    gsap.set(mover, { willChange: "transform" });

    ScrollTrigger.create({
      trigger: stopEl,
      start: "top bottom",
      end: "bottom top",
      invalidateOnRefresh: true,
      onUpdate(self) {
        const past = self.scroll() - self.start;
        gsap.set(mover, { y: past > 0 ? -past : 0 });
      },
      onLeaveBack() {
        gsap.set(mover, { y: 0 });
      }
    });

    // One more refresh after layout/images settle (Webflow loves a late reflow)
    requestAnimationFrame(() => ScrollTrigger.refresh());
    setTimeout(() => ScrollTrigger.refresh(), 250);
  }

  onReady(() => onWebflowReady(initTripBottomNavStop));
})();
