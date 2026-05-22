let db = null;
let databaseLoadError = null;

function refreshOpenCodexAfterDatabaseLoad() {
  const overlay = document.getElementById("codex-overlay");
  const currentPage = codexHistory[codexHistory.length - 1];

  if (!overlay?.classList.contains("open") || !currentPage) {
    return;
  }

  renderCodexPage(currentPage.type, currentPage.id);
  updateCodexBackButton();
}

function initializeDatabaseLoad() {
  loadDatabase()
    .then(loadedDb => {
      if (!loadedDb) return;

      db = loadedDb;
      databaseLoadError = null;

      console.log("Database loaded:", db);
      window.dispatchEvent(new CustomEvent("campaign-database-loaded", { detail: { db } }));
      refreshOpenCodexAfterDatabaseLoad();
    })
    .catch(error => {
      databaseLoadError = error;

      console.error("Database failed to load:", error);
      refreshOpenCodexAfterDatabaseLoad();
    });
}

initializeDatabaseLoad();

window.addEventListener("campaign-authenticated", () => {
  setCampaignMainMapImage(getActiveCampaign?.());
  initializeDatabaseLoad();
});

const map = L.map("map", {
  crs: L.CRS.Simple,
  zoomControl: false,
  minZoom: -3,
  maxZoom: 0,
  maxBoundsViscosity: 0.5
});

const DEFAULT_CAMPAIGN_MAP_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6417' height='7575' viewBox='0 0 6417 7575'%3E%3Crect width='6417' height='7575' fill='transparent'/%3E%3C/svg%3E";
const DEFAULT_STATIC_MAP_WIDTH = 6417;
const DEFAULT_STATIC_MAP_HEIGHT = 7575;
const STATIC_MAP_MIN_ZOOM = -3;
const STATIC_MAP_MAX_ZOOM = 0;
const GENERATED_MAP_MIN_ZOOM = -2;
const GENERATED_MAP_MAX_ZOOM = Math.log2(1.25);
const GENERATED_MAP_MARGIN = 20;

let currentMapWidth = DEFAULT_STATIC_MAP_WIDTH;
let currentMapHeight = DEFAULT_STATIC_MAP_HEIGHT;
let currentMapBounds = [[0, 0], [currentMapHeight, currentMapWidth]];

const campaignMapOverlay = L.imageOverlay(DEFAULT_CAMPAIGN_MAP_IMAGE, currentMapBounds).addTo(map);
map.fitBounds(currentMapBounds);

