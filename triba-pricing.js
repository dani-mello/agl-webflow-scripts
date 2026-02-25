// triba-pricing.js
// Loads template data + departures from Triba Concord API

(function () {
  if (window.__TRIBA_FULL_INIT__) return;
  window.__TRIBA_FULL_INIT__ = true;

  const ORG_ID = "4a66ebe2-9349-4c0b-8595-459a85795db7";
  const BASE = "https://concord.triba.co";

  function money(minorUnits, currency = "NZD") {
    const n = Number(minorUnits || 0) / 100;
    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency
    }).format(n);
  }

  function formatDateRange(startISO, endISO) {
    if (!startISO) return "";

    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const options = { day: "numeric", month: "short", year: "numeric" };

    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-NZ", options);
    }

    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      return `${start.getDate()}–${end.getDate()} ${start.toLocaleDateString("en-NZ", { month: "short", year: "numeric" })}`;
    }

    return `${start.toLocaleDateString("en-NZ", options)} – ${end.toLocaleDateString("en-NZ", options)}`;
  }

  function setPoster(el, url) {
    if (!el || !url) return;

    if (el.tagName === "IMG") {
      el.src = url;
      el.removeAttribute("srcset");
      el.removeAttribute("sizes");
      return;
    }

    const innerImg = el.querySelector("img");
    if (innerImg) {
      innerImg.src = url;
      innerImg.removeAttribute("srcset");
      innerImg.removeAttribute("sizes");
      return;
    }

    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  }

  async function init() {
    const bridge = document.querySelector(".js-triba");
    if (!bridge) return;

    const useTriba = bridge.dataset.useTriba === "true";
    const templateId = (bridge.dataset.tribaTemplateId || "").trim();
    if (!useTriba || !templateId) return;

    const API_KEY = window.TRIBA_API_KEY;
    if (!API_KEY) return;

    const elPrice = document.querySelector(".js-price-from");
    const elDeposit = document.querySelector(".js-price-deposit");
    const elPoster = document.querySelector(".js-triba-poster");
    const elDescription = document.querySelector(".js-triba-description");
    const elSchedule = document.querySelector(".js-triba-schedule");

    try {
      /* ----------------------------
         1. LOAD TEMPLATE
      ----------------------------- */
      const templateRes = await fetch(
        `${BASE}/${ORG_ID}/experience-templates/${encodeURIComponent(templateId)}`,
        { headers: { "x-api-key": API_KEY } }
      );

      if (!templateRes.ok) throw new Error("Template fetch failed");

      const templateJson = await templateRes.json();
      const template = templateJson?.data;
      if (!template) return;

      // PRICE
      const pricing = template.pricing;
      if (pricing?.type === "fixed" && elPrice) {
        elPrice.textContent = money(pricing.amount, pricing.currency || "NZD");
      }

      if (pricing?.deposit != null && elDeposit) {
        elDeposit.textContent =
          `Deposit: ${money(pricing.deposit, pricing.currency || "NZD")}`;
        elDeposit.style.display = "";
      }

      // POSTER
      setPoster(elPoster, template.media?.poster);

      // DESCRIPTION
      if (elDescription && template.description) {
        elDescription.innerHTML = template.description
          .split(/\n\s*\n/g)
          .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
          .join("");
      }

      /* ----------------------------
         2. LOAD EXPERIENCES (DEPARTURES)
      ----------------------------- */
      if (!elSchedule) return;

      const expRes = await fetch(
        `${BASE}/${ORG_ID}/experiences`,
        { headers: { "x-api-key": API_KEY } }
      );

      if (!expRes.ok) throw new Error("Experiences fetch failed");

      const expJson = await expRes.json();
      const experiences = expJson?.data || [];

      // Match by template name
      const matching = experiences
        .filter(e => e.name === template.name)
        .sort((a, b) => new Date(a.dates.start_date) - new Date(b.dates.start_date));

      if (!matching.length) {
        elSchedule.innerHTML = "<p>No upcoming departures.</p>";
        return;
      }

      // Generate schedule rows
      elSchedule.innerHTML = "";

      matching.forEach((exp, index) => {
        const code = `${template.name.match(/\((.*?)\)/)?.[1] || "TRIP"}${index + 1}`;
        const dateRange = formatDateRange(
          exp.dates?.start_date,
          exp.dates?.end_date
        );

        const row = document.createElement("div");
        row.className = "c-schedule-row";

        row.innerHTML = `
          <div class="c-schedule-code">${code}</div>
          <div class="c-schedule-dates">${dateRange}</div>
        `;

        elSchedule.appendChild(row);
      });

    } catch (err) {
      console.warn("Triba load failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();// triba-pricing.js
// Loads pricing + template content from Triba Concord API

(function () {
  if (window.__TRIBA_TEMPLATE_INIT__) return;
  window.__TRIBA_TEMPLATE_INIT__ = true;

  function init() {
    const bridge = document.querySelector(".js-triba");
    if (!bridge) return;

    const useTriba = bridge.dataset.useTriba === "true";
    const templateId = (bridge.dataset.tribaTemplateId || "").trim();
    if (!useTriba || !templateId) return;

    const ORG_ID = "4a66ebe2-9349-4c0b-8595-459a85795db7";
    const API_KEY = window.TRIBA_API_KEY || "";
    const BASE = "https://concord.triba.co";

    if (!API_KEY) {
      console.warn("Triba API key missing.");
      return;
    }

    const elPrice = document.querySelector(".js-price-from");
    const elDeposit = document.querySelector(".js-price-deposit");
    const elPoster = document.querySelector(".js-triba-poster");
    const elDescription = document.querySelector(".js-triba-description");

    const money = (minorUnits, currency = "NZD") => {
      const n = Number(minorUnits || 0) / 100;
      return new Intl.NumberFormat("en-NZ", {
        style: "currency",
        currency
      }).format(n);
    };

    async function run() {
      try {
        const url = `${BASE}/${ORG_ID}/experience-templates/${encodeURIComponent(templateId)}`;
        const res = await fetch(url, {
          headers: { "x-api-key": API_KEY }
        });

        if (!res.ok) throw new Error(`Triba API ${res.status}`);

        const json = await res.json();
        const data = json?.data;
        if (!data) return;

        /* --------------------------
           PRICE
        --------------------------- */
        const pricing = data.pricing;

        if (pricing?.type === "fixed") {
          if (elPrice) {
            elPrice.textContent = money(pricing.amount, pricing.currency || "NZD");
          }
        }

        if (pricing?.deposit != null && elDeposit) {
          elDeposit.textContent =
            `Deposit: ${money(pricing.deposit, pricing.currency || "NZD")}`;
          elDeposit.style.display = "";
        }

        /* --------------------------
           POSTER IMAGE
        --------------------------- */
      // POSTER IMAGE (Webflow-safe)
const posterUrl = data?.media?.poster;

if (posterUrl) {
  const posterEl = document.querySelector(".js-triba-poster");

  if (posterEl) {
    // Case A: element is an <img>
    if (posterEl.tagName === "IMG") {
      posterEl.src = posterUrl;
      posterEl.removeAttribute("srcset"); // stop Webflow candidates overriding
      posterEl.removeAttribute("sizes");
    } else {
      // Case B: wrapper contains an <img> (very common)
      const innerImg = posterEl.querySelector("img");
      if (innerImg) {
        innerImg.src = posterUrl;
        innerImg.removeAttribute("srcset");
        innerImg.removeAttribute("sizes");
      } else {
        // Case C: it's a div using background-image
        posterEl.style.backgroundImage = `url("${posterUrl}")`;
        posterEl.style.backgroundSize = "cover";
        posterEl.style.backgroundPosition = "center";
      }
    }
  }
}

        /* --------------------------
           DESCRIPTION
        --------------------------- */
        if (elDescription && data.description) {
          elDescription.textContent = data.description;
        }

      } catch (err) {
        console.warn("Triba template load failed", err);
      }
    }

    run();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

})();// triba-pricing.js
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
