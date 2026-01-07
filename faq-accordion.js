console.log(
  "%cFAQ ACCORDION JS LOADED (V1)",
  "background:#0a1925;color:#fcb124;padding:4px 8px;border-radius:4px;font-weight:bold;"
);

(function () {
  function initFaqAccordion(userConfig) {
    var cfg = Object.assign(
      {
        item: ".c-faq-item",
        question: ".c-faq-item_question",
        answer: ".c-faq-item_answer",
        openClass: "is-open", // class applied to question (optional styling hook)
        closeOthers: false,
        durationMs: 280,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        forceClosedOnInit: true,

        // ✅ New: attribute for CSS hook (icon rotation)
        stateAttr: "data-faq-open"
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
      var anim = el.animate(
        [{ height: from + "px" }, { height: to + "px" }],
        { duration: cfg.durationMs, easing: cfg.easing, fill: "both" }
      );
      return anim.finished["catch"](function () {});
    }

    function setOpenState(item, q, isOpen) {
      // ✅ Question state (optional, but useful)
      q.classList.toggle(cfg.openClass, isOpen);
      q.setAttribute("aria-expanded", isOpen ? "true" : "false");

      // ✅ Item state (this is what your icon CSS should use)
      item.setAttribute(cfg.stateAttr, isOpen ? "true" : "false");

      // Debug (remove later)
      console.log("[FAQ] set state:", {
        isOpen: isOpen,
        aria: q.getAttribute("aria-expanded"),
        itemAttr: item.getAttribute(cfg.stateAttr)
      });
    }

    function openItem(item, q) {
      var answer = item.querySelector(cfg.answer);
      if (!answer) return;

      setOpenState(item, q, true);

      var startHeight = answer.getBoundingClientRect().height;

      // Measure full height
      answer.style.height = "auto";
      var targetHeight = answer.scrollHeight;

      // Animate from current -> target
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

        // Reset state
        q.classList.remove(cfg.openClass);
        q.setAttribute("aria-expanded", "false");
        item.setAttribute(cfg.stateAttr, "false");

        // Reset answer box
        answer.style.height = "0px";
        answer.style.overflow = "hidden";
      });

      console.log("[FAQ] forceClosed complete");
    }

    // Delegated click handler (CMS-friendly)
    document.addEventListener("click", function (e) {
      var q = e.target.closest(cfg.question);
      if (!q) return;

      var item = q.closest(cfg.item);
      if (!item) {
        console.warn("[FAQ] clicked question, but no item wrapper found", q);
        return;
      }

      e.preventDefault();

      var isOpen = q.getAttribute("aria-expanded") === "true";

      console.log("[FAQ] click", { isOpen: isOpen, q: q, item: item });

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
