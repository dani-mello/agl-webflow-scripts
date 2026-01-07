console.log(
  "%cFAQ ACCORDION JS LOADED (v2026-01-DEBUG)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);



(function () {
  function initFaqAccordion(userConfig) {
    var cfg = Object.assign(
      {
        item: ".c-faq-item",
        question: ".c-faq-item_question",
        answer: ".c-faq-item_answer",
        openClass: "is-open",      // <— simpler than _is-open
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

    if (window.__faqAccordionBound) return;
    window.__faqAccordionBound = true;

    function animateHeight(el, from, to) {
      if (prefersReduced) {
        el.style.height = String(to) + "px";
        return Promise.resolve();
      }
      var anim = el.animate(
        [{ height: from + "px" }, { height: to + "px" }],
        { duration: cfg.durationMs, easing: cfg.easing, fill: "both" }
      );
      return anim.finished["catch"](function () {});
    }

    function setOpenState(item, q, isOpen) {
      // State lives on question (easy to style + inspect)
      q.classList.toggle(cfg.openClass, isOpen);
      q.setAttribute("aria-expanded", isOpen ? "true" : "false");

      // Optional: also put a data attribute on item if you want
      item.setAttribute("data-open", isOpen ? "true" : "false");
    }

    function openItem(item, q) {
      var answer = item.querySelector(cfg.answer);
      if (!answer) return;

      setOpenState(item, q, true);

      var startHeight = answer.getBoundingClientRect().height;

      answer.style.height = "auto";
      var targetHeight = answer.scrollHeight;

      answer.style.height = startHeight + "px";
      answer.style.overflow = "hidden";

      animateHeight(answer, startHeight, targetHeight).then(function () {
        answer.style.height = "auto";
      });
    }

    function closeItem(item, q) {
      var answer = item.querySelector(cfg.answer);
      if (!answer) return;

      var startHeight =
        answer.style.height === "auto"
          ? answer.scrollHeight
          : answer.getBoundingClientRect().height;

      answer.style.height = startHeight + "px";
      answer.style.overflow = "hidden";

      setOpenState(item, q, false);

      animateHeight(answer, startHeight, 0).then(function () {
        answer.style.height = "0px";
      });
    }

    function forceClosed() {
      document.querySelectorAll(cfg.item).forEach(function (item) {
        var q = item.querySelector(cfg.question);
        var answer = item.querySelector(cfg.answer);
        if (!q || !answer) return;

        q.classList.remove(cfg.openClass);
        q.setAttribute("aria-expanded", "false");
        item.setAttribute("data-open", "false");

        answer.style.height = "0px";
        answer.style.overflow = "hidden";
      });
    }

    document.addEventListener("click", function (e) {
      var q = e.target.closest(cfg.question);
      if (!q) return;

      var item = q.closest(cfg.item);
      if (!item) return;

      e.preventDefault();

      var isOpen = q.getAttribute("aria-expanded") === "true";

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
