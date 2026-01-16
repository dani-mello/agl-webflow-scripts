
(function () {
  // Prevent double init
  if (window.__teamOverlayInit) return;
  window.__teamOverlayInit = true;

  var items = document.querySelectorAll(".c-team-collection_item");
  if (!items.length) return;

  function closeAll() {
    document.querySelectorAll(".c-team-overlay.is-open").forEach(function (ov) {
      ov.classList.remove("is-open");
    });
    document.documentElement.classList.remove("is-team-overlay-open");
    document.body.classList.remove("is-team-overlay-open");
  }

  function openForItem(item) {
    var overlay = item.querySelector(".c-team-overlay");
    if (!overlay) return;

    closeAll(); // ensures only one open at a time
    overlay.classList.add("is-open");
    document.documentElement.classList.add("is-team-overlay-open");
    document.body.classList.add("is-team-overlay-open");

    // optional: focus close button for accessibility
    var closeBtn = overlay.querySelector(".c-team-overlay_close");
    if (closeBtn) closeBtn.focus && closeBtn.focus();
  }

  items.forEach(function (item) {
    var card = item.querySelector(".c-team_wrap");
    var overlay = item.querySelector(".c-team-overlay");
    if (!card || !overlay) return;

    // Open on click
    card.addEventListener("click", function () {
      openForItem(item);
    });

    // Close on background click
    var bg = overlay.querySelector(".c-team-overlay_bg");
    if (bg) bg.addEventListener("click", closeAll);

    // Close on close button click
    var closeBtn = overlay.querySelector(".c-team-overlay_close");
    if (closeBtn) closeBtn.addEventListener("click", closeAll);
  });

  // Close on ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAll();
  });
})();

