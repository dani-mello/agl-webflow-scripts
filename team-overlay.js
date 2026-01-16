console.log("team-overlay v2");


(function () {
  if (window.__teamOverlayInit) return;
  window.__teamOverlayInit = true;

  var items = document.querySelectorAll(".c-team-collection_item");
  if (!items.length) return;

  var savedScrollY = 0;

  function lockScroll() {
    savedScrollY = window.scrollY || window.pageYOffset || 0;

    // Freeze the page at current position
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

    // Unfreeze
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";

    // Restore scroll position
    window.scrollTo(0, savedScrollY);
  }

  function closeAll() {
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });
    unlockScroll();
  }

  function openForItem(item) {
    var overlay = item.querySelector(".c-team-overlay");
    if (!overlay) return;

    // close others without unlocking (prevents jump)
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });

    lockScroll();
    overlay.classList.add("is-open");
    overlay.scrollTop = 0; // ensure overlay itself never becomes the scroll container


    // optional: reset overlay scroll to top each time
    var content = overlay.querySelector(".c-team-overlay_content");
    if (content) content.scrollTop = 0;
  }

  items.forEach(function (item) {
    var card = item.querySelector(".c-team_wrap");
    var overlay = item.querySelector(".c-team-overlay");
    if (!card || !overlay) return;

    card.addEventListener("click", function () {
      openForItem(item);
    });

    var bg = overlay.querySelector(".c-team-overlay_bg");
    if (bg) bg.addEventListener("click", closeAll);

    var closeBtn = overlay.querySelector(".c-team-overlay_close");
    if (closeBtn) closeBtn.addEventListener("click", closeAll);

    // Bonus: allow Enter key if you add tabindex="0" to .c-team_wrap
    card.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openForItem(item);
      }
    });
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });
})();

