/* =========================================================
   CODEX ICON OVERRIDES
   ========================================================= */

function getCodexDisplayIcon(icon) {
  switch (icon) {
    case "◇":
      return "✥";
    case "✦":
      return "◎";
    case "✧":
      return "▤";
    default:
      return icon;
  }
}

getCodexRecordTypeIcon = function getCodexRecordTypeIcon(type) {
  switch (type) {
    case "poi":
    case "poi-group":
      return "◎";

    case "npc":
      return "♟";

    case "region":
      return "✥";

    case "hex":
      return "⬡";

    default:
      return "•";
  }
};

getCodexSearchGroupIcon = function getCodexSearchGroupIcon(type) {
  switch (type) {
    case "all":
      return "▤";
    case "poi":
    case "poi-group":
      return "◎";
    case "npc":
      return "♟";
    case "region":
      return "✥";
    case "hex":
      return "⬡";
    default:
      return "•";
  }
};

getCodexSearchResultIcon = function getCodexSearchResultIcon(type) {
  if (type === "poi-group") return getCodexSearchGroupIcon("poi");
  return getCodexSearchGroupIcon(type);
};

renderCodexDetailRail = function renderCodexDetailRail(items) {
  return `
    <nav class="codex-row-list codex-row-list-rail codex-detail-section-rail" aria-label="Detail sections">
      ${items.map((item, index) => {
        const displayIcon = getCodexDisplayIcon(item.icon || "");
        const iconClass = getCodexRailIconClass(displayIcon);

        return `
          <button
            class="codex-row codex-detail-section-rail-row ${index === 0 ? "active codex-row-active" : ""}"
            type="button"
            data-codex-detail-section="${escapeHtml(item.id)}"
            onclick="setCodexDetailSection('${escapeJsString(item.id)}')"
          >
            ${displayIcon ? `<span class="codex-row-icon${iconClass}" aria-hidden="true">${escapeHtml(displayIcon)}</span>` : ""}
            <span class="codex-row-main">
              <span class="codex-row-title">${escapeHtml(item.label)}</span>
            </span>
            ${
              item.count !== undefined && item.count !== null
                ? `<span class="codex-row-count">${escapeHtml(String(item.count))}</span>`
                : `<span class="codex-row-arrow" aria-hidden="true">›</span>`
            }
          </button>
        `;
      }).join("")}
    </nav>
  `;
};

renderCodexIndex = function renderCodexIndex() {
  setCodexTitle("The Codex of Kadesh");
  renderCodexBreadcrumbs([]);

  codexSearchQuery = "";
  syncCodexDesktopPersistentSearchInput("");

  const content = getCodexContent();
  content.className = "codex-home";

  content.innerHTML = `
    <div id="codex-home-section-buttons" class="codex-home-section-buttons codex-row-list">
      <button class="codex-row codex-home-section-row" type="button" onclick="openCodexPage('regions')">
        <span class="codex-row-icon" aria-hidden="true">✥</span>
        <span class="codex-row-main">
          <span class="codex-row-title">Regions</span>
          <span class="codex-row-meta">Browse lands, territories, and terrain profiles</span>
        </span>
        <span class="codex-row-arrow" aria-hidden="true">›</span>
      </button>

      <button class="codex-row codex-home-section-row" type="button" onclick="openCodexPage('pois')">
        <span class="codex-row-icon" aria-hidden="true">◎</span>
        <span class="codex-row-main">
          <span class="codex-row-title">Points of Interest</span>
          <span class="codex-row-meta">Settlements, ruins, landmarks, and mapped places</span>
        </span>
        <span class="codex-row-arrow" aria-hidden="true">›</span>
      </button>

      <button class="codex-row codex-home-section-row" type="button" onclick="openCodexPage('npcs')">
        <span class="codex-row-icon" aria-hidden="true">♟</span>
        <span class="codex-row-main">
          <span class="codex-row-title">NPCs</span>
          <span class="codex-row-meta">The denizens of Kadesh</span>
        </span>
        <span class="codex-row-arrow" aria-hidden="true">›</span>
      </button>

      <button class="codex-row codex-home-section-row" type="button" onclick="openCodexPage('hexes')">
        <span class="codex-row-icon codex-row-icon-hex" aria-hidden="true">⬡</span>
        <span class="codex-row-main">
          <span class="codex-row-title">Hexes</span>
          <span class="codex-row-meta">Browse map hexes by terrain and region</span>
        </span>
        <span class="codex-row-arrow" aria-hidden="true">›</span>
      </button>
    </div>
  `;
};

function applyCodexSearchGlyphOverride() {
  const action = document.getElementById("codex-desktop-search-action");
  if (!action) return;

  action.textContent = "⌕";
  action.classList.add("codex-search-action-mirrored");
}

document.addEventListener("DOMContentLoaded", applyCodexSearchGlyphOverride);
