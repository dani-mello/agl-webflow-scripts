/*!
 * FAQ Accordion (Webflow / CMS friendly) - Plain Script
 * - Opens/closes answers with height animation
 * - Animates plus -> minus by toggling a class on the item
 * - No dependencies
 */

(function () {
  function initFaqAccordion(userConfig) {
    var cfg = Object.assign(
      {
        item: ".c-faq-item",
        question: ".c-faq-item_question",
        answer: ".c-faq-item_answer",
        openClass: "_is-open",
        closeOthers: false,
        durationMs: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        forceClosedOnInit: true
      },
      userConfig || {}
    );

    var prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Prevent double-binding
    if (window.__faqAccordionBound) return;
    window.__faqAccordionBound = true;

    function animateHeight(el, from, to) {
      if (prefersReduced) {
        el.style.height = String(to) + "px";
        return Promise.resolve();
      }

      // Web Animations API
      var anim = el.animate(
        [{ height: from + "px" }, { height: to + "px" }],
        { duration: cfg.durationMs, easing: cfg.easing, fill: "both" }
      );

      return anim.finished["catch"](function () {});
    }

    function openItem(item) {
      var answer = item.querySelector(cfg.answer);
      if (!answer) return;

      item.classList.add(cfg.openClass);

      var startHeight = answer.getBoundingClientRect().height;

      answer.style.height = "auto";
      var targetHeight = answer.scrollHeight;

      answer.style.height = startHeight + "px";
      answer.style.overflow = "hidden";

      animateHeight(answer, startHeight, targetHeight).then(function () {
        answer.style.height = "auto";
      });
    }

    function closeItem(item) {
      var answer = item.querySelector(cfg.answer);
      if (!answer) return;

      var startHeight =
        answer.style.height === "auto"
          ? answer.scrollHeight
          : answer.getBoundingClientRect().height;

      answer.style.height = startHeight + "px";
      answer.style.overflow = "hidden";

      item.classList.remove(cfg.openClass);

      animateHeight(answer, startHeight, 0).then(function () {
        answer.style.height = "0px";
      });
    }

    function toggleItem(item) {
      var isOpen = item.classList.contains(cfg.openClass);

      if (cfg.closeOthers && !isOpen) {
        document.querySelectorAll(cfg.item).forEach(function (other) {
          if (other !== item) closeItem(other);
        });
      }

      isOpen ? closeItem(item) : openItem(item);
    }

    function forceClosed() {
      document.querySelectorAll(cfg.item).forEach(function (item) {
        var answer = item.querySelector(cfg.answer);
        if (!answer) return;

        item.classList.remove(cfg.openClass);
        answer.style.height = "0px";
        answer.style.overflow = "hidden";
      });
    }

    // Delegated click handler (CMS-friendly)
    document.addEventListener("click", function (e) {
      var q = e.target.closest(cfg.question);
      if (!q) return;

      var item = q.closest(cfg.item);
      if (!item) return;

      e.preventDefault();
      toggleItem(item);
    });

    if (cfg.forceClosedOnInit) forceClosed();
  }

  // Attach globally
  window.initFaqAccordion = initFaqAccordion;
})();
