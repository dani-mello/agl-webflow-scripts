/* AGL Webflow Scripts - main.js
   Tip: Never put secret keys in here.
*/

(() => {
  // Avoid running before the DOM exists
  const ready = (fn) => {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  ready(() => {
    console.log("[AGL] main.js loaded ✅");

    // ---- PASTE YOUR EXISTING JS BELOW THIS LINE ----


    // ---- PASTE YOUR EXISTING JS ABOVE THIS LINE ----
  });
})();