function buildTransparentMapImage(width, height) {
  return "data:image/svg+xml," + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="transparent"/></svg>`
  );
}

function isGeneratedMapCampaign(campaign = getActiveCampaign?.()) {
  return campaign?.map_mode === "generated";
}

function getGeneratedMapConfig(campaign = getActiveCampaign?.()) {
  return campaign?.generated_map_config || {};
}

function getGeneratedGridConfig(campaign = getActiveCampaign?.()) {
  return getGeneratedMapConfig(campaign)?.grid || {};
}

function getGeneratedHexRadius(campaign = getActiveCampaign?.()) {
  return Number(getGeneratedMapConfig(campaign)?.editor?.hexRadius) || 42;
}

function getGeneratedMapDimensions(campaign = getActiveCampaign?.()) {
  const grid = getGeneratedGridConfig(campaign);
  const cols = Math.max(1, Number(grid.cols) || 50);
  const rows = Math.max(1, Number(grid.rows) || 50);
  const radius = getGeneratedHexRadius(campaign);
  const hexHeight = Math.sqrt(3) * radius;
  const lastCenterX = GENERATED_MAP_MARGIN + radius + ((cols - 1) * radius * 1.5);
  const lastCenterY = GENERATED_MAP_MARGIN + (hexHeight * 0.5) + ((rows - 1) * hexHeight) + ((cols - 1) % 2 ? hexHeight * 0.5 : 0);
  const width = Math.ceil(lastCenterX + (radius * 2) + 40);
  const height = Math.ceil(lastCenterY + hexHeight + 40);

  return { width, height, cols, rows, radius, hexHeight };
}

function setCurrentMapBounds(width, height) {
  currentMapWidth = width;
  currentMapHeight = height;
  currentMapBounds = [[0, 0], [currentMapHeight, currentMapWidth]];
  campaignMapOverlay.setBounds(currentMapBounds);
  updatePanBounds();
}

function setCampaignMainMapImage(campaign = null) {
  if (isGeneratedMapCampaign(campaign)) {
    const dimensions = getGeneratedMapDimensions(campaign);
    window.generatedMapRenderer?.beginLoading?.();
    map.options.zoomSnap = 0.25;
    map.options.zoomDelta = 0.25;
    map.setMinZoom(GENERATED_MAP_MIN_ZOOM);
    map.setMaxZoom(GENERATED_MAP_MAX_ZOOM);
    setCurrentMapBounds(dimensions.width, dimensions.height);
    campaignMapOverlay.setUrl(buildTransparentMapImage(dimensions.width, dimensions.height));
    map.fitBounds(currentMapBounds);
    return;
  }

  map.options.zoomSnap = 1;
  map.options.zoomDelta = 1;
  map.setMinZoom(STATIC_MAP_MIN_ZOOM);
  map.setMaxZoom(STATIC_MAP_MAX_ZOOM);
  const width = Number(campaign?.main_map_width) || DEFAULT_STATIC_MAP_WIDTH;
  const height = Number(campaign?.main_map_height) || DEFAULT_STATIC_MAP_HEIGHT;
  setCurrentMapBounds(width, height);

  const mapUrl = campaign?.mainMapUrl || DEFAULT_CAMPAIGN_MAP_IMAGE;
  campaignMapOverlay.setUrl(mapUrl);
}

function updatePanBounds() {
  if (isGeneratedMapCampaign()) {
    const padding = Math.max(160, getGeneratedHexRadius() * 3);
    map.setMaxBounds([
      [-padding, -padding],
      [currentMapHeight + padding, currentMapWidth + padding]
    ]);
    return;
  }

  const zoom = map.getZoom();
  const isMobile = window.innerWidth <= 768;

  let padding;

  if (isMobile) {
    padding = zoom < -2 ? 2600 : zoom < -1 ? 1100 : zoom < 0 ? 700 : 350;
  } else {
    padding = zoom < -2 ? 5200 : zoom < -1 ? 1700 : zoom < 0 ? 1100 : 600;
  }

  const rightPadding = isMobile
    ? padding
    : padding * 1.35;

  map.setMaxBounds([
    [-padding, -padding],
    [currentMapHeight + padding, currentMapWidth + rightPadding]
  ]);
}

map.on("zoomend", updatePanBounds);
map.on("load", updatePanBounds);
map.whenReady(updatePanBounds);
updatePanBounds();

const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

const centerX = (1.33 / 100) * DEFAULT_STATIC_MAP_WIDTH;
const centerY = DEFAULT_STATIC_MAP_HEIGHT - ((1 / 100) * DEFAULT_STATIC_MAP_HEIGHT);

const hexWidth = 82.25;
const hexHeight = 143.32;

const startX = centerX;
const startY = centerY;

const rowStepY = 150;
const colStepX = 255;
const oddColY = rowStepY / -2;
const oddColX = colStepX / 2;

let selectedHex = null;
let selectedHexId = null;
let codexHistory = [];
let codexSearchQuery = "";
let retroCodexMode = false;

const defaultStyle = {
  color: "#ffffff",
  weight: 4,
  opacity: 0.10,
  fillColor: "#ffffff",
  fillOpacity: 0.015,
  className: "hex-glow"
};

const hoverStyle = {
  opacity: 0.30,
  fillOpacity: 0.05,
  weight: 6
};

const selectedStyle = {
  opacity: 0.60,
  fillOpacity: 0.10,
  weight: 8
};

function makeHex(centerX, centerY, width, height) {
  return [
    [centerY, centerX + width],
    [centerY + height * 0.5, centerX + width * 0.5],
    [centerY + height * 0.5, centerX - width * 0.5],
    [centerY, centerX - width],
    [centerY - height * 0.5, centerX - width * 0.5],
    [centerY - height * 0.5, centerX + width * 0.5]
  ];
}

function getHexCenter(xxx, yyy) {
  const row = xxx - 300;
  const col = yyy - 300;
  const pair = Math.floor(col / 2);
  const odd = col % 2;

  const x = startX + (pair * colStepX) + (odd * oddColX);
  const y = startY - (row * rowStepY) + (odd * oddColY);

  return { x, y };
}

function parseMapHexId(hexId) {
  const match = String(hexId || "").trim().match(/^(-?\d+)\s*:\s*(-?\d+)$/);
  if (!match) return null;
  return { x: Number(match[1]), y: Number(match[2]) };
}

function getGeneratedHexCenter(x, y, campaign = getActiveCampaign?.()) {
  const dimensions = getGeneratedMapDimensions(campaign);
  const centerX = GENERATED_MAP_MARGIN + dimensions.radius + (x * dimensions.radius * 1.5);
  const mapperY = GENERATED_MAP_MARGIN + (dimensions.hexHeight * 0.5) + (y * dimensions.hexHeight) + (x % 2 ? dimensions.hexHeight * 0.5 : 0);
  const centerY = dimensions.height - mapperY;

  return { x: centerX, y: centerY };
}

function getMapHexCenter(hexId) {
  const parsed = parseMapHexId(hexId);
  if (!parsed) return { x: 0, y: 0 };

  if (isGeneratedMapCampaign()) {
    return getGeneratedHexCenter(parsed.x, parsed.y);
  }

  return getHexCenter(parsed.x, parsed.y);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeJsString(value) {
  return String(value ?? "")
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r");
}

function formatCodexNumber(value) {
  const cleanValue = String(value ?? "").trim();
  if (!cleanValue) return "";

  const numericValue = Number(cleanValue.replaceAll(",", ""));
  if (!Number.isFinite(numericValue)) return cleanValue;

  return new Intl.NumberFormat("en-US").format(numericValue);
}

function formatCodexPopulation(value) {
  return formatCodexNumber(value);
}

function getRowsByField(rows, fieldName, value) {
  if (!Array.isArray(rows)) return [];
  return rows.filter(row => row?.[fieldName] === value);
}

function getPoisForHex(hexId) {
  return db?.poisByHexId?.[hexId] || getRowsByField(db?.raw?.pois, "Hex_ID_Ref", hexId);
}

function getNpcsForPoi(poiId) {
  return db?.npcsByHomeId?.[poiId] || [];
}

function getNpcsForHex(hexId) {
  const pois = getPoisForHex(hexId);

  return pois.flatMap(poi => {
    return getNpcsForPoi(poi.POI_ID);
  });
}

function getHexCounts(hexId) {
  const pois = getPoisForHex(hexId);
  const npcCount = pois.reduce((total, poi) => {
    return total + getNpcsForPoi(poi.POI_ID).length;
  }, 0);

  return {
    poiCount: pois.length,
    npcCount
  };
}

function getDedupedPoiCount(pois) {
  const counted = new Set();

  pois.forEach(poi => {
    const groupId = poi.POI_Group_ID;
    counted.add(groupId ? `group:${groupId}` : `poi:${poi.POI_ID}`);
  });

  return counted.size;
}

function getRegionSummary(regionId) {
  const region = regionId ? db?.regionsById?.[regionId] : null;
  const regionField = region?.Region_Type === "political"
    ? "Political_Region_ID_Ref"
    : "Region_ID_Ref";
  const hexes = getRowsByField(db?.raw?.hexes, regionField, regionId);

  const pois = hexes.flatMap(hex => {
    return getPoisForHex(hex.Hex_ID);
  });

  const npcCount = pois.reduce((total, poi) => {
    return total + getNpcsForPoi(poi.POI_ID).length;
  }, 0);

  return {
    hexCount: hexes.length,
    poiCount: getDedupedPoiCount(pois),
    mappedAreaCount: pois.length,
    npcCount
  };
}

function buildCountLine(poiCount, npcCount) {
  return [
    poiCount > 0 ? `${poiCount} POI${poiCount !== 1 ? "s" : ""}` : "",
    npcCount > 0 ? `${npcCount} NPC${npcCount !== 1 ? "s" : ""}` : ""
  ].filter(Boolean).join(" • ");
}

function getLimitedLines(value, maxLines = 4, fallback = "No journal entries.") {
  const lines = String(value || fallback)
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  const limited = lines.slice(0, maxLines);

  if (lines.length > maxLines) {
    limited.push("...");
  }

  return limited.join("\n");
}

function renderMultilineText(value) {
  return escapeHtml(value).replaceAll("\n", "<br>");
}
