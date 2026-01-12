// curtain-reveal.js
(function () {
  const items = document.querySelectorAll(".c-curtain-reveal");
  if (!items.length) return;

  // Prevent double init
  if (window.__curtainRevealInit) return;
  window.__curtainRevealInit = true;

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("is-revealed");
          io.unobserve(e.target); // reveal once
        }
      });
    },
    { threshold: 0.35 } // tweak to taste
  );

  items.forEach((el) => io.observe(el));
})();

