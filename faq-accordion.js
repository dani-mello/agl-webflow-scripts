/*!
 * FAQ Accordion (Webflow / CMS friendly)
 * - Opens/closes answers with height animation
 * - Animates plus -> minus by toggling a class
 * - No dependencies
 */

export function initFaqAccordion(userConfig = {}) {
  const cfg = {
    // Selectors
    item: ".c-faq-item",
    question: ".c-faq-item_question",
    answer: ".c-faq-item_answer",

    // State class added to item when open
    openClass: "_is-open",

    // Behavior
    closeOthers: false,
    durationMs: 280,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",

    // If true, will force all answers closed on init (recommended for Webflow weirdness)
    forceClosedOnInit: true,

    ...userConfig
  };

  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Prevent double-binding if you call init more than once
  if (window.__faqAccordionBound) return;
  window.__faqAccordionBound = true;

  function animateHeight(el, from, to) {
    if (prefersReduced) {
      el.style.height = `${to}px`;
      return Promise.resolve();
    }

    const anim = el.animate(
      [{ height: `${from}px` }, { height: `${to}px` }],
      { duration: cfg.durationMs, easing: cfg.easing, fill: "both" }
    );

    return anim.finished.catch(() => {});
  }

  function openItem(item) {
    const answer = item.querySelector(cfg.answer);
    if (!answer) return;

    item.classList.add(cfg.openClass);

    const startHeight = answer.getBoundingClientRect().height;

    // Measure full height
    answer.style.height = "auto";
    const targetHeight = answer.scrollHeight;

    // Animate from current -> target
    answer.style.height = `${startHeight}px`;
    answer.style.overflow = "hidden";

    animateHeight(answer, startHeight, targetHeight).then(() => {
      // Keep flexible for responsive text wrapping
      answer.style.height = "auto";
    });
  }

  function closeItem(item) {
    const answer = item.querySelector(cfg.answer);
    if (!answer) return;

    // If currently auto, use scrollHeight
    const startHeight =
      answer.style.height === "auto"
        ? answer.scrollHeight
        : answer.getBoundingClientRect().height;

    answer.style.height = `${startHeight}px`;
    answer.style.overflow = "hidden";

    item.classList.remove(cfg.openClass);

    animateHeight(answer, startHeight, 0).then(() => {
      answer.style.height = "0px";
    });
  }

  function toggleItem(item) {
    const isOpen = item.classList.contains(cfg.openClass);

    if (cfg.closeOthers && !isOpen) {
      document.querySelectorAll(cfg.item).forEach((other) => {
        if (other !== item) closeItem(other);
      });
    }

    isOpen ? closeItem(item) : openItem(item);
  }

  function forceClosed() {
    document.querySelectorAll(cfg.item).forEach((item) => {
      const answer = item.querySelector(cfg.answer);
      if (!answer) return;

      item.classList.remove(cfg.openClass);
      answer.style.height = "0px";
      answer.style.overflow = "hidden";
    });
  }

  // Event delegation (best for CMS lists)
  document.addEventListener("click", (e) => {
    const q = e.target.closest(cfg.question);
    if (!q) return;

    const item = q.closest(cfg.item);
    if (!item) return;

    // If your question is a link/button and you don't want navigation:
    e.preventDefault();

    toggleItem(item);
  });

  if (cfg.forceClosedOnInit) forceClosed();
}

/* Auto-init for plain <script> usage (no bundler) */
if (typeof window !== "undefined") {
  window.initFaqAccordion = initFaqAccordion;
}
