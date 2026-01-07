console.log(
  "%cFAQ ACCORDION JS LOADED (V5 – NO ANIMATION)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  function initFaqAccordion(userConfig) {
    var cfg = Object.assign(
      {
        item: ".c-faq-item",
        question: ".c-faq-item_question",
        answer: ".c-faq-item_answer",

        // optional class on question (if you want styling hooks)
        openClass: "is-open",

        // accordion behaviour
        closeOthers: false,

        // state hook for CSS (icon rotation)
        stateAttr: "data-faq-open",

        // force closed on load (recommended)
        forceClosedOnInit: true
      },
      userConfig || {}
    );

    // prevent double binding
    if (window.__faqAccordionBound) return;
    window.__faqAccordionBound = true;

    function setOpenState(item, q, isOpen) {
      // accessibility
      q.setAttribute("aria-expanded", isOpen ? "true" : "false");

      // optional styling hook
      q.classList.toggle(cfg.openClass, isOpen);

      // CSS hook for icon
      item.setAttribute(cfg.stateAttr, isOpen ? "true" : "false");

      console.log("[FAQ] state:", {
        isOpen: isOpen,
        item: item
      });
    }

    function openItem(item, q) {
      setOpenState(item, q, true);
    }

    function closeItem(item, q) {
      setOpenState(item, q, false);
    }

    function forceClosed() {
      document.querySelectorAll(cfg.item).forEach(function (item) {
        var q = item.querySelector(cfg.question);
        if (!q) return;

        q.setAttribute("aria-expanded", "false");
        q.classList.remove(cfg.openClass);
        item.setAttribute(cfg.stateAttr, "false");
      });

      console.log("[FAQ] forceClosed complete");
    }

    // delegated click (CMS-safe)
    document.addEventListener("click", function (e) {
      var q = e.target.closest(cfg.question);
      if (!q) return;

      var item = q.closest(cfg.item);
      if (!item) return;

      e.preventDefault();

      var isOpen = q.getAttribute("aria-expanded") === "true";

      console.log("[FAQ] click", { isOpen: isOpen, item: item });

      if (cfg.closeOthers && !isOpen) {
        document.querySelectorAll(cfg.item).forEach(function (other) {
          if (other === item) return;
          var oq = other.querySelector(cfg.question);
          if (!oq) return;
          closeItem(other, oq);
        });
      }

      isOpen ? closeItem(item, q) : openItem(item, q);
    });

    if (cfg.forceClosedOnInit) forceClosed();
  }

  window.initFaqAccordion = initFaqAccordion;
})();
