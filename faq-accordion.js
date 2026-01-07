console.log(
  "%cFAQ ACCORDION JS LOADED (V3 – TOGGLE CLASS ONLY)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  function initFaqAccordion(userConfig) {
    var cfg = Object.assign(
      {
        item: ".c-faq-item",
        question: ".c-faq-item_question",
        answer: ".c-faq-item_answer",
        openItemClass: "is-open",     // ✅ applied to .c-faq-item
        closeOthers: false,
        forceClosedOnInit: true,
        stateAttr: "data-faq-open"    // ✅ optional CSS hook
      },
      userConfig || {}
    );

    if (window.__faqAccordionBound) return;
    window.__faqAccordionBound = true;

    function setState(item, isOpen) {
      item.classList.toggle(cfg.openItemClass, isOpen);
      item.setAttribute(cfg.stateAttr, isOpen ? "true" : "false");

      var q = item.querySelector(cfg.question);
      if (q) q.setAttribute("aria-expanded", isOpen ? "true" : "false");
    }

    function forceClosed() {
      document.querySelectorAll(cfg.item).forEach(function (item) {
        setState(item, false);
      });
      console.log("[FAQ] forceClosed complete");
    }

    document.addEventListener("click", function (e) {
      var q = e.target.closest(cfg.question);
      if (!q) return;

      var item = q.closest(cfg.item);
      if (!item) return;

      e.preventDefault();

      var isOpen = item.classList.contains(cfg.openItemClass);

      if (cfg.closeOthers && !isOpen) {
        document.querySelectorAll(cfg.item).forEach(function (other) {
          if (other !== item) setState(other, false);
        });
      }

      setState(item, !isOpen);
      console.log("[FAQ] toggled", { isOpen: !isOpen, item: item });
    });

    if (cfg.forceClosedOnInit) forceClosed();
  }

  window.initFaqAccordion = initFaqAccordion;
})();
