console.log("team-overlay v4");



(function () {
  if (window.__teamOverlayInit) return;
  window.__teamOverlayInit = true;

  var savedScrollY = 0;

  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;

    document.body.style.position = "fixed";
    document.body.style.top = (-savedScrollY) + "px";
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    document.documentElement.classList.add("is-team-overlay-open");
    document.body.classList.add("is-team-overlay-open");
  }

  function unlockScroll() {
    document.documentElement.classList.remove("is-team-overlay-open");
    document.body.classList.remove("is-team-overlay-open");

    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    window.scrollTo(0, savedScrollY);
  }

  function closeAll() {
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });
    unlockScroll();
  }

  function openFromCard(cardEl) {
    // ✅ Works across ALL collection lists because it finds the nearest CMS item
    var item = cardEl.closest(".c-team-collection_item");
    if (!item) return;

    var overlay = item.querySelector(".c-team-overlay");
    if (!overlay) return;

    // Close others (keep scroll locked)
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });

    lockScroll();

    overlay.classList.add("is-open");

    // ensure only the content scrolls
    overlay.scrollTop = 0;
    var content = overlay.querySelector(".c-team-overlay_content");
    if (content) content.scrollTop = 0;
  }

  // ✅ ONE listener for the whole page
  document.addEventListener("click", function (e) {
    var card = e.target.closest(".c-team_wrap");
    if (card) { openFromCard(card); return; }

    if (e.target.closest(".c-team-overlay_bg")) { closeAll(); return; }
    if (e.target.closest(".c-team-overlay_close")) { closeAll(); return; }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });
})();

