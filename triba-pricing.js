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

    return new Intl.NumberFormat("en-NZ", {
      style: "currency",
      currency
    }).format(n);
  };

  const formatDateRange = (startISO, endISO) => {
    if (!startISO) return "";

    const start = new Date(startISO);
    const end = endISO ? new Date(endISO) : null;

    const full = {
      day: "numeric",
      month: "short",
      year: "numeric"
    };

    if (!end || start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString("en-NZ", full);
    }

    const sameMonth =
      start.getMonth() === end.getMonth() &&
      start.getFullYear() === end.getFullYear();

    if (sameMonth) {
      const monthYear = start.toLocaleDateString("en-NZ", {
        month: "short",
        year: "numeric"
      });

      return `${start.getDate()}–${end.getDate()} ${monthYear}`;
    }

    return `${start.toLocaleDateString("en-NZ", full)} – ${end.toLocaleDateString(
      "en-NZ",
      full
    )}`;
  };

  const getTripAbbrev = (templateName) => {
    const m = /\(([^)]+)\)/.exec(templateName || "");
    if (m && m[1]) return m[1].trim();

    const words = (templateName || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    return (
      words
        .slice(0, 3)
        .map((w) => w[0].toUpperCase())
        .join("") || "TRIP"
    );
  };

  const setPoster = (el, url) => {
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
  };

  const setDescription = (el, text) => {
    if (!el || !text) return;

    el.textContent = String(text).trim();
    el.style.whiteSpace = "pre-line";
  };

  const namesMatch = (experienceName, templateName) => {
    const exp = String(experienceName || "").trim().toLowerCase();
    const tpl = String(templateName || "").trim().toLowerCase();

    if (!exp || !tpl) return false;

    return exp === tpl || exp.startsWith(`${tpl} -`) || exp.startsWith(tpl);
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
        {
          headers: {
            "x-api-key": API_KEY
          }
        }
      );

      if (!templateRes.ok) throw new Error("Template fetch failed");

      const templateJson = await templateRes.json();
      const template = templateJson?.data;

      if (!template) return;

      // PRICE
      const pricing = template.pricing;
      const currency = pricing?.currency || "NZD";

      if (pricing?.type === "fixed" && elPrice) {
        elPrice.textContent = money(pricing.amount, currency);
      }

      // DEPOSIT
      if (elDeposit) {
        if (pricing?.deposit != null) {
          elDeposit.textContent = `Deposit: ${money(pricing.deposit, currency)}`;
          elDeposit.style.display = "";
        } else {
          elDeposit.style.display = "none";
        }
      }

      // POSTER + DESCRIPTION
      setPoster(elPoster, template.media?.poster);
      setDescription(elDescription, template.description);

      // ----------------------------
      // 2) DEPARTURES / SCHEDULE
      // ----------------------------
      if (!elSchedule) return;

      const expRes = await fetch(`${BASE}/${ORG_ID}/experiences`, {
        headers: {
          "x-api-key": API_KEY
        }
      });

      if (!expRes.ok) throw new Error("Experiences fetch failed");

      const expJson = await expRes.json();

      // API returns:
      // data: [
      //   { template: {...}, experiences: [...] },
      //   { template: null, experiences: [...] }
      // ]
      const groups = Array.isArray(expJson?.data) ? expJson.data : [];

      // Flatten all experiences from all groups
      const allExperiences = groups.flatMap((group) =>
        Array.isArray(group?.experiences) ? group.experiences : []
      );

      const matching = allExperiences
        .filter((exp) => namesMatch(exp?.name, template.name))
        .filter((exp) => exp?.dates?.start_date)
        .sort(
          (a, b) =>
            new Date(a.dates.start_date).getTime() -
            new Date(b.dates.start_date).getTime()
        );

      elSchedule.innerHTML = "";

      if (!matching.length) {
        elSchedule.style.display = "none";
        return;
      }

      elSchedule.style.display = "";

      const abbrev = getTripAbbrev(template.name);

      matching.forEach((exp, index) => {
        const code = `${abbrev}${index + 1}`;
        const dateRange = formatDateRange(
          exp.dates?.start_date,
          exp.dates?.end_date
        );

        const row = document.createElement("div");
        row.className = "c-trip-schedule_item";

        row.innerHTML = `
          <div class="u-eyebrow dark">${code}</div>
          <div class="u-eyebrow dark large">${dateRange}</div>
        `;

        elSchedule.appendChild(row);

        if (index < matching.length - 1) {
          const line = document.createElement("div");
          line.className = "u-line";
          elSchedule.appendChild(line);
        }
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
})();
