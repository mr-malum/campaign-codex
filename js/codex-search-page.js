/* =========================================================
   CODEX SEARCH PAGE
   ========================================================= */

function renderCodexSearchPage() {
  setCodexTitle("Search the Codex");

  renderCodexBreadcrumbs([
    { label: "Codex", clickable: true, onclick: "resetCodexToIndex()" },
    { label: "Search" }
  ]);

  const content = document.getElementById("codex-content");
  content.className = "codex-search-page";

  content.innerHTML = `
    <div class="codex-search-page-shell">
      <div class="codex-search-controls-shell">
        <div class="codex-search-shell">
          <input
            id="codex-search-input"
            type="search"
            placeholder="Search records..."
            autocomplete="off"
            value="${escapeHtml(codexSearchQuery)}"
          >
        </div>
      </div>

      <div id="codex-search-results" class="codex-search-results-shell">
        <p>Begin typing to search the records of Kadesh.</p>
      </div>
    </div>
  `;

  const input = document.getElementById("codex-search-input");

  input.addEventListener("input", function () {
    codexSearchQuery = input.value;
    renderCodexSearchResults(input.value);
  });

  if (codexSearchQuery.trim()) {
    renderCodexSearchResults(codexSearchQuery);
  }

  input.focus();
}

function renderCodexSearchResults(query) {
  const resultsEl = document.getElementById("codex-search-results");
  const cleanQuery = query.trim().toLowerCase();

  if (!cleanQuery) {
    resultsEl.innerHTML = `
      <p>Begin typing to search the records of Kadesh.</p>
    `;
    return;
  }

  const results = [];
  const resultKeys = new Set();

  function addSearchResult(type, id, label) {
    const key = `${type}:${id}`;
    if (resultKeys.has(key)) return;

    resultKeys.add(key);
    results.push({ type, id, label });
  }

  function textMatches(values) {
    return values.join(" ").toLowerCase().includes(cleanQuery);
  }

  const matchingRegionIds = new Set();
  const matchingPoiHexIds = new Set();
  const matchingNpcHexIds = new Set();

  (db?.raw?.regions || []).forEach(region => {
    if (textMatches([
      region.Region_ID,
      region.Region_Name,
      region.Lore,
      region.DM_Journal
    ])) {
      matchingRegionIds.add(region.Region_ID);

      addSearchResult(
        "region",
        region.Region_ID,
        joinCodexLabel(region.Region_Name || region.Region_ID, ["Region"])
      );
    }
  });

  (db?.raw?.pois || []).forEach(poi => {
    if (textMatches([
      poi.POI_ID,
      poi.Name,
      poi.POI_Type,
      poi.Hex_ID_Ref,
      poi.Population,
      poi["Notoriety Tier"],
      poi.Lore,
      poi.DM_Journal
    ])) {
      if (poi.Hex_ID_Ref) {
        matchingPoiHexIds.add(poi.Hex_ID_Ref);
      }

      addSearchResult(
        "poi",
        poi.POI_ID,
        buildPoiListLabel(poi)
      );
    }
  });

  (db?.raw?.npcs || []).forEach(npc => {
    const home = npc.Home_ID_Ref ? db?.poisById?.[npc.Home_ID_Ref] : null;

    if (textMatches([
      npc.NPC_ID,
      npc.Name,
      npc.Title,
      npc.Race,
      npc.Organization,
      npc.Occupation,
      npc.Home_ID_Ref,
      getNpcHomeLabel(npc),
      npc.Lore,
      npc.DM_Journal
    ])) {
      if (home?.Hex_ID_Ref) {
        matchingNpcHexIds.add(home.Hex_ID_Ref);
      }

      addSearchResult(
        "npc",
        npc.NPC_ID,
        buildNpcListLabel(npc)
      );
    }
  });

  (db?.raw?.hexes || []).forEach(hex => {
    const directMatch = textMatches([
      hex.Hex_ID,
      hex.Terrain,
      hex.Region_ID_Ref,
      hex.DM_Journal
    ]);

    const regionMatch = matchingRegionIds.has(hex.Region_ID_Ref);
    const poiMatch = matchingPoiHexIds.has(hex.Hex_ID);
    const npcMatch = matchingNpcHexIds.has(hex.Hex_ID);

    if (directMatch || regionMatch || poiMatch || npcMatch) {
      const matchReasons = [
        regionMatch ? "Matching Region" : "",
        poiMatch ? "Matching POI" : "",
        npcMatch ? "Matching NPC" : ""
      ].filter(Boolean);

      const label = matchReasons.length
        ? joinCodexLabel(`Hex ${hex.Hex_ID}`, [
            hex.Terrain || "Unknown Terrain",
            ...matchReasons
          ])
        : buildHexListLabel(hex);

      addSearchResult("hex", hex.Hex_ID, label);
    }
  });

  const resultGroups = [
    { type: "hex", label: "Hexes" },
    { type: "region", label: "Regions" },
    { type: "poi", label: "POIs" },
    { type: "npc", label: "NPCs" }
  ];

  resultsEl.innerHTML = resultGroups
    .map(group => {
      const groupRows = results.filter(result => result.type === group.type);

      return `
        <section class="codex-search-result-panel">
          <h3 class="codex-search-result-heading">${escapeHtml(group.label)}</h3>

          <div class="codex-search-group-scroll codex-scroll-fade">
            ${renderCodexLinkedList(
              groupRows,
              `No matching ${group.label}.`,
              null,
              "id",
              row => row.label,
              row => row.type
            )}
          </div>
        </section>
      `;
    })
    .join("");
}
