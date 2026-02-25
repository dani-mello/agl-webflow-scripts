// triba-pricing.js
// Loads pricing from Triba Concord API into Trip Template page

(function () {
  if (window.__TRIBA_PRICING_INIT__) return;
  window.__TRIBA_PRICING_INIT__ = true;

  function init() {
    const bridge = document.querySelector(".js-triba");
    if (!bridge) return;

    const useTriba = bridge.dataset.useTriba === "true";
    const templateId = (bridge.dataset.tribaTemplateId || "").trim();
    if (!useTriba || !templateId) return;

    const ORG_ID = "4a66ebe2-9349-4c0b-8595-459a85795db7";
    const API_KEY = window.TRIBA_API_KEY || "5L4A80M9A527NhvaHevy630O9eXobJx88Sp7ZG9C";
    const BASE = "https://concord.triba.co";

    if (!API_KEY) {
      console.warn("Triba API key missing.");
      return;
    }

    const elPrice = document.querySelector(".js-price-from");
    const elDeposit = document.querySelector(".js-price-deposit");

    const money = (minorUnits, currency = "NZD") => {
      const n = Number(minorUnits || 0) / 100;
      return new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency
      }).format(n);
    };

    function minTierAmount(tier) {
      let min = Infinity;

      if (Array.isArray(tier?.day_bands)) {
        tier.day_bands.forEach(b => {
          if (b?.amount != null) min = Math.min(min, b.amount);
        });
      }

      if (Array.isArray(tier?.people_bands)) {
        tier.people_bands.forEach(pb => {
          if (pb?.amount != null) min = Math.min(min, pb.amount);
          if (Array.isArray(pb?.day_bands)) {
            pb.day_bands.forEach(db => {
              if (db?.amount != null) min = Math.min(min, db.amount);
            });
          }
        });
      }

      return Number.isFinite(min) ? min : null;
    }

    async function run() {
      try {
        const url = `${BASE}/${ORG_ID}/experience-templates/${encodeURIComponent(templateId)}`;
        const res = await fetch(url, {
          headers: { "x-api-key": API_KEY }
        });

        if (!res.ok) throw new Error(`Triba API ${res.status}`);

        const json = await res.json();
        const pricing = json?.data?.pricing || json?.pricing;

        if (!pricing || !pricing.type) return;

        if (pricing.type === "fixed") {
          if (elPrice) elPrice.textContent =
            money(pricing.amount, pricing.currency || "NZD");
        }

        if (pricing.type === "tier") {
          const min = minTierAmount(pricing.tier);
          if (elPrice) {
            elPrice.textContent =
              min != null
                ? `From ${money(min, pricing.currency || "NZD")}`
                : "Pricing on request";
          }
        }

        if (elDeposit) {
          if (pricing.deposit != null) {
            elDeposit.textContent =
              `Deposit: ${money(pricing.deposit, pricing.currency || "NZD")}`;
            elDeposit.style.display = "";
          } else {
            elDeposit.style.display = "none";
          }
        }

      } catch (err) {
        console.warn("Triba pricing failed", err);
      }
    }

    run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();
