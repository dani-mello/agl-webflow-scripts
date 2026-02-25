// triba-pricing.js
// Triba Concord → Webflow Trip Template
// - Template: price, deposit, poster, description
// - Departures: schedule list from /experiences
// Requires on page:
//   .js-triba (data-use-triba, data-triba-template-id)
//   .js-price-from
//   .js-price-deposit (optional)
//   .js-triba-poster (img OR wrapper OR bg div)
//   .js-triba-description (optional)
//   .js-triba-schedule (optional container)

(function () {
  if (window.__TRIBA_FULL_INIT__) return;
  window.__TRIBA_FULL_INIT__ = true;

  const ORG_ID = "4a66ebe2-9349-4c0b-8595-459a85795db7";
  const BASE = "https://concord.triba.co";

  const money = (minorUnits, currency = "NZD") => {
    const n = Number(minorUnits || 0) / 100;
    return new Intl.NumberFormat("en-NZ", { style: "currency", currency }).format(n);
  };

  const formatDateRange = (startISO, endISO) => {
    if (!startISO) return "";

    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const full = { day: "numeric", month: "short", year: "numeric" };

    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-NZ", full);
    }

    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      const monthYear = start.toLocaleDateString("en-NZ", { month: "short", year: "numeric" });
      return `${start.getDate()}–${end.getDate()} ${monthYear}`;
    }

    return `${start.toLocaleDateString("en-NZ", full)} – ${end.toLocaleDateString("en-NZ", full)}`;
  };

  const setPoster = (el, url) => {
    if (!el || !url) return;

    // Case A: element is an <img>
    if (el.tagName === "IMG") {
      el.src = url;
      el.removeAttribute("srcset");
      el.removeAttribute("sizes");
      return;
    }

    // Case B: wrapper contains an <img> (Webflow often does this)
    const innerImg = el.querySelector("img");
    if (innerImg) {
      innerImg.src = url;
      innerImg.removeAttribute("srcset");
      innerImg.removeAttribute("sizes");
      return;
    }

    // Case C: background image div
    el.style.backgroundImage = `url("${url}")`;
    el.style.backgroundSize = "cover";
    el.style.backgroundPosition = "center";
  };

  const setDescription = (el, text) => {
    if (!el || !text) return;
    const safe = String(text).trim();

    // Preserve paragraphs from Triba text (blank lines become <p>)
    el.innerHTML = safe
      .split(/\n\s*\n/g)
      .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
      .join("");
  };

  const getTripAbbrev = (templateName) => {
    // Prefer "(MEC)" style abbreviation if present
    const m = /\(([^)]+)\)/.exec(templateName || "");
    if (m && m[1]) return m[1].trim();

    // fallback: first letters of first 3 words (e.g. "Tasman Glacier Ice" -> TGI)
    const words = (templateName || "").trim().split(/\s+/).filter(Boolean);
    return words.slice(0, 3).map(w => w[0].toUpperCase()).join("") || "TRIP";
  };

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
      // ----------------------------
      // 1) TEMPLATE
      // ----------------------------
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

      // Deposit (optional)
      if (elDeposit) {
        if (pricing?.deposit != null) {
          elDeposit.textContent = `Deposit: ${money(pricing.deposit, pricing.currency || "NZD")}`;
          elDeposit.style.display = "";
        } else {
          elDeposit.style.display = "none";
        }
      }

      // POSTER + DESCRIPTION
      setPoster(elPoster, template.media?.poster);
      setDescription(elDescription, template.description);

      // ----------------------------
      // 2) DEPARTURES (SCHEDULE)
      // ----------------------------
      if (!elSchedule) return;

      const expRes = await fetch(`${BASE}/${ORG_ID}/experiences`, {
        headers: { "x-api-key": API_KEY }
      });

      if (!expRes.ok) throw new Error("Experiences fetch failed");

      const expJson = await expRes.json();
      const experiences = expJson?.data || [];

      // Match by name (current API does not expose template_id on experiences)
      const matching = experiences
        .filter(e => e?.name === template.name)
        .filter(e => e?.dates?.start_date) // must have a start date
        .sort((a, b) => new Date(a.dates.start_date) - new Date(b.dates.start_date));

      if (!matching.length) {
        elSchedule.innerHTML = ""; // keep it clean (or set a message if you want)
        return;
      }

      const abbrev = getTripAbbrev(template.name);

      // Clear placeholder
      elSchedule.innerHTML = "";

      matching.forEach((exp, index) => {
        const code = `${abbrev}${index + 1}`;
        const dateRange = formatDateRange(exp.dates?.start_date, exp.dates?.end_date);

        // Row wrapper (use your existing styling class if you have one)
        const row = document.createElement("div");
        row.className = "c-trip-schedule_item"; // change this to your real row class if needed

        // Use your typography classes
        row.innerHTML = `
          <div class="u-eyebrow dark">${code}</div>
          <div class="u-eyebrow dark">${dateRange}</div>
        `;

        elSchedule.appendChild(row);

        // Divider using your existing utility class (except after last)
        if (index < matching.length - 1) {
          const line = document.createElement("div");
          line.className = "u-line";
          elSchedule.appendChild(line);
        }
      });

    } catch (err) {
      // Fail quietly so the page never breaks
      // (Keep console warning minimal for dev)
      console.warn("Triba load failed", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
