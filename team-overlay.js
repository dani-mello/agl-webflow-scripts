console.log("team-overlay v3");


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

  function openOverlayFromCard(cardEl) {
    // find the CMS item container for THIS card
    var item = cardEl.closest(".c-team-collection_item");
    if (!item) return;

    var overlay = item.querySelector(".c-team-overlay");
    if (!overlay) return;

    // Close any others without unlocking first (prevents jump)
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });

    lockScroll();

    overlay.classList.add("is-open");

    // ensure overlay isn't accidentally scroll container
    overlay.scrollTop = 0;

    // reset the inner content scroll to top (optional)
    var content = overlay.querySelector(".c-team-overlay_content");
    if (content) content.scrollTop = 0;
  }

  // ✅ Event delegation: works for all three repeated sections + CMS
  document.addEventListener("click", function (e) {
    // Open: click on card or any child inside it
    var card = e.target.closest(".c-team_wrap");
    if (card) {
      openOverlayFromCard(card);
      return;
    }

    // Close: click background
    if (e.target.closest(".c-team-overlay_bg")) {
      closeAll();
      return;
    }

    // Close: click close button
    if (e.target.closest(".c-team-overlay_close")) {
      closeAll();
      return;
    }
  });

  // ESC closes
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });

})();
