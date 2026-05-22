(function () {
  const TERRAIN_COLORS = {
    deep_sea: "#0b263a",
    sea: "#245f82",
    coastal_water: "#4a91ab",
    inland_water: "#79b8c8",
    beach: "#dbc487",
    plains: "#c1b06d",
    grassland: "#8fa75f",
    lush_grassland: "#4e7b45",
    wetland: "#3d6856",
    jungle_floor: "#27663c",
    desert: "#d4b36f",
    deep_desert: "#b88955",
    barrens: "#a56545",
    bleak_barrens: "#7d4335",
    snow: "#dce5e6",
    rock: "#756e66",
    wastes: "#453232"
  };
  const BASE_TERRAIN_OPTIONS = [
    ["feature_only", "Feature Only"],
    ["deep_sea", "Deep Sea"],
    ["sea", "Sea"],
    ["coastal_water", "Coastal Water"],
    ["inland_water", "Inland Water"],
    ["beach", "Beach"],
    ["plains", "Plains"],
    ["grassland", "Grassland"],
    ["lush_grassland", "Lush Grassland"],
    ["wetland", "Wetland"],
    ["jungle_floor", "Jungle Floor"],
    ["desert", "Desert"],
    ["deep_desert", "Deep Desert"],
    ["barrens", "Barrens"],
    ["bleak_barrens", "Bleak Barrens"],
    ["snow", "Snow"],
    ["rock", "Rock"],
    ["wastes", "Wastes"]
  ];
  const TERRAIN_FEATURE_LABELS = {
    woods: "Woods",
    forest: "Forest",
    jungle: "Jungle",
    shrub: "Shrub",
    cactus_scrub: "Cactus Scrub",
    marsh: "Marsh",
    kelp: "Kelp",
    ridges: "Ridges",
    mountains: "Mountains",
    snowcapped_mountains: "Snowcapped Mountains",
    cliffs: "Cliffs",
    lone_mountain: "Lone Mountain",
    volcano: "Volcano",
    reef: "Reef",
    shoals: "Shoals",
    water_rocks: "Water Rocks",
    rapids: "Rapids",
    falls: "Falls",
    whirlpool: "Whirlpool",
    farmland: "Farmland",
    sand: "Sand",
    waves: "Waves",
    ice: "Ice",
    mist: "Mist"
  };
  const VALID_FEATURES_BY_BASE = {
    deep_sea: ["waves", "mist", "kelp", "water_rocks", "whirlpool", "ice"],
    sea: ["waves", "mist", "reef", "shoals", "water_rocks", "kelp", "ice"],
    coastal_water: ["waves", "mist", "kelp", "water_rocks", "whirlpool", "ice"],
    inland_water: ["waves", "mist", "shoals", "water_rocks", "rapids", "falls", "marsh", "ice"],
    beach: ["sand", "ridges", "cliffs", "mist", "water_rocks"],
    plains: ["woods", "shrub", "ridges", "farmland", "lone_mountain", "mist"],
    grassland: ["woods", "forest", "shrub", "ridges", "farmland", "lone_mountain", "mist"],
    lush_grassland: ["woods", "forest", "shrub", "ridges", "farmland", "marsh", "mist"],
    wetland: ["woods", "forest", "marsh", "mist"],
    jungle_floor: ["jungle", "ridges", "mist"],
    desert: ["sand", "ridges", "cactus_scrub", "cliffs", "lone_mountain", "mist"],
    deep_desert: ["sand", "ridges", "cactus_scrub", "cliffs", "lone_mountain", "mist"],
    barrens: ["shrub", "ridges", "cliffs", "lone_mountain", "mist"],
    bleak_barrens: ["shrub", "ridges", "cliffs", "lone_mountain", "mist"],
    snow: ["ridges", "mountains", "snowcapped_mountains", "woods", "forest", "ice", "mist"],
    rock: ["ridges", "mountains", "woods", "forest", "cliffs", "lone_mountain", "volcano", "mist"],
    wastes: ["ridges", "cliffs", "lone_mountain", "volcano", "mist"]
  };
  const BASE_ELEVATION = {
    deep_sea: -3,
    sea: -2,
    coastal_water: -1,
    inland_water: 0,
    beach: 0,
    wetland: 0,
    plains: 1,
    grassland: 1,
    lush_grassland: 1,
    jungle_floor: 1,
    desert: 1,
    deep_desert: 1,
    barrens: 1,
    bleak_barrens: 2,
    wastes: 2,
    snow: 2,
    rock: 3
  };
  const FEATURE_ELEVATION_MODIFIERS = {
    ridges: 1,
    cliffs: 1,
    mountains: 2,
    snowcapped_mountains: 2,
    lone_mountain: 2,
    volcano: 2,
    reef: 0,
    shoals: 0,
    water_rocks: 0,
    rapids: 0,
    falls: 0
  };

  const MIN_ZOOM = 0.25;
  const MAX_ZOOM = 1.25;
  const ZOOM_STEPS = [0.25, 0.5, 0.85, 1.25];
  const REGION_LABEL_REFERENCE_ZOOM = 0.85;
  const COORD_LABEL_MIN_ZOOM = 0.6;
  const PAN_PADDING_RATIO = 0.45;
  const TERRAIN_CACHE_SCALE = 1.5;
  const FEATURE_IMAGE_SUPERSAMPLE = 3;
  const BULK_OVERLAY_LOADING_THRESHOLD = 10;
  const FEATURE_ASSET_PATH = "hex-mapper/assets/features/";
  const EDGE_NAMES = ["E", "SE", "SW", "W", "NW", "NE"];
  const UNCLAIMED_REGION_REF = "REG-0000";
  const DRAWABLE_OVERLAY_TYPES = new Set(["road", "river", "path", "wall", "region", "unregion", "political-region", "clear-political-region", "erase", "terrain", "terrain-eyedropper"]);
  const REGION_PAINT_TYPES = new Set(["region", "unregion", "political-region", "clear-political-region"]);
  const PATH_OVERLAY_TYPES = new Set(["road", "river", "path"]);
  const ALL_TERRAIN_FEATURES = Object.keys(TERRAIN_FEATURE_LABELS);
  const EXCLUSIVE_TERRAIN_FEATURE_GROUPS = [
    ["mountains", "snowcapped_mountains", "lone_mountain", "volcano"],
    ["woods", "forest"]
  ];
  const ROAD_STYLE_COLORS = {
    dark_brown: "#5b351c",
    tan: "#c99a5c"
  };
  const RIVER_WATER_TERRAINS = new Set(["deep_sea", "sea", "coastal_water", "inland_water"]);
  const REGION_BORDER_COLORS = {
    red: "#ff2d2d",
    blue: "#1f7cff",
    yellow: "#ffe600",
    green: "#39ff14",
    orange: "#ff8a00",
    purple: "#bf4dff",
    black: "#070707",
    white: "#ffffff",
    brown: "#d9782d",
    gold: "#ffd84d"
  };
  const EVEN_Q_NEIGHBORS = {
    E: [1, 0],
    SE: [0, 1],
    SW: [-1, 0],
    W: [-1, -1],
    NW: [0, -1],
    NE: [1, -1]
  };
  const ODD_Q_NEIGHBORS = {
    E: [1, 1],
    SE: [0, 1],
    SW: [-1, 1],
    W: [-1, 0],
    NW: [0, -1],
    NE: [1, 0]
  };
  const WATER_TERRAINS = new Set(["deep_sea", "sea", "coastal_water", "inland_water"]);
  const LAND_TERRAINS = new Set(["beach", "plains", "grassland", "lush_grassland", "wetland", "jungle_floor", "desert", "deep_desert", "barrens", "bleak_barrens", "snow", "rock", "wastes"]);
  const HIGHLAND_TERRAINS = new Set(["rock", "snow"]);
  const COLD_TERRAINS = new Set(["snow"]);
  const HUMID_TERRAINS = new Set(["wetland", "lush_grassland", "jungle_floor"]);
  const FEATURE_ART_FILES = {
    cactus_scrub: "cactus_scrub.svg",
    cliffs: "cliffs.svg",
    reef: "coral.svg",
    falls: "falls.svg",
    farmland: "farmland.svg",
    ice: "ice.svg",
    kelp: "kelp.svg",
    lone_mountain: "lone_mountain.svg",
    marsh: "marsh.svg",
    mist: "mist.svg",
    mountains: "mountains.svg",
    snowcapped_mountains: "mountains_snow.svg",
    mountains_snow: "mountains_snow.svg",
    rapids: "rapids.svg",
    ridges: "ridges.svg",
    sand: "sand.svg",
    shoals: "shoals.svg",
    shrub: "shrub.svg",
    volcano: "volcano.svg",
    water_rocks: "water_rocks.svg",
    waves: "waves.svg",
    whirlpool: "whirlpool.svg"
  };
  const FEATURE_LAYER_BY_ID = {
    farmland: 10,
    sand: 10,
    waves: 10,
    shoals: 10,
    reef: 10,
    kelp: 10,
    ice: 20,
    ridges: 30,
    cliffs: 35,
    water_rocks: 35,
    lone_mountain: 40,
    mountains: 40,
    snowcapped_mountains: 40,
    volcano: 45,
    rapids: 60,
    falls: 60,
    whirlpool: 60,
    shrub: 80,
    cactus_scrub: 80,
    woods: 80,
    forest: 80,
    jungle: 80,
    marsh: 80,
    mist: 90
  };
  const FEATURE_ART_OPACITY = {
    farmland: 0.64,
    waves: 0.62,
    shoals: 0.60,
    reef: 0.60,
    kelp: 0.60,
    ice: 0.84,
    marsh: 0.64,
    ridges: 0.70,
    cliffs: 0.70,
    water_rocks: 0.70,
    lone_mountain: 0.72,
    mountains: 0.72,
    volcano: 0.78,
    shrub: 0.66,
    cactus_scrub: 0.68,
    woods: 0.70,
    forest: 0.70,
    jungle: 0.72,
    rapids: 0.66,
    falls: 0.70,
    whirlpool: 0.70,
    mist: 0.24
  };
  const BASE_FEATURE_TINTS = {
    deep_sea: { vegetation: "#7fb2c8", relief: "#6fa4b8", water: "#8eb8c8", surface: "#8eb8c8" },
    sea: { vegetation: "#1f5a45", relief: "#6f8790", water: "#8eb8c8", surface: "#8eb8c8" },
    coastal_water: { vegetation: "#1f5a45", relief: "#58747a", water: "#103f56", surface: "#103f56" },
    inland_water: { vegetation: "#245a45", relief: "#526a70", water: "#103f56", surface: "#103f56" },
    beach: { vegetation: "#6a6535", relief: "#735336", surface: "#7b6a48" },
    plains: { vegetation: "#3f5a32", relief: "#6f6336", surface: "#6f6336" },
    grassland: { vegetation: "#2f4f2f", relief: "#5d5638", surface: "#6f6336" },
    lush_grassland: { vegetation: "#255235", relief: "#465638", surface: "#496b3b" },
    wetland: { vegetation: "#234d43", relief: "#3f534a", surface: "#2f6254" },
    jungle_floor: { vegetation: "#155c38", relief: "#244a35", surface: "#1f5a45" },
    desert: { vegetation: "#5f6134", relief: "#735336", surface: "#8a693d" },
    deep_desert: { vegetation: "#5a5430", relief: "#68472f", surface: "#7b5636" },
    barrens: { vegetation: "#5b5a35", relief: "#6a4435", surface: "#754c3a" },
    bleak_barrens: { vegetation: "#514b34", relief: "#56352f", surface: "#664039" },
    snow: { vegetation: "#203f35", relief: "#68777c", surface: "#d8eef2" },
    rock: { vegetation: "#203f35", relief: "#4d463d", surface: "#5b5147" },
    wastes: { vegetation: "#40382f", relief: "#2b2020", surface: "#4b3030" }
  };
  const FEATURE_ART_ASSET_FILES = [...new Set([
    ...Object.values(FEATURE_ART_FILES),
    "forest_con.svg",
    "forest_dec.svg",
    "woods_con.svg",
    "woods_dec.svg",
    "jungle_temp_1.svg",
    "jungle_temp_2.svg",
    "jungle_trop_1.svg",
    "jungle_trop_2.svg"
  ])];
  const POI_GLYPHS = {
    settlement: "●",
    city: "◎",
    town: "●",
    village: "●",
    farm: "▦",
    castle: "♜",
    ruins: "✦",
    ruin: "✦",
    dungeon: "◆",
    lair: "▲",
    camp: "♢"
  };

  const renderer = {
    root: null,
    canvas: null,
    ctx: null,
    cacheCanvas: document.createElement("canvas"),
    cacheCtx: null,
    cacheDirty: true,
    featureAssets: new Map(),
    featureImages: new Map(),
    featureAssetsLoading: null,
    poiHexIds: new Set(),
    poisByHexId: new Map(),
    mapOverlays: [],
    svg: null,
    popup: null,
    hexes: [],
    hexesByCoord: new Map(),
    hoveredHexId: null,
    selectedHexId: null,
    view: {
      zoom: 1,
      panX: 0,
      panY: 0,
      width: 1,
      height: 1,
      dragging: false,
      dragMoved: false,
      lastX: 0,
      lastY: 0,
      zoomAnimationFrame: null,
      animatingZoom: false,
      wheelLockedUntil: 0,
      touchPointers: new Map(),
      pinching: false,
      pinchStartDistance: 0,
      pinchStartZoom: 1,
      pinchAnchorWorldX: 0,
      pinchAnchorWorldY: 0,
      suppressClickUntil: 0
    },
    drawing: {
      enabled: false,
      tool: "road",
      roadStyle: "dark_brown",
      regionId: UNCLAIMED_REGION_REF,
      politicalRegionId: "",
      terrainBase: "plains",
      terrainFeatures: [],
      terrainElevation: "auto",
      undoStack: [],
      redoStack: [],
      visibleOverlays: {
        road: true,
        river: true,
        path: true,
        wall: true,
        geographic: false,
        political: true,
        geographicLabels: true,
        politicalLabels: true,
        features: true,
        pois: true
      },
      preEditVisibleOverlays: null,
      lastHexId: null,
      dragLastHexId: null,
      paintedThisDrag: new Set(),
      saving: false,
      hoverEdge: null
    }
  };

  function ensureMounted() {
    const mapElement = document.getElementById("map");
    if (!mapElement) return false;

    if (renderer.root?.isConnected) return true;

    renderer.root = document.createElement("div");
    renderer.root.id = "generated-map-renderer";
    renderer.root.innerHTML = `
      <canvas class="generated-map-terrain-canvas"></canvas>
      <svg class="generated-map-grid-overlay" aria-hidden="true"></svg>
      <div class="generated-map-popup" hidden></div>
      <div class="generated-map-loading-veil" hidden>
        <div class="generated-map-loading-message">Map Loading...</div>
      </div>
    `;

    renderer.canvas = renderer.root.querySelector("canvas");
    renderer.ctx = renderer.canvas.getContext("2d");
    renderer.cacheCtx = renderer.cacheCanvas.getContext("2d");
    renderer.svg = renderer.root.querySelector("svg");
    renderer.popup = renderer.root.querySelector(".generated-map-popup");
    ["click", "pointerdown", "pointermove", "pointerup", "wheel"].forEach(eventName => {
      renderer.popup.addEventListener(eventName, event => event.stopPropagation());
    });

    renderer.root.addEventListener("wheel", handleWheel, { passive: false });
    renderer.root.addEventListener("pointerdown", handlePointerDown);
    renderer.root.addEventListener("pointermove", handlePointerMove);
    renderer.root.addEventListener("pointerup", handlePointerUp);
    renderer.root.addEventListener("pointercancel", handlePointerCancel);
    renderer.root.addEventListener("click", handleClick);
    renderer.root.addEventListener("contextmenu", event => event.preventDefault());
    setupDrawControls();
    window.addEventListener("resize", () => {
      if (!isActive()) return;
      clampView();
      render();
    });

    mapElement.appendChild(renderer.root);
    return true;
  }

  function setLoading(isLoading) {
    const veil = renderer.root?.querySelector(".generated-map-loading-veil");
    if (!veil) return;
    veil.hidden = !isLoading;
  }

  function beginLoading() {
    setActive(true);
    setLoading(true);
  }

  function setActive(active) {
    if (!ensureMounted()) return;
    renderer.root.hidden = !active;
    document.getElementById("map")?.classList.toggle("generated-renderer-active", active);
    updateDrawControlsVisibility();
  }

  function isActive() {
    return Boolean(renderer.root && !renderer.root.hidden && isGeneratedMapCampaign?.());
  }

  function getHexId(hexRecord) {
    return hexRecord?.Map_XY || hexRecord?.Hex_ID || "";
  }

  function buildHexModel(hexRecord) {
    const parsed = parseMapHexId(getHexId(hexRecord));
    if (!parsed) return null;

    const dimensions = getGeneratedMapDimensions();
    const center = getPrototypeHexCenter(parsed.x, parsed.y, dimensions);
    const points = makeWorldHex(center.x, center.y, dimensions.radius, dimensions.hexHeight);

    return {
      record: hexRecord,
      id: hexRecord.Hex_ID,
      label: getHexId(hexRecord),
      x: parsed.x,
      y: parsed.y,
      baseTerrain: hexRecord.Base_Terrain,
      features: Array.isArray(hexRecord.Terrain_Features) ? hexRecord.Terrain_Features : [],
      regionId: hexRecord.Region_ID_Ref || "",
      politicalRegionId: hexRecord.Political_Region_ID_Ref || "",
      elevation: getHexElevation(hexRecord),
      center,
      points,
      fill: TERRAIN_COLORS[hexRecord.Base_Terrain] || "#7f7a66"
    };
  }

  function getHexElevation(hexRecord) {
    const stored = Number(hexRecord?.Elevation);
    return Number.isFinite(stored) ? stored : 0;
  }

  function groupPoisByHexId(pois) {
    const groups = new Map();
    pois.forEach(poi => {
      const hexId = poi.Hex_ID_Ref;
      if (!hexId) return;
      if (!groups.has(hexId)) groups.set(hexId, []);
      groups.get(hexId).push(poi);
    });
    return groups;
  }

  function getPrototypeHexCenter(x, y, dimensions) {
    return {
      x: 20 + dimensions.radius + (x * dimensions.radius * 1.5),
      y: 20 + (dimensions.hexHeight * 0.5) + (y * dimensions.hexHeight) + (x % 2 ? dimensions.hexHeight * 0.5 : 0)
    };
  }

  function makeWorldHex(centerX, centerY, radius, hexHeight) {
    return [
      { x: centerX + radius, y: centerY },
      { x: centerX + radius * 0.5, y: centerY + hexHeight * 0.5 },
      { x: centerX - radius * 0.5, y: centerY + hexHeight * 0.5 },
      { x: centerX - radius, y: centerY },
      { x: centerX - radius * 0.5, y: centerY - hexHeight * 0.5 },
      { x: centerX + radius * 0.5, y: centerY - hexHeight * 0.5 }
    ];
  }

  function renderFromDatabase() {
    if (!isGeneratedMapCampaign?.()) {
      setActive(false);
      return;
    }

    setActive(true);
    const dimensions = getGeneratedMapDimensions();
    renderer.view.width = dimensions.width;
    renderer.view.height = dimensions.height;
    renderer.hexes = (db?.raw?.hexes || []).map(buildHexModel).filter(Boolean);
    renderer.hexesByCoord = new Map(renderer.hexes.map(hex => [`${hex.x}:${hex.y}`, hex]));
    renderer.poisByHexId = groupPoisByHexId(db?.raw?.pois || []);
    renderer.poiHexIds = new Set(renderer.poisByHexId.keys());
    renderer.mapOverlays = db?.raw?.generatedMapOverlays || [];
    renderer.cacheDirty = true;
    setLoading(true);
    populateDrawRegionSelect();
    updateDrawControlsVisibility();
    loadFeatureArtAssets();
    fitViewToMap();
    render();
  }

  function refreshPoiLayerFromDatabase() {
    if (!isActive()) return;

    renderer.poisByHexId = groupPoisByHexId(db?.raw?.pois || []);
    renderer.poiHexIds = new Set(renderer.poisByHexId.keys());
    renderSvgOnly();
  }

  function refreshRegionLayerFromDatabase() {
    if (!isActive()) return;
    syncRenderedHexRegionsFromDatabase();
    populateDrawRegionSelect();
    renderSvgOnly();
  }

  function syncRenderedHexRegionsFromDatabase() {
    renderer.hexes.forEach(hex => {
      const source = db?.hexesById?.[hex.id];
      if (!source) return;
      hex.regionId = source.Region_ID_Ref || "";
      hex.politicalRegionId = source.Political_Region_ID_Ref || "";
      if (hex.record) {
        hex.record.Region_ID_Ref = hex.regionId;
        hex.record.Political_Region_ID_Ref = hex.politicalRegionId;
      }
    });
  }

  function refreshOverlayLayerFromDatabase() {
    if (!isActive()) return;
    renderer.mapOverlays = db?.raw?.generatedMapOverlays || [];
    renderer.cacheDirty = true;
    render();
  }

  function setupDrawControls() {
    const button = document.getElementById("map-draw-button");
    const panel = document.getElementById("map-draw-panel");
    const viewButton = document.getElementById("map-view-button");
    const viewPanel = document.getElementById("map-view-panel");
    const roadStyle = document.getElementById("map-draw-road-style");
    const regionSelect = document.getElementById("map-draw-region-select");
    const politicalRegionSelect = document.getElementById("map-draw-political-region-select");
    const undoButton = document.getElementById("map-draw-undo");
    const redoButton = document.getElementById("map-draw-redo");
    const clearButton = document.getElementById("map-draw-clear");
    const closeEditButton = document.getElementById("map-edit-close-button");
    const closeViewButton = document.getElementById("map-view-close-button");
    const collapseEditButton = document.getElementById("map-edit-collapse-button");
    const terrainElevationInput = document.getElementById("map-terrain-elevation");
    if (!button || !panel) return;

    viewButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const isOpening = viewPanel?.hidden;
      if (viewPanel) viewPanel.hidden = !isOpening;
      viewButton.classList.toggle("active", Boolean(isOpening));
      if (isOpening) {
        panel.hidden = true;
        button.classList.remove("active");
        renderer.drawing.enabled = false;
        restoreMapEditViewState();
        updateMapChromeForEdit(false);
        resetDrawingState();
        render();
      }
    });

    viewPanel?.addEventListener("click", event => event.stopPropagation());
    closeViewButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      if (viewPanel) viewPanel.hidden = true;
      viewButton?.classList.remove("active");
    });

    collapseEditButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const isCollapsed = panel.classList.toggle("map-edit-left-collapsed");
      collapseEditButton.textContent = isCollapsed ? "Expand" : "Collapse";
      collapseEditButton.setAttribute("aria-expanded", String(!isCollapsed));
    });

    closeEditButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      closeMapEditMode();
      render();
    });

    button.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      const isOpening = panel.hidden;
      panel.hidden = !isOpening;
      button.classList.toggle("active", isOpening);
      renderer.drawing.enabled = isOpening;
      updateMapChromeForEdit(isOpening);
      if (isOpening) {
        if (viewPanel) viewPanel.hidden = true;
        viewButton?.classList.remove("active");
        enterMapEditMode();
      }
      if (!isOpening) {
        restoreMapEditViewState();
        resetDrawingState();
      }
      updateDrawToolButtons();
      updateDrawRegionControls();
      updateDrawStyleControls();
      updateDrawHint();
      render();
    });

    panel.addEventListener("click", event => event.stopPropagation());
    panel.querySelectorAll("[data-map-edit-section-button]").forEach(sectionButton => {
      sectionButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setMapEditSection(sectionButton.dataset.mapEditSectionButton || "overlay");
      });
    });

    panel.querySelectorAll("[data-map-draw-tool]").forEach(toolButton => {
      toolButton.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setDrawTool(toolButton.dataset.mapDrawTool);
      });
    });

    document.querySelectorAll("[data-map-overlay-toggle]").forEach(toggle => {
      toggle.addEventListener("change", () => {
        const type = toggle.dataset.mapOverlayToggle;
        if (!type || !(type in renderer.drawing.visibleOverlays)) return;
        renderer.drawing.visibleOverlays[type] = toggle.checked;
        syncMapOverlayToggleInputs();
        renderer.cacheDirty = true;
        render();
      });
    });

    roadStyle?.addEventListener("change", () => {
      renderer.drawing.roadStyle = roadStyle.value || "dark_brown";
    });

    terrainElevationInput?.addEventListener("change", () => {
      if (terrainElevationInput.value === "auto") {
        renderer.drawing.terrainElevation = "auto";
        return;
      }
      const elevation = Number(terrainElevationInput.value);
      renderer.drawing.terrainElevation = Number.isFinite(elevation) ? Math.round(elevation) : 0;
      terrainElevationInput.value = String(renderer.drawing.terrainElevation);
    });

    regionSelect?.addEventListener("change", () => {
      renderer.drawing.regionId = regionSelect.value || UNCLAIMED_REGION_REF;
    });

    politicalRegionSelect?.addEventListener("change", () => {
      renderer.drawing.politicalRegionId = politicalRegionSelect.value || "";
    });

    undoButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      undoLastDrawAction();
    });

    redoButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      redoLastDrawAction();
    });

    document.addEventListener("keydown", event => {
      if (!renderer.drawing.enabled || renderer.drawing.saving) return;
      if (!event.ctrlKey || event.altKey || event.metaKey) return;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(event.target?.tagName)) return;

      const key = event.key.toLowerCase();
      if (key === "z") {
        event.preventDefault();
        undoLastDrawAction();
      } else if (key === "y") {
        event.preventDefault();
        redoLastDrawAction();
      }
    });

    clearButton?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      clearAllDrawnOverlays();
    });

    updateDrawToolButtons();
    populateDrawRegionSelect();
    updateDrawRegionControls();
    updateDrawStyleControls();
    updateDrawUndoButton();
    updateDrawRedoButton();
    updateDrawClearButton();
    syncMapOverlayToggleInputs();
    populateTerrainControls();
    updateDrawControlsVisibility();
  }

  function closeMapEditMode() {
    const button = document.getElementById("map-draw-button");
    const panel = document.getElementById("map-draw-panel");
    const viewPanel = document.getElementById("map-view-panel");
    if (panel) panel.hidden = true;
    if (viewPanel) viewPanel.hidden = true;
    panel?.classList.remove("map-edit-left-collapsed");
    const collapseEditButton = document.getElementById("map-edit-collapse-button");
    if (collapseEditButton) {
      collapseEditButton.textContent = "Collapse";
      collapseEditButton.setAttribute("aria-expanded", "true");
    }
    button?.classList.remove("active");
    renderer.drawing.enabled = false;
    restoreMapEditViewState();
    updateMapChromeForEdit(false);
    resetDrawingState();
  }

  function setMapEditSection(section) {
    const normalized = ["view", "terrain", "overlay", "regions", "generation"].includes(section) ? section : "overlay";
    renderer.drawing.tool = "";
    resetDrawingState();
    document.querySelectorAll("[data-map-edit-section]").forEach(sectionPane => {
      sectionPane.classList.toggle("active", sectionPane.dataset.mapEditSection === normalized);
    });
    document.querySelectorAll("[data-map-edit-section-button]").forEach(sectionButton => {
      sectionButton.classList.toggle("active", sectionButton.dataset.mapEditSectionButton === normalized);
    });
    updateDrawToolButtons();
    updateDrawRegionControls();
    updateDrawStyleControls();
  }

  function updateMapChromeForEdit(isEditing) {
    const canView = isActive();
    const canDraw = canCurrentUserShapeWorld();
    document.getElementById("codex-button")?.toggleAttribute("hidden", Boolean(isEditing));
    document.getElementById("map-reset-button")?.toggleAttribute("hidden", Boolean(isEditing));
    document.getElementById("map-view-button")?.toggleAttribute("hidden", Boolean(isEditing || !canView));
    document.getElementById("map-draw-button")?.toggleAttribute("hidden", Boolean(isEditing || !canDraw));
  }

  function canCurrentUserShapeWorld() {
    return isActive() && ["owner", "superuser"].includes(getActiveCampaign?.()?.currentUserRole || "");
  }

  function syncMapOverlayToggleInputs() {
    document.querySelectorAll("[data-map-overlay-toggle]").forEach(toggle => {
      const type = toggle.dataset.mapOverlayToggle;
      if (!type || !(type in renderer.drawing.visibleOverlays)) return;
      toggle.checked = Boolean(renderer.drawing.visibleOverlays[type]);
    });
  }

  function enterMapEditMode() {
    if (!renderer.drawing.preEditVisibleOverlays) {
      renderer.drawing.preEditVisibleOverlays = { ...renderer.drawing.visibleOverlays };
    }

    Object.keys(renderer.drawing.visibleOverlays).forEach(type => {
      renderer.drawing.visibleOverlays[type] = true;
    });
    syncMapOverlayToggleInputs();
    renderer.cacheDirty = true;
  }

  function restoreMapEditViewState() {
    if (!renderer.drawing.preEditVisibleOverlays) return;

    renderer.drawing.visibleOverlays = { ...renderer.drawing.preEditVisibleOverlays };
    renderer.drawing.preEditVisibleOverlays = null;
    syncMapOverlayToggleInputs();
    renderer.cacheDirty = true;
  }

  function updateDrawControlsVisibility() {
    const viewButton = document.getElementById("map-view-button");
    const viewPanel = document.getElementById("map-view-panel");
    const button = document.getElementById("map-draw-button");
    const panel = document.getElementById("map-draw-panel");
    const canView = isActive();
    const canDraw = canCurrentUserShapeWorld();

    if (viewButton) viewButton.hidden = !canView;
    if (!canView) {
      if (viewPanel) viewPanel.hidden = true;
      viewButton?.classList.remove("active");
    }

    if (button) button.hidden = !canDraw;
    if (!canDraw) {
      if (panel) panel.hidden = true;
      renderer.drawing.enabled = false;
      button?.classList.remove("active");
      restoreMapEditViewState();
      updateMapChromeForEdit(false);
      resetDrawingState();
    }
    updateDrawUndoButton();
    updateDrawRedoButton();
    updateDrawClearButton();
  }

  function setDrawTool(tool) {
    if (!DRAWABLE_OVERLAY_TYPES.has(tool)) return;
    renderer.drawing.tool = tool;
    resetDrawingState();
    updateDrawToolButtons();
    updateDrawRegionControls();
    updateDrawStyleControls();
    updateDrawHint();
    renderSvgOnly();
  }

  function resetDrawingState() {
    renderer.drawing.lastHexId = null;
    renderer.drawing.dragLastHexId = null;
    renderer.drawing.paintedThisDrag = new Set();
    renderer.drawing.hoverEdge = null;
  }

  function updateDrawToolButtons() {
    document.querySelectorAll("[data-map-draw-tool]").forEach(button => {
      button.classList.toggle("active", button.dataset.mapDrawTool === renderer.drawing.tool);
    });
  }

  function updateDrawRegionControls() {
    const row = document.querySelector(".map-draw-region-row");
    const politicalRow = document.querySelector(".map-draw-political-region-row");
    if (row) row.hidden = renderer.drawing.tool !== "region";
    if (politicalRow) politicalRow.hidden = renderer.drawing.tool !== "political-region";
  }

  function updateDrawStyleControls() {
    const styleRow = document.querySelector(".map-draw-style-row");
    if (styleRow) styleRow.hidden = !["road", "path"].includes(renderer.drawing.tool);
  }

  function populateDrawRegionSelect() {
    const select = document.getElementById("map-draw-region-select");
    const politicalSelect = document.getElementById("map-draw-political-region-select");

    populateRegionSelect(select, "geographic", UNCLAIMED_REGION_REF, "regionId");
    populateRegionSelect(politicalSelect, "political", "", "politicalRegionId");
  }

  function populateRegionSelect(select, regionType, excludedRegionId, drawingKey) {
    if (!select) return;

    const regions = (db?.raw?.regions || [])
      .filter(region => (region.Region_Type || "geographic") === regionType)
      .filter(region => !excludedRegionId || region.Region_ID !== excludedRegionId)
      .sort((a, b) => {
        return String(a.Region_Name || a.Region_ID).localeCompare(String(b.Region_Name || b.Region_ID), undefined, {
          numeric: true,
          sensitivity: "base"
        });
      });

    const currentValue = renderer.drawing[drawingKey] || select.value || "";
    select.innerHTML = regions.map(region => {
      const value = escapeHtml(region.Region_ID || "");
      const label = escapeHtml(region.Region_Name || region.Region_ID || "Unnamed Region");
      return `<option value="${value}">${label}</option>`;
    }).join("");

    if (!regions.length) {
      select.innerHTML = `<option value="">No ${regionType} regions</option>`;
      renderer.drawing[drawingKey] = "";
      return;
    }

    select.value = regions.some(region => region.Region_ID === currentValue)
      ? currentValue
      : regions[0]?.Region_ID || "";
    renderer.drawing[drawingKey] = select.value || "";
  }

  function populateTerrainControls() {
    const baseContainer = document.getElementById("map-terrain-base-options");
    if (!baseContainer) return;

    baseContainer.innerHTML = BASE_TERRAIN_OPTIONS.map(([base, label]) => `
      <button class="map-terrain-base-option" type="button" data-map-terrain-base="${escapeHtml(base)}">
        <span class="map-terrain-swatch" style="background:${escapeHtml(TERRAIN_COLORS[base] || "#7f7a66")}"></span>
        <span class="map-terrain-label">${escapeHtml(label)}</span>
      </button>
    `).join("");

    baseContainer.querySelectorAll("[data-map-terrain-base]").forEach(button => {
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        setTerrainBase(button.dataset.mapTerrainBase || "plains");
      });
    });

    updateTerrainControls();
  }

  function setTerrainBase(baseTerrain) {
    if (baseTerrain !== "feature_only" && !TERRAIN_COLORS[baseTerrain]) return;
    renderer.drawing.terrainBase = baseTerrain;
    const validFeatures = new Set(getValidFeaturesForTerrainSelection(baseTerrain));
    renderer.drawing.terrainFeatures = normalizeTerrainFeatureSelection(renderer.drawing.terrainFeatures)
      .filter(feature => validFeatures.has(feature))
      .slice(0, 3);
    updateTerrainControls();
  }

  function updateTerrainControls() {
    document.querySelectorAll("[data-map-terrain-base]").forEach(button => {
      button.classList.toggle("active", button.dataset.mapTerrainBase === renderer.drawing.terrainBase);
    });

    const featureContainer = document.getElementById("map-terrain-feature-options");
    if (featureContainer) {
      const validFeatures = getValidFeaturesForTerrainSelection(renderer.drawing.terrainBase);
      if (!validFeatures.length) {
        featureContainer.innerHTML = `<p class="map-edit-empty-note">No features for this base terrain.</p>`;
      } else {
        featureContainer.innerHTML = validFeatures.map(feature => `
          <label class="map-terrain-feature-option">
            <input type="checkbox" value="${escapeHtml(feature)}" ${renderer.drawing.terrainFeatures.includes(feature) ? "checked" : ""}>
            <span>${escapeHtml(TERRAIN_FEATURE_LABELS[feature] || feature)}</span>
          </label>
        `).join("");
      }

      featureContainer.querySelectorAll("input[type='checkbox']").forEach(input => {
        input.addEventListener("change", () => {
          const selected = [...featureContainer.querySelectorAll("input[type='checkbox']:checked")]
            .map(checkbox => checkbox.value)
            .filter(Boolean);
          const normalizedSelected = normalizeTerrainFeatureSelection(selected, input.checked ? input.value : "");
          if (normalizedSelected.length > 3) {
            input.checked = false;
            renderer.drawing.terrainFeatures = normalizeTerrainFeatureSelection(
              normalizedSelected.filter(feature => feature !== input.value),
              ""
            ).slice(0, 3);
            updateTerrainControls();
            return;
          }
          renderer.drawing.terrainFeatures = normalizedSelected;
          updateTerrainControls();
        });
      });
    }

    const elevationInput = document.getElementById("map-terrain-elevation");
    if (elevationInput) elevationInput.value = String(renderer.drawing.terrainElevation);
  }

  function getAutoTerrainElevation(baseTerrain, features = []) {
    return (BASE_ELEVATION[baseTerrain] ?? 1) + getFeatureElevationModifier(features);
  }

  function getFeatureElevationModifier(features = []) {
    return Math.max(0, ...(features || []).map(feature => FEATURE_ELEVATION_MODIFIERS[feature] || 0));
  }

  function getValidFeaturesForTerrainSelection(baseTerrain) {
    return baseTerrain === "feature_only"
      ? ALL_TERRAIN_FEATURES
      : VALID_FEATURES_BY_BASE[baseTerrain] || [];
  }

  function normalizeTerrainFeatureSelection(features = [], preferredFeature = "") {
    let normalized = [...new Set(features || [])].filter(feature => TERRAIN_FEATURE_LABELS[feature]);

    EXCLUSIVE_TERRAIN_FEATURE_GROUPS.forEach(group => {
      const selectedGroupFeatures = normalized.filter(feature => group.includes(feature));
      if (selectedGroupFeatures.length <= 1) return;

      const keepFeature = group.includes(preferredFeature)
        ? preferredFeature
        : selectedGroupFeatures[0];
      normalized = normalized.filter(feature => !group.includes(feature) || feature === keepFeature);
    });

    return normalized.slice(0, 3);
  }

  function updateDrawHint() {
    const hint = document.getElementById("map-draw-hint");
    if (!hint) return;
    hint.textContent = "Right-drag or middle-drag pans. Ctrl+Z undoes, Ctrl+Y redoes.";
  }

  function updateDrawUndoButton() {
    const undoButton = document.getElementById("map-draw-undo");
    if (!undoButton) return;
    undoButton.disabled = renderer.drawing.undoStack.length === 0 || renderer.drawing.saving;
    undoButton.textContent = renderer.drawing.undoStack.length
      ? `Undo (${renderer.drawing.undoStack.length})`
      : "Undo";
  }

  function updateDrawRedoButton() {
    const redoButton = document.getElementById("map-draw-redo");
    if (!redoButton) return;
    redoButton.disabled = renderer.drawing.redoStack.length === 0 || renderer.drawing.saving;
    redoButton.textContent = renderer.drawing.redoStack.length
      ? `Redo (${renderer.drawing.redoStack.length})`
      : "Redo";
  }

  function updateDrawClearButton() {
    const clearButton = document.getElementById("map-draw-clear");
    if (!clearButton) return;
    clearButton.disabled = renderer.drawing.saving || !renderer.mapOverlays.length;
  }

  function renderSvgOnly() {
    if (!renderer.root || renderer.root.hidden) return;

    const rect = renderer.root.getBoundingClientRect();
    renderSvg({ width: rect.width, height: rect.height }, getVisibleHexes());
    positionPopup();
  }

  function resizeCanvas() {
    const rect = renderer.root.getBoundingClientRect();
    const scale = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * scale));
    const height = Math.max(1, Math.round(rect.height * scale));

    if (renderer.canvas.width !== width || renderer.canvas.height !== height) {
      renderer.canvas.width = width;
      renderer.canvas.height = height;
    }

    renderer.canvas.style.width = `${rect.width}px`;
    renderer.canvas.style.height = `${rect.height}px`;
    return { width: rect.width, height: rect.height, scale };
  }

  function fitViewToMap() {
    const rect = renderer.root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const fitZoom = Math.min(rect.width / renderer.view.width, rect.height / renderer.view.height);
    renderer.view.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, fitZoom));
    renderer.view.panX = (renderer.view.width - rect.width / renderer.view.zoom) / 2;
    renderer.view.panY = (renderer.view.height - rect.height / renderer.view.zoom) / 2;
    clampView();
  }

  function clampView() {
    const rect = renderer.root.getBoundingClientRect();
    const visibleWidth = rect.width / renderer.view.zoom;
    const visibleHeight = rect.height / renderer.view.zoom;
    const paddingX = Math.max(160, visibleWidth * PAN_PADDING_RATIO);
    const paddingY = Math.max(160, visibleHeight * PAN_PADDING_RATIO);
    const centeredPanX = (renderer.view.width - visibleWidth) / 2;
    const centeredPanY = (renderer.view.height - visibleHeight) / 2;
    const minPanX = Math.min(-paddingX, centeredPanX);
    const minPanY = Math.min(-paddingY, centeredPanY);
    const maxPanX = Math.max(renderer.view.width - visibleWidth + paddingX, centeredPanX);
    const maxPanY = Math.max(renderer.view.height - visibleHeight + paddingY, centeredPanY);

    renderer.view.panX = Math.max(minPanX, Math.min(maxPanX, renderer.view.panX));
    renderer.view.panY = Math.max(minPanY, Math.min(maxPanY, renderer.view.panY));
  }

  function render() {
    if (!renderer.root || renderer.root.hidden) return;

    const viewport = resizeCanvas();
    clampView();
    const visibleHexes = getVisibleHexes();
    renderTerrain(viewport);
    renderSvg(viewport, visibleHexes);
    positionPopup();
  }

  function renderTerrain({ width, height, scale }) {
    const ctx = renderer.ctx;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, width, height);
    updateTerrainCache();
    drawTerrainCacheSlice(ctx, width, height);
  }

  function drawTerrainCacheSlice(ctx, width, height) {
    const sourceWorldX = Math.max(0, renderer.view.panX);
    const sourceWorldY = Math.max(0, renderer.view.panY);
    const sourceWorldRight = Math.min(renderer.view.width, renderer.view.panX + width / renderer.view.zoom);
    const sourceWorldBottom = Math.min(renderer.view.height, renderer.view.panY + height / renderer.view.zoom);
    const sourceWorldWidth = sourceWorldRight - sourceWorldX;
    const sourceWorldHeight = sourceWorldBottom - sourceWorldY;

    if (sourceWorldWidth <= 0 || sourceWorldHeight <= 0) return;

    const destinationX = (sourceWorldX - renderer.view.panX) * renderer.view.zoom;
    const destinationY = (sourceWorldY - renderer.view.panY) * renderer.view.zoom;
    const destinationWidth = sourceWorldWidth * renderer.view.zoom;
    const destinationHeight = sourceWorldHeight * renderer.view.zoom;

    ctx.drawImage(
      renderer.cacheCanvas,
      sourceWorldX * TERRAIN_CACHE_SCALE,
      sourceWorldY * TERRAIN_CACHE_SCALE,
      sourceWorldWidth * TERRAIN_CACHE_SCALE,
      sourceWorldHeight * TERRAIN_CACHE_SCALE,
      destinationX,
      destinationY,
      destinationWidth,
      destinationHeight
    );
  }

  function updateTerrainCache() {
    const cacheWidth = Math.max(1, Math.ceil(renderer.view.width * TERRAIN_CACHE_SCALE));
    const cacheHeight = Math.max(1, Math.ceil(renderer.view.height * TERRAIN_CACHE_SCALE));

    if (renderer.cacheCanvas.width !== cacheWidth || renderer.cacheCanvas.height !== cacheHeight) {
      renderer.cacheCanvas.width = cacheWidth;
      renderer.cacheCanvas.height = cacheHeight;
      renderer.cacheDirty = true;
    }

    if (!renderer.cacheDirty) return;

    const ctx = renderer.cacheCtx;
    ctx.setTransform(TERRAIN_CACHE_SCALE, 0, 0, TERRAIN_CACHE_SCALE, 0, 0);
    ctx.clearRect(0, 0, renderer.view.width, renderer.view.height);

    renderer.hexes.forEach(hex => {
      drawCanvasPolygon(ctx, hex.points, hex.fill);
    });

    renderCanvasDrawablePaths(ctx);
    renderer.hexes.forEach(hex => renderEdgeBleedForHex(ctx, hex));
    if (renderer.drawing.visibleOverlays.features && shouldRenderFeatureArt()) {
      renderer.hexes.forEach(hex => renderFeatureArtForHex(ctx, hex));
    }
    renderer.cacheDirty = false;
    if (renderer.featureAssets.size > 0 && !hasPendingFeatureImages()) {
      setLoading(false);
    }
  }

  function drawCanvasPolygon(ctx, points, fill, opacity = 1) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach(point => ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.restore();
  }

  function renderCanvasDrawablePaths(ctx) {
    const overlays = renderer.mapOverlays || [];

    if (renderer.drawing.visibleOverlays.path) {
      connectedPathStrings(overlays.filter(overlay => overlay.Overlay_Type === "path"), "path").forEach(pathData => {
        drawCanvasOverlayPath(ctx, pathData.d, {
          stroke: ROAD_STYLE_COLORS[pathData.style] || ROAD_STYLE_COLORS.dark_brown,
          width: 3.5,
          dash: [7, 5]
        });
      });
    }

    if (renderer.drawing.visibleOverlays.river) {
      getCanvasRiverPathStrings(overlays.filter(overlay => overlay.Overlay_Type === "river")).forEach(pathData => {
        drawCanvasOverlayPath(ctx, pathData, {
          stroke: "#37b8e8",
          width: 6,
          dash: []
        });
      });
    }

    if (renderer.drawing.visibleOverlays.road) {
      connectedPathStrings(overlays.filter(overlay => overlay.Overlay_Type === "road"), "road").forEach(pathData => {
        drawCanvasOverlayPath(ctx, pathData.d, {
          stroke: ROAD_STYLE_COLORS[pathData.style] || ROAD_STYLE_COLORS.dark_brown,
          width: 6,
          dash: []
        });
      });
    }

  }

  function drawCanvasOverlayPath(ctx, pathData, options) {
    const commands = parseSvgPathCommands(pathData);
    if (!commands.length) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = options.stroke;
    ctx.lineWidth = options.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash(options.dash || []);

    commands.forEach(command => {
      if (command.type === "M") ctx.moveTo(command.x, command.y);
      if (command.type === "L") ctx.lineTo(command.x, command.y);
      if (command.type === "Q") ctx.quadraticCurveTo(command.cx, command.cy, command.x, command.y);
    });

    ctx.stroke();
    ctx.restore();
  }

  function parseSvgPathCommands(pathData) {
    const tokens = String(pathData || "").match(/[MLQT]|-?\d+(?:\.\d+)?/g) || [];
    const commands = [];
    let index = 0;
    let lastControl = null;
    let current = null;

    while (index < tokens.length) {
      const type = tokens[index++];
      if (type === "M" || type === "L") {
        const x = Number(tokens[index++]);
        const y = Number(tokens[index++]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) break;
        commands.push({ type, x, y });
        current = { x, y };
        lastControl = null;
      } else if (type === "Q") {
        const cx = Number(tokens[index++]);
        const cy = Number(tokens[index++]);
        const x = Number(tokens[index++]);
        const y = Number(tokens[index++]);
        if (![cx, cy, x, y].every(Number.isFinite)) break;
        commands.push({ type, cx, cy, x, y });
        lastControl = { x: cx, y: cy };
        current = { x, y };
      } else if (type === "T") {
        const x = Number(tokens[index++]);
        const y = Number(tokens[index++]);
        if (!Number.isFinite(x) || !Number.isFinite(y)) break;
        const reflected = current && lastControl
          ? { x: current.x * 2 - lastControl.x, y: current.y * 2 - lastControl.y }
          : current;
        if (reflected) {
          commands.push({ type: "Q", cx: reflected.x, cy: reflected.y, x, y });
          lastControl = reflected;
        } else {
          commands.push({ type: "L", x, y });
          lastControl = null;
        }
        current = { x, y };
      } else {
        break;
      }
    }

    return commands;
  }

  function renderEdgeBleedForHex(ctx, hex) {
    EDGE_NAMES.forEach(edgeName => {
      const neighbor = getNeighborHex(hex, edgeName);
      const appearance = getEdgeBlendAppearance(hex, neighbor);
      if (!appearance) return;
      drawCanvasPolygon(ctx, edgeBlendPolygon(hex, edgeName), appearance.fill, appearance.opacity);
    });
  }

  function getNeighborHex(hex, edgeName) {
    const offsets = hex.x % 2 ? ODD_Q_NEIGHBORS : EVEN_Q_NEIGHBORS;
    const offset = offsets[edgeName];
    return offset ? renderer.hexesByCoord.get(`${hex.x + offset[0]}:${hex.y + offset[1]}`) : null;
  }

  function edgeBlendPolygon(hex, edgeName) {
    const index = EDGE_NAMES.indexOf(edgeName);
    const originalA = hex.points[index];
    const originalB = hex.points[(index + 1) % hex.points.length];
    const previous = hex.points[(index + hex.points.length - 1) % hex.points.length];
    const next = hex.points[(index + 2) % hex.points.length];

    return [
      {
        x: originalA.x + (previous.x - originalA.x) * 0.24,
        y: originalA.y + (previous.y - originalA.y) * 0.24
      },
      originalA,
      originalB,
      {
        x: originalB.x + (next.x - originalB.x) * 0.24,
        y: originalB.y + (next.y - originalB.y) * 0.24
      }
    ];
  }

  function getEdgeBlendAppearance(hostHex, sourceHex) {
    if (!sourceHex) return null;
    if (isWaterBase(hostHex.baseTerrain) && isWaterBase(sourceHex.baseTerrain)) return null;

    const delta = sourceHex.elevation - hostHex.elevation;
    if (delta <= 0) return null;

    const elevationStep = Math.max(0, delta - 1);
    const shadowOpacity = Math.min(0.28, 0.14 + elevationStep * 0.045);
    return {
      fill: "#201712",
      opacity: Number(shadowOpacity.toFixed(3))
    };
  }

  function isWaterBase(baseTerrain) {
    return WATER_TERRAINS.has(baseTerrain);
  }

  async function loadFeatureArtAssets() {
    if (renderer.featureAssetsLoading) return renderer.featureAssetsLoading;

    renderer.featureAssetsLoading = Promise.all(FEATURE_ART_ASSET_FILES.map(async file => {
      try {
        const response = await fetch(`${FEATURE_ASSET_PATH}${file}`);
        if (!response.ok) return;
        renderer.featureAssets.set(file, parseFeatureSvg(await response.text()));
      } catch {}
    })).then(() => {
      renderer.featureImages.clear();
      renderer.cacheDirty = true;
      render();
    });

    return renderer.featureAssetsLoading;
  }

  function parseFeatureSvg(text) {
    const viewBoxMatch = text.match(/\bviewBox=["']([^"']+)["']/i);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 384 333";
    const values = viewBox.split(/\s+/).map(Number);
    const bodyMatch = text.match(/<svg\b[^>]*>([\s\S]*?)<\/svg>/i);
    const wrapper = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    wrapper.innerHTML = bodyMatch ? bodyMatch[1] : text;
    applyFeatureArtTint(wrapper);
    return {
      viewBox,
      width: Number.isFinite(values[2]) && values[2] > 0 ? values[2] : 384,
      height: Number.isFinite(values[3]) && values[3] > 0 ? values[3] : 333,
      body: wrapper.innerHTML
    };
  }

  function applyFeatureArtTint(artSvg) {
    artSvg.style.color = "currentColor";
    artSvg.setAttribute("fill", "currentColor");
    artSvg.querySelectorAll("path, polygon, circle, rect, ellipse, line, polyline").forEach(element => {
      const fill = element.getAttribute("fill");
      const stroke = element.getAttribute("stroke");
      if (fill !== "none") element.setAttribute("fill", "currentColor");
      if (stroke && stroke !== "none") element.setAttribute("stroke", "currentColor");
    });
  }

  function renderFeatureArtForHex(ctx, hex) {
    const stack = getFeatureArtStack(hex);
    const zoomOpacity = getFeatureArtZoomOpacity();

    stack.forEach((item, index) => {
      const image = getFeatureArtImage(item.file, getFeatureArtTint(hex, item));
      if (!image) return;
      drawFeatureArtImage(ctx, image, applyFeatureArtSizeMultiplier(featureArtDrawBox(hex, index), item.featureId), getFeatureArtOpacity(hex, item, zoomOpacity));
    });
  }

  function drawFeatureArtImage(ctx, image, box, opacity) {
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, box.x, box.y, box.width, box.height);
    ctx.restore();
  }

  function getFeatureArtImage(file, tint) {
    const asset = renderer.featureAssets.get(file);
    if (!asset) return null;

    const cacheKey = `${file}|${tint}|${FEATURE_IMAGE_SUPERSAMPLE}`;
    const cached = renderer.featureImages.get(cacheKey);
    if (cached?.loaded) return cached.image;
    if (cached) return null;

    const image = new Image();
    renderer.featureImages.set(cacheKey, { image, loaded: false });
    image.onload = () => {
      const entry = renderer.featureImages.get(cacheKey);
      if (!entry) return;

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.ceil(asset.width * FEATURE_IMAGE_SUPERSAMPLE));
      canvas.height = Math.max(1, Math.ceil(asset.height * FEATURE_IMAGE_SUPERSAMPLE));
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      entry.image = canvas;
      entry.loaded = true;
      renderer.cacheDirty = true;
      render();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${asset.viewBox}" color="${tint}" fill="currentColor">${asset.body}</svg>`
    )}`;
    return null;
  }

  function getFeatureArtStack(hex) {
    const features = new Set(hex.features || []);
    const stack = [];
    const hasVegetation = ["jungle", "forest", "woods", "shrub", "cactus_scrub"].some(feature => features.has(feature));
    const hasStructure = ["volcano", "snowcapped_mountains", "mountains", "lone_mountain", "cliffs", "ridges"].some(feature => features.has(feature));
    const structure = ["volcano", "snowcapped_mountains", "mountains", "lone_mountain", "cliffs", "ridges"].find(feature => features.has(feature));
    const surfaceOrder = features.has("ice")
      ? ["ice", "marsh", "reef", "kelp"]
      : features.has("whirlpool")
        ? ["reef", "kelp", "marsh"]
        : ["farmland", "sand", "waves", "shoals", "reef", "kelp", "ice", "marsh"];
    const surface = surfaceOrder.find(feature => features.has(feature) && !(feature === "farmland" && (hasVegetation || hasStructure)));
    const vegetation = ["jungle", "forest", "woods", "shrub", "cactus_scrub"].find(feature => features.has(feature));
    const waterTop = ["falls", "rapids", "whirlpool", "water_rocks"].find(feature => features.has(feature));

    if (structure) stack.push({ featureId: structure, layer: FEATURE_LAYER_BY_ID[structure] });
    if (surface) stack.push({ featureId: surface, layer: FEATURE_LAYER_BY_ID[surface] });
    if (vegetation) stack.push({ featureId: vegetation, layer: FEATURE_LAYER_BY_ID[vegetation] });
    if (waterTop) stack.push({ featureId: waterTop, layer: FEATURE_LAYER_BY_ID[waterTop] });
    if (features.has("mist")) stack.push({ featureId: "mist", layer: FEATURE_LAYER_BY_ID.mist });

    return stack
      .map(item => ({
        ...item,
        file: chooseFeatureArtFile(hex, item.featureId, features),
        opacity: FEATURE_ART_OPACITY[item.featureId] || 0.28
      }))
      .filter(item => item.file)
      .sort((a, b) => a.layer - b.layer);
  }

  function chooseFeatureArtFile(hex, featureId, features) {
    const base = hex.baseTerrain;

    if (["reef", "kelp", "shoals", "water_rocks", "waves", "whirlpool"].includes(featureId)) {
      if (!WATER_TERRAINS.has(base)) return null;
      if (featureId === "reef" && base === "inland_water") return null;
      if (featureId === "kelp" && base === "inland_water") return null;
      if (featureId === "shoals" && base === "deep_sea" && !hasNearbyBase(hex, new Set(["coastal_water", "beach"]), 1)) return null;
      if (featureId === "waves" && (features.has("ice") || features.has("whirlpool"))) return null;
      if (featureId === "shoals" && (features.has("ice") || features.has("whirlpool"))) return null;
      return FEATURE_ART_FILES[featureId];
    }

    if (featureId === "rapids") {
      if (features.has("falls")) return null;
      return base === "inland_water" || (WATER_TERRAINS.has(base) && hasNearbyBase(hex, HIGHLAND_TERRAINS, 1)) ? FEATURE_ART_FILES.rapids : null;
    }
    if (featureId === "falls") {
      return (base === "inland_water" && hasNearbyBase(hex, HIGHLAND_TERRAINS, 1)) || (WATER_TERRAINS.has(base) && hasNearbyAnyFeature(hex, ["cliffs", "mountains", "ridges"], 1)) ? FEATURE_ART_FILES.falls : null;
    }
    if (featureId === "ice") {
      if (!WATER_TERRAINS.has(base) && base !== "snow") return null;
      return base === "snow" || hasNearbyBase(hex, COLD_TERRAINS, 2) || hasNearbyFeature(hex, "ice", 2) ? FEATURE_ART_FILES.ice : null;
    }

    if (featureId === "farmland") return ["plains", "grassland", "lush_grassland"].includes(base) ? FEATURE_ART_FILES.farmland : null;
    if (featureId === "sand") return ["beach", "desert", "deep_desert"].includes(base) ? FEATURE_ART_FILES.sand : null;
    if (featureId === "cactus_scrub") return ["desert", "deep_desert", "barrens"].includes(base) ? FEATURE_ART_FILES.cactus_scrub : null;
    if (featureId === "shrub") return ["plains", "grassland", "desert", "deep_desert", "barrens", "bleak_barrens"].includes(base) ? FEATURE_ART_FILES.shrub : null;
    if (featureId === "marsh") return ["wetland", "inland_water", "lush_grassland"].includes(base) ? FEATURE_ART_FILES.marsh : null;
    if (featureId === "ridges") return LAND_TERRAINS.has(base) && !WATER_TERRAINS.has(base) ? FEATURE_ART_FILES.ridges : null;
    if (featureId === "cliffs") return ["beach", "desert", "deep_desert", "barrens", "bleak_barrens", "rock", "wastes"].includes(base) ? FEATURE_ART_FILES.cliffs : null;
    if (featureId === "snowcapped_mountains") return base === "snow" ? FEATURE_ART_FILES.snowcapped_mountains : null;
    if (featureId === "mountains") return ["rock", "snow"].includes(base) ? (base === "snow" ? FEATURE_ART_FILES.mountains_snow : FEATURE_ART_FILES.mountains) : null;
    if (featureId === "lone_mountain") return ["plains", "grassland", "desert", "deep_desert", "barrens", "rock", "wastes"].includes(base) ? FEATURE_ART_FILES.lone_mountain : null;
    if (featureId === "volcano") return ["rock", "wastes", "bleak_barrens"].includes(base) ? FEATURE_ART_FILES.volcano : null;
    if (featureId === "mist") return FEATURE_ART_FILES.mist;
    if (featureId === "jungle") return chooseJungleArt(hex);
    if (featureId === "woods") return chooseWoodsArt(hex);
    if (featureId === "forest") return ["mountains", "lone_mountain", "volcano", "cliffs", "ridges"].some(feature => features.has(feature)) ? chooseWoodsArt(hex) : chooseForestArt(hex);

    return FEATURE_ART_FILES[featureId] || null;
  }

  function nearbyHexesWithin(hex, radius = 2) {
    const results = [];
    const visited = new Set([`${hex.x}:${hex.y}`]);
    let frontier = [hex];

    for (let depth = 0; depth < radius; depth++) {
      const next = [];
      frontier.forEach(current => {
        EDGE_NAMES.map(edgeName => getNeighborHex(current, edgeName)).filter(Boolean).forEach(neighbor => {
          const key = `${neighbor.x}:${neighbor.y}`;
          if (visited.has(key)) return;
          visited.add(key);
          results.push(neighbor);
          next.push(neighbor);
        });
      });
      frontier = next;
    }

    return results;
  }

  function hasNearbyBase(hex, baseSet, radius = 2) {
    return nearbyHexesWithin(hex, radius).some(neighbor => baseSet.has(neighbor.baseTerrain));
  }

  function hasNearbyFeature(hex, featureId, radius = 2) {
    return nearbyHexesWithin(hex, radius).some(neighbor => neighbor.features.includes(featureId));
  }

  function hasNearbyAnyFeature(hex, featureIds, radius = 2) {
    const set = new Set(featureIds);
    return nearbyHexesWithin(hex, radius).some(neighbor => neighbor.features.some(feature => set.has(feature)));
  }

  function stableHash(text) {
    let hash = 2166136261;
    const value = String(text);
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function pickStableWeighted(hex, featureId, weightedFiles) {
    const pool = [];
    weightedFiles.forEach(([file, weight]) => {
      for (let i = 0; i < weight; i++) pool.push(file);
    });
    return pool.length ? pool[stableHash(`${hex.id}:${hex.baseTerrain}:${featureId}`) % pool.length] : null;
  }

  function chooseWoodsArt(hex) {
    const base = hex.baseTerrain;
    if (!["plains", "grassland", "lush_grassland", "wetland", "snow", "rock"].includes(base)) return null;
    if (base === "snow") return pickStableWeighted(hex, "woods", [["woods_con.svg", 6], ["woods_dec.svg", 1]]);
    if (base === "rock") return pickStableWeighted(hex, "woods", [["woods_con.svg", 5], ["woods_dec.svg", 2]]);
    if (base === "wetland") return pickStableWeighted(hex, "woods", [["woods_con.svg", 2], ["woods_dec.svg", 3]]);
    if (base === "lush_grassland") return pickStableWeighted(hex, "woods", [["woods_dec.svg", 6], ["woods_con.svg", 1]]);
    return pickStableWeighted(hex, "woods", [["woods_dec.svg", 5], ["woods_con.svg", 1]]);
  }

  function chooseForestArt(hex) {
    const base = hex.baseTerrain;
    if (!["grassland", "lush_grassland", "wetland", "snow", "rock"].includes(base)) return null;
    if (base === "snow") return pickStableWeighted(hex, "forest", [["forest_con.svg", 6], ["forest_dec.svg", 1]]);
    if (base === "rock") return pickStableWeighted(hex, "forest", [["forest_con.svg", 5], ["forest_dec.svg", 2]]);
    if (base === "wetland") return pickStableWeighted(hex, "forest", [["forest_con.svg", 3], ["forest_dec.svg", 3]]);
    if (base === "lush_grassland") return pickStableWeighted(hex, "forest", [["forest_dec.svg", 6], ["forest_con.svg", 1]]);
    return pickStableWeighted(hex, "forest", [["forest_dec.svg", 4], ["forest_con.svg", 2]]);
  }

  function chooseJungleArt(hex) {
    if (!["jungle_floor", "wetland", "lush_grassland"].includes(hex.baseTerrain)) return null;
    const nearbyBeach = hasNearbyBase(hex, new Set(["beach", "coastal_water"]), 2);
    const nearbyWet = hasNearbyBase(hex, new Set(["wetland", "inland_water"]), 2);
    const nearbyCold = hasNearbyBase(hex, COLD_TERRAINS, 3);
    const nearbyRock = hasNearbyBase(hex, new Set(["rock"]), 2);
    if (nearbyBeach && nearbyWet && !nearbyCold) return pickStableWeighted(hex, "jungle", [["jungle_trop_1.svg", 3], ["jungle_trop_2.svg", 2], ["jungle_temp_1.svg", 1]]);
    if (nearbyCold || nearbyRock) return pickStableWeighted(hex, "jungle", [["jungle_temp_1.svg", 4], ["jungle_temp_2.svg", 2]]);
    return pickStableWeighted(hex, "jungle", [["jungle_temp_1.svg", 3], ["jungle_temp_2.svg", 2], ["jungle_trop_1.svg", 1]]);
  }

  function getFeatureArtTint(hex, item) {
    const base = hex.baseTerrain;
    const tints = BASE_FEATURE_TINTS[base] || BASE_FEATURE_TINTS.plains;
    const featureId = item.featureId;
    const file = item.file || "";
    const isVegetation = ["woods", "forest", "jungle", "shrub", "cactus_scrub", "marsh"].includes(featureId);
    const isRelief = ["mountains", "snowcapped_mountains", "lone_mountain", "cliffs", "ridges", "volcano"].includes(featureId);
    if (featureId === "mist") return "#f0f0e8";
    if (featureId === "ice") return base === "snow" ? "#5f8fa4" : "#d8eef2";
    if (featureId === "sand") return isCoastalSandHex(hex) ? "#f1ead8" : base === "deep_desert" ? "#765033" : "#805b34";
    if (featureId === "marsh") return "#8b6f3d";
    if (["barrens", "bleak_barrens"].includes(base) && isRelief) return "#b88a62";
    if (["barrens", "bleak_barrens"].includes(base) && ["shrub", "cactus_scrub"].includes(featureId)) return "#958a57";
    if (base === "wastes" && isRelief) return "#8f6a5f";
    if (featureId === "jungle") return "#519942";
    if (["wetland", "jungle_floor"].includes(base) && isVegetation) return base === "jungle_floor" ? "#63a56d" : "#5d9380";
    if (featureId === "volcano") return "#2b2020";
    if (featureId === "kelp") return "#1f5a45";
    if (featureId === "reef") return "#7b5a4a";
    if (featureId === "falls") return "#d8eef2";
    if (file.includes("jungle_trop")) return "#155c38";
    if (file.includes("jungle_temp")) return "#244a35";
    if (file.includes("_con")) return base === "wetland" ? "#234d43" : "#203f35";
    if (file.includes("_dec")) return tints.vegetation;
    if (isVegetation) return tints.vegetation;
    if (isRelief) return tints.relief;
    if (["waves", "shoals", "water_rocks", "rapids", "whirlpool"].includes(featureId)) return tints.water || "#103f56";
    if (featureId === "farmland") return tints.surface;
    return tints.surface || "#3f3a32";
  }

  function isCoastalSandHex(hex) {
    return hex?.baseTerrain === "beach" || (
      ["desert", "deep_desert"].includes(hex?.baseTerrain) &&
      hasNearbyBase(hex, WATER_TERRAINS, 1)
    );
  }

  function getFeatureArtOpacity(hex, item, zoomOpacity) {
    const waterFeatures = new Set(["waves", "shoals", "reef", "kelp", "water_rocks", "rapids", "falls", "whirlpool", "ice"]);
    if (!waterFeatures.has(item.featureId) && item.featureId !== "mist") return 1;
    let opacity = item.opacity * zoomOpacity;
    if (item.featureId === "mist") return Math.min(0.24, opacity);
    const darkBases = new Set(["deep_sea", "sea", "coastal_water", "wetland", "jungle_floor", "lush_grassland", "rock", "wastes", "bleak_barrens"]);
    if (darkBases.has(hex.baseTerrain)) opacity *= 1.22;
    return Math.min(0.92, opacity);
  }

  function getFeatureArtZoomScale() {
    return 1;
  }

  function shouldRenderFeatureArt() {
    return renderer.featureAssets.size > 0;
  }

  function hasPendingFeatureImages() {
    return [...renderer.featureImages.values()].some(entry => !entry.loaded);
  }

  function getFeatureArtZoomOpacity() {
    return 1;
  }

  function featureArtDrawBox(hex, index) {
    const zoomScale = getFeatureArtZoomScale();
    const size = (index === 0 ? 94 : 74) * zoomScale;
    const offsetY = (index === 0 ? -46 : -34 + index * 8) * zoomScale;
    return {
      x: hex.center.x - size / 2,
      y: hex.center.y + offsetY,
      width: size,
      height: size
    };
  }

  function applyFeatureArtSizeMultiplier(box, featureId) {
    const multiplier = ["mountains", "snowcapped_mountains", "lone_mountain", "volcano", "marsh"].includes(featureId) ? 0.9 : 1;
    const width = box.width * multiplier;
    const height = box.height * multiplier;
    return {
      x: box.x + (box.width - width) / 2,
      y: box.y + (box.height - height) / 2,
      width,
      height
    };
  }

  function renderSvg({ width, height }, visibleHexes) {
    const visibleWidth = width / renderer.view.zoom;
    const visibleHeight = height / renderer.view.zoom;
    renderer.svg.setAttribute("viewBox", `${renderer.view.panX} ${renderer.view.panY} ${visibleWidth} ${visibleHeight}`);
    renderer.svg.innerHTML = "";

    const fragment = document.createDocumentFragment();
    const gridPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    gridPath.setAttribute("class", "generated-map-grid-lines");
    gridPath.setAttribute("d", buildGridPath(visibleHexes));
    fragment.appendChild(gridPath);

    renderGeographicRegionOverlay(fragment, visibleHexes);
    renderDrawableOverlays(fragment, visibleHexes);
    renderPoliticalRegionBorders(fragment, visibleHexes);
    renderRegionLabels(fragment, visibleHexes);
    if (renderer.drawing.visibleOverlays.pois) {
      renderPoiMarkers(fragment, visibleHexes);
    }

    if (renderer.view.zoom >= COORD_LABEL_MIN_ZOOM) {
      visibleHexes.forEach(hex => {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        const dimensions = getGeneratedMapDimensions();
        text.setAttribute("class", "generated-map-coord-label");
        text.setAttribute("x", hex.center.x);
        text.setAttribute("y", hex.center.y - dimensions.hexHeight * 0.28);
        text.setAttribute("font-size", String(dimensions.radius * 0.20));
        text.textContent = hex.label;
        fragment.appendChild(text);
      });
    }

    const activeHex = renderer.hexes.find(hex => hex.id === renderer.hoveredHexId || hex.id === renderer.selectedHexId);
    if (activeHex) {
      const selected = activeHex.id === renderer.selectedHexId;
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("class", selected ? "generated-map-selected-hex" : "generated-map-hovered-hex");
      polygon.setAttribute("points", activeHex.points.map(point => `${point.x},${point.y}`).join(" "));
      fragment.appendChild(polygon);
    }

    renderDrawingGuides(fragment, visibleHexes);

    renderer.svg.appendChild(fragment);
  }

  function renderDrawableOverlays(fragment, visibleHexes) {
    const visibleIds = new Set(visibleHexes.map(hex => hex.id));
    const overlays = renderer.mapOverlays || [];

    overlays.filter(overlay => renderer.drawing.visibleOverlays.wall && overlay.Overlay_Type === "wall" && visibleIds.has(overlay.Hex_ID_Ref)).forEach(overlay => {
      const hex = renderer.hexes.find(candidate => candidate.id === overlay.Hex_ID_Ref);
      if (!hex) return;

      const edgeIndex = EDGE_NAMES.indexOf(overlay.Edge);
      if (edgeIndex < 0) return;

      const edge = { a: hex.points[edgeIndex], b: hex.points[(edgeIndex + 1) % hex.points.length] };
      ["base", "body", "crenellations"].forEach(layer => {
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", `generated-map-drawn-wall generated-map-drawn-wall-${layer}`);
        path.setAttribute("d", pathCommand(edge.a, edge.b));
        fragment.appendChild(path);
      });
    });
  }

  function renderDrawingGuides(fragment, visibleHexes) {
    if (!renderer.drawing.enabled) return;

    const pendingId = PATH_OVERLAY_TYPES.has(renderer.drawing.tool) ? renderer.drawing.lastHexId : null;
    const pendingHex = pendingId ? visibleHexes.find(hex => hex.id === pendingId) : null;
    if (pendingHex) {
      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("class", "generated-map-drawing-pending");
      polygon.setAttribute("points", pendingHex.points.map(point => `${point.x},${point.y}`).join(" "));
      fragment.appendChild(polygon);
    }

    if (renderer.drawing.tool === "wall" && renderer.drawing.hoverEdge) {
      const hex = renderer.hexes.find(candidate => candidate.id === renderer.drawing.hoverEdge.hexId);
      const edgeIndex = EDGE_NAMES.indexOf(renderer.drawing.hoverEdge.edge);
      if (hex && edgeIndex >= 0) {
        const edge = { a: hex.points[edgeIndex], b: hex.points[(edgeIndex + 1) % hex.points.length] };
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("class", "generated-map-drawing-edge-preview");
        path.setAttribute("d", pathCommand(edge.a, edge.b));
        fragment.appendChild(path);
      }
    }
  }

  function renderPoiMarkers(fragment, visibleHexes) {
    visibleHexes.forEach(hex => {
      const pois = renderer.poisByHexId.get(hex.id) || renderer.poisByHexId.get(hex.label);
      if (!pois?.length) return;

      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");

      group.setAttribute("class", "generated-map-poi-marker");
      circle.setAttribute("class", "generated-map-poi-bg");
      circle.setAttribute("cx", hex.center.x);
      circle.setAttribute("cy", hex.center.y - 22);
      circle.setAttribute("r", "14");

      text.setAttribute("class", "generated-map-poi-symbol");
      text.setAttribute("x", hex.center.x);
      text.setAttribute("y", hex.center.y - 21);
      text.textContent = pois.length > 1 ? String(Math.min(pois.length, 9)) : getPoiGlyph(pois[0]);

      group.appendChild(circle);
      group.appendChild(text);
      fragment.appendChild(group);
    });
  }

  function renderGeographicRegionOverlay(fragment, visibleHexes) {
    if (!renderer.drawing.visibleOverlays.geographic) return;

    const borderSegments = [];
    const drawn = new Set();

    visibleHexes.forEach(hex => {
      const fill = getRegionBorderColor(hex.regionId);
      if (!fill) return;

      const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      polygon.setAttribute("class", "generated-map-geographic-region-fill");
      polygon.setAttribute("fill", fill);
      polygon.setAttribute("points", hex.points.map(point => `${point.x},${point.y}`).join(" "));
      fragment.appendChild(polygon);

      EDGE_NAMES.forEach((edgeName, index) => {
        const neighbor = getNeighborHex(hex, edgeName);
        if (neighbor?.regionId === hex.regionId) return;

        const edge = { a: hex.points[index], b: hex.points[(index + 1) % hex.points.length] };
        const key = edgeKey(edge.a, edge.b);
        if (drawn.has(key)) return;
        drawn.add(key);

        borderSegments.push({
          edge,
          color: fill
        });
      });
    });

    const commandsByColor = new Map();
    borderSegments.forEach(({ edge, color }) => {
      addRegionBorderCommand(commandsByColor, color, pathCommand(edge.a, edge.b));
    });

    commandsByColor.forEach((commands, stroke) => {
      if (!commands.length) return;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "generated-map-geographic-region-outline");
      path.setAttribute("stroke", stroke);
      path.setAttribute("d", commands.join(" "));
      fragment.appendChild(path);
    });
  }

  function renderPoliticalRegionBorders(fragment, visibleHexes) {
    if (!renderer.drawing.visibleOverlays.political) return;
    renderRegionBorders(fragment, visibleHexes, {
      getRegionId: hex => hex.politicalRegionId,
      treatUnclaimed: false
    });
  }

  function renderRegionLabels(fragment, visibleHexes) {
    if (renderer.drawing.visibleOverlays.politicalLabels) {
      renderRegionLabelLayer(fragment, renderer.hexes, {
        className: "generated-map-region-label generated-map-political-region-label",
        fontSize: 30,
        strokeWidth: 6,
        getRegionId: hex => hex.politicalRegionId,
        skipRegion: () => false
      });
    }

    if (renderer.drawing.visibleOverlays.geographicLabels) {
      renderRegionLabelLayer(fragment, renderer.hexes, {
        className: "generated-map-region-label generated-map-geographic-region-label",
        fontSize: 20,
        strokeWidth: 5,
        getRegionId: hex => hex.regionId,
        skipRegion: regionId => isUnclaimedRegion(regionId)
      });
    }
  }

  function renderRegionLabelLayer(fragment, visibleHexes, options) {
    const groups = groupVisibleHexesByRegion(visibleHexes, options.getRegionId, options.skipRegion);
    groups.forEach((hexes, regionId) => {
      const region = db?.regionsById?.[regionId];
      const name = region?.Region_Name || regionId;
      if (!name) return;

      const anchor = getRegionLabelAnchor(hexes, name, regionId);
      if (!anchor) return;

      const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
      text.setAttribute("class", options.className);
      text.setAttribute("x", anchor.x);
      text.setAttribute("y", anchor.y);
      text.setAttribute("font-size", String(options.fontSize / REGION_LABEL_REFERENCE_ZOOM));
      text.setAttribute("stroke-width", String(options.strokeWidth / REGION_LABEL_REFERENCE_ZOOM));
      text.textContent = name;
      fragment.appendChild(text);
    });
  }

  function groupVisibleHexesByRegion(visibleHexes, getRegionId, skipRegion) {
    const groups = new Map();
    visibleHexes.forEach(hex => {
      const regionId = getRegionId(hex);
      if (!regionId || skipRegion(regionId)) return;
      if (!groups.has(regionId)) groups.set(regionId, []);
      groups.get(regionId).push(hex);
    });
    return groups;
  }

  function getRegionLabelAnchor(hexes, label = "", regionId = "") {
    if (!hexes.length) return null;

    const centroid = hexes.reduce((total, hex) => ({
      x: total.x + hex.center.x,
      y: total.y + hex.center.y
    }), { x: 0, y: 0 });
    centroid.x /= hexes.length;
    centroid.y /= hexes.length;

    const poiCenters = getPoiCentersForRegion(regionId, hexes);
    const dimensions = getGeneratedMapDimensions();
    const labelHalfWidth = Math.max(
      dimensions.radius * 2.8,
      Math.min(dimensions.radius * 8.5, String(label).length * dimensions.radius * 0.34)
    );
    const labelHalfHeight = dimensions.hexHeight * 0.72;
    const preferredClearance = Math.max(labelHalfWidth * 0.55, dimensions.radius * 4.4);

    return hexes.reduce((best, hex) => {
      const nearestPoiDistance = getNearestPoiDistance(hex.center, poiCenters);
      const centerDistance = Math.hypot(hex.center.x - centroid.x, hex.center.y - centroid.y);
      const overlapPenalty = getLabelPoiOverlapPenalty(hex.center, poiCenters, labelHalfWidth, labelHalfHeight);
      const clearancePenalty = Math.max(0, preferredClearance - nearestPoiDistance) * 18;
      const directHitPenalty = renderer.poiHexIds.has(hex.id) || renderer.poiHexIds.has(hex.label)
        ? preferredClearance * 12
        : 0;
      const score = centerDistance + clearancePenalty + directHitPenalty + overlapPenalty;
      return !best || score < best.score
        ? { x: hex.center.x, y: hex.center.y, score }
        : best;
    }, null);
  }

  function getPoiCentersForRegion(regionId, regionHexes) {
    return [...renderer.poiHexIds]
      .map(hexId => renderer.hexes.find(hex => hex.id === hexId || hex.label === hexId)?.center)
      .filter(Boolean);
  }

  function getLabelPoiOverlapPenalty(anchor, poiCenters, halfWidth, halfHeight) {
    return poiCenters.reduce((penalty, poi) => {
      const dx = Math.abs(poi.x - anchor.x);
      const dy = Math.abs(poi.y - anchor.y);
      const insideLabelBox = dx < halfWidth && dy < halfHeight;
      const nearLabelBox = dx < halfWidth * 1.25 && dy < halfHeight * 1.6;

      if (insideLabelBox) return penalty + halfWidth * 42;
      if (nearLabelBox) return penalty + halfWidth * 14;
      return penalty;
    }, 0);
  }

  function getNearestPoiDistance(point, poiCenters) {
    if (!poiCenters.length) return Infinity;
    return poiCenters.reduce((nearest, poi) => {
      return Math.min(nearest, Math.hypot(point.x - poi.x, point.y - poi.y));
    }, Infinity);
  }

  function renderRegionBorders(fragment, visibleHexes, options = {}) {
    const getRegionId = options.getRegionId || (hex => hex.regionId);
    const treatUnclaimed = options.treatUnclaimed !== false;
    const borderSegments = [];
    const drawn = new Set();

    visibleHexes.forEach(hex => {
      const regionId = getRegionId(hex);
      if (!regionId) return;

      EDGE_NAMES.forEach((edgeName, index) => {
        const neighbor = getNeighborHex(hex, edgeName);
        const neighborRegionId = neighbor ? getRegionId(neighbor) : "";
        if (neighborRegionId === regionId) return;

        const edge = { a: hex.points[index], b: hex.points[(index + 1) % hex.points.length] };
        const key = edgeKey(edge.a, edge.b);
        if (drawn.has(key)) return;
        drawn.add(key);

        borderSegments.push({
          edge,
          regionColor: getRegionBorderColor(regionId),
          neighborColor: neighborRegionId ? getRegionBorderColor(neighborRegionId) : "",
          regionUnclaimed: treatUnclaimed ? isUnclaimedRegion(regionId) : false,
          neighborUnclaimed: neighborRegionId ? (treatUnclaimed ? isUnclaimedRegion(neighborRegionId) : false) : true
        });
      });
    });

    const glowCommandsByColor = new Map();
    const lineCommandsByColor = new Map();

    borderSegments.forEach(segment => {
      addRegionBorderSegment(glowCommandsByColor, lineCommandsByColor, segment);
    });

    glowCommandsByColor.forEach((commands, stroke) => {
      if (!commands.length) return;

      const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
      glowPath.setAttribute("class", "generated-map-region-border-glow");
      glowPath.setAttribute("stroke", stroke);
      glowPath.setAttribute("d", commands.join(" "));
      fragment.appendChild(glowPath);
    });

    lineCommandsByColor.forEach((commands, stroke) => {
      if (!commands.length) return;

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("class", "generated-map-region-borders");
      path.setAttribute("stroke", stroke);
      path.setAttribute("d", commands.join(" "));
      fragment.appendChild(path);
    });
  }

  function addRegionBorderSegment(glowCommandsByColor, lineCommandsByColor, segment) {
    const { edge, regionColor, neighborColor, regionUnclaimed, neighborUnclaimed } = segment;

    if (regionUnclaimed && neighborUnclaimed) return;
    if (regionUnclaimed || !regionColor) {
      addRegionBorderCommand(glowCommandsByColor, neighborColor, pathCommand(edge.a, edge.b));
      addRegionBorderCommand(lineCommandsByColor, neighborColor, pathCommand(edge.a, edge.b));
      return;
    }
    if (neighborUnclaimed || !neighborColor) {
      addRegionBorderCommand(glowCommandsByColor, regionColor, pathCommand(edge.a, edge.b));
      addRegionBorderCommand(lineCommandsByColor, regionColor, pathCommand(edge.a, edge.b));
      return;
    }

    if (regionColor === neighborColor) {
      addRegionBorderCommand(glowCommandsByColor, regionColor, pathCommand(edge.a, edge.b));
      addRegionBorderCommand(lineCommandsByColor, regionColor, pathCommand(edge.a, edge.b));
      return;
    }

    const split = splitSharedBorder(edge);
    addRegionBorderCommand(glowCommandsByColor, regionColor, pathCommand(split.region.a, split.region.b));
    addRegionBorderCommand(glowCommandsByColor, neighborColor, pathCommand(split.neighbor.a, split.neighbor.b));
    addRegionBorderCommand(lineCommandsByColor, regionColor, pathCommand(split.region.a, split.region.b));
    addRegionBorderCommand(lineCommandsByColor, neighborColor, pathCommand(split.neighbor.a, split.neighbor.b));
  }

  function addRegionBorderCommand(commandsByColor, stroke, command) {
    if (!stroke || !command) return;
    if (!commandsByColor.has(stroke)) commandsByColor.set(stroke, []);
    commandsByColor.get(stroke).push(command);
  }

  function splitSharedBorder(edge) {
    const dx = edge.b.x - edge.a.x;
    const dy = edge.b.y - edge.a.y;
    const length = Math.hypot(dx, dy) || 1;
    const offsetX = (-dy / length) * 2.4;
    const offsetY = (dx / length) * 2.4;

    return {
      region: {
        a: { x: edge.a.x + offsetX, y: edge.a.y + offsetY },
        b: { x: edge.b.x + offsetX, y: edge.b.y + offsetY }
      },
      neighbor: {
        a: { x: edge.a.x - offsetX, y: edge.a.y - offsetY },
        b: { x: edge.b.x - offsetX, y: edge.b.y - offsetY }
      }
    };
  }

  function pathCommand(a, b) {
    return `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
  }

  function pathPointForHexId(hexId) {
    return renderer.hexes.find(hex => hex.id === hexId)?.center || null;
  }

  function overlaySegmentPoints(segment, type) {
    const from = renderer.hexes.find(hex => hex.id === segment.From_Hex_ID_Ref);
    const to = renderer.hexes.find(hex => hex.id === segment.To_Hex_ID_Ref);
    if (!from || !to) return null;

    return { from: from.center, to: to.center };
  }

  function isWaterHex(hex) {
    return RIVER_WATER_TERRAINS.has(hex?.baseTerrain);
  }

  function pointWhereLineLeavesHex(hex, targetPoint) {
    const center = hex.center;
    const dx = targetPoint.x - center.x;
    const dy = targetPoint.y - center.y;
    const length = Math.hypot(dx, dy) || 1;
    const dimensions = getGeneratedMapDimensions();
    const distance = dimensions.radius * 0.78;
    return {
      x: center.x + (dx / length) * distance,
      y: center.y + (dy / length) * distance
    };
  }

  function buildSegmentGraph(segments) {
    const graph = new Map();
    segments.forEach(segment => {
      if (!pathPointForHexId(segment.From_Hex_ID_Ref) || !pathPointForHexId(segment.To_Hex_ID_Ref)) return;
      if (!graph.has(segment.From_Hex_ID_Ref)) graph.set(segment.From_Hex_ID_Ref, new Set());
      if (!graph.has(segment.To_Hex_ID_Ref)) graph.set(segment.To_Hex_ID_Ref, new Set());
      graph.get(segment.From_Hex_ID_Ref).add(segment.To_Hex_ID_Ref);
      graph.get(segment.To_Hex_ID_Ref).add(segment.From_Hex_ID_Ref);
    });
    return graph;
  }

  function overlayEdgeVisitKey(a, b) {
    return a < b ? `${a}|${b}` : `${b}|${a}`;
  }

  function tracePathChain(start, next, graph, visited) {
    const chain = [start, next];
    visited.add(overlayEdgeVisitKey(start, next));

    let previous = start;
    let current = next;

    while ((graph.get(current)?.size || 0) === 2) {
      const onward = [...graph.get(current)].find(hexId => hexId !== previous);
      if (!onward || visited.has(overlayEdgeVisitKey(current, onward))) break;
      chain.push(onward);
      visited.add(overlayEdgeVisitKey(current, onward));
      previous = current;
      current = onward;
    }

    return chain;
  }

  function pathForPointChain(chain, type, segmentByEdge) {
    const snapHexIds = getSnapHexIdsForPathType(type);
    const pointRecords = chain.map((hexId, index) => {
      let point = null;
      if (snapHexIds.has(hexId)) point = pathPointForHexId(hexId);
      else if (["road", "path"].includes(type)) point = getTransportChainPoint(hexId, index, chain, type);
      else if (type !== "river" || index !== 0 && index !== chain.length - 1) point = pathPointForHexId(hexId);
      else {
        const neighborId = index === 0 ? chain[1] : chain[index - 1];
        const segment = segmentByEdge.get(overlayEdgeVisitKey(hexId, neighborId));
        if (!segment) point = pathPointForHexId(hexId);
        else {
          const segmentPoints = overlaySegmentPoints(segment, type);
          point = segmentPoints
            ? segment.From_Hex_ID_Ref === hexId ? segmentPoints.from : segmentPoints.to
            : pathPointForHexId(hexId);
        }
      }

      return point ? { hexId, point } : null;
    }).filter(Boolean);

    const points = pointRecords.map(record => record.point);

    if (points.length < 2) return "";
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    const commands = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 1; i < points.length - 1; i++) {
      const current = points[i];
      if (snapHexIds.has(pointRecords[i].hexId)) {
        commands.push(`L ${current.x} ${current.y}`);
        continue;
      }

      const next = points[i + 1];
      const mid = {
        x: current.x + (next.x - current.x) * 0.42,
        y: current.y + (next.y - current.y) * 0.42
      };
      commands.push(`Q ${current.x} ${current.y} ${mid.x} ${mid.y}`);
    }
    const last = points[points.length - 1];
    commands.push(`T ${last.x} ${last.y}`);
    return commands.join(" ");
  }

  function connectedPathStrings(segments, type) {
    const groups = new Map();
    segments.forEach(segment => {
      const style = type === "river" ? "river" : segment.Style || "dark_brown";
      if (!groups.has(style)) groups.set(style, []);
      groups.get(style).push(segment);
    });

    const paths = [];

    groups.forEach((groupSegments, style) => {
      const graph = buildSegmentGraph(groupSegments);
      const visited = new Set();
      const segmentByEdge = new Map(groupSegments.map(segment => [
        overlayEdgeVisitKey(segment.From_Hex_ID_Ref, segment.To_Hex_ID_Ref),
        segment
      ]));

      const starts = [...graph.keys()].filter(hexId => (graph.get(hexId)?.size || 0) !== 2);
      starts.forEach(start => {
        [...graph.get(start)].forEach(next => {
          if (visited.has(overlayEdgeVisitKey(start, next))) return;
          paths.push({ d: pathForPointChain(tracePathChain(start, next, graph, visited), type, segmentByEdge), style });
        });
      });

      groupSegments.forEach(segment => {
        if (visited.has(overlayEdgeVisitKey(segment.From_Hex_ID_Ref, segment.To_Hex_ID_Ref))) return;
        paths.push({
          d: pathForPointChain(tracePathChain(segment.From_Hex_ID_Ref, segment.To_Hex_ID_Ref, graph, visited), type, segmentByEdge),
          style
        });
      });
    });

    return paths.filter(path => path.d);
  }

  function getCanvasTransportPathStrings(segments, type) {
    return segments
      .map(segment => {
        const points = transportSegmentPoints(segment, type, segments);
        if (!points) return null;

        return {
          d: curvedSegmentPath(points.from, points.to, `${segment.__uuid || ""}:${segment.From_Hex_ID_Ref}:${segment.To_Hex_ID_Ref}`),
          style: segment.Style || "dark_brown"
        };
      })
      .filter(Boolean);
  }

  function transportSegmentPoints(segment, type, allSegments) {
    const from = renderer.hexes.find(hex => hex.id === segment.From_Hex_ID_Ref);
    const to = renderer.hexes.find(hex => hex.id === segment.To_Hex_ID_Ref);
    if (!from || !to) return null;

    const fromContinues = transportContinuesThroughWater(from, type, allSegments);
    const toContinues = transportContinuesThroughWater(to, type, allSegments);
    if (isWaterHex(from) && isWaterHex(to) && !fromContinues && !toContinues) return null;

    return {
      from: isWaterHex(from) && !fromContinues ? pointWhereLineLeavesHex(to, from.center) : from.center,
      to: isWaterHex(to) && !toContinues ? pointWhereLineLeavesHex(from, to.center) : to.center
    };
  }

  function transportContinuesThroughWater(hex, type, allSegments) {
    if (!isWaterHex(hex)) return true;
    return allSegments.filter(segment => (
      segment.Overlay_Type === type &&
      (segment.From_Hex_ID_Ref === hex.id || segment.To_Hex_ID_Ref === hex.id)
    )).length >= 2;
  }

  function getCanvasRiverPathStrings(segments) {
    const riverGraph = buildVisibleRiverGraph(segments);
    const visited = new Set();
    const paths = [];

    const starts = [...riverGraph.graph.keys()].filter(nodeId => (riverGraph.graph.get(nodeId)?.size || 0) !== 2);
    starts.forEach(start => {
      [...riverGraph.graph.get(start)].forEach(next => {
        if (visited.has(overlayEdgeVisitKey(start, next))) return;
        paths.push(pathForRiverNodeChain(traceRiverNodeChain(start, next, riverGraph.graph, visited), riverGraph.points));
      });
    });

    riverGraph.edges.forEach(edge => {
      if (visited.has(overlayEdgeVisitKey(edge.from, edge.to))) return;
      paths.push(pathForRiverNodeChain(traceRiverNodeChain(edge.from, edge.to, riverGraph.graph, visited), riverGraph.points));
    });

    return paths.filter(Boolean);
  }

  function buildVisibleRiverGraph(segments) {
    const graph = new Map();
    const points = new Map();
    const edges = [];

    segments.forEach(segment => {
      const fromHex = renderer.hexes.find(hex => hex.id === segment.From_Hex_ID_Ref);
      const toHex = renderer.hexes.find(hex => hex.id === segment.To_Hex_ID_Ref);
      if (!fromHex || !toHex) return;
      if (isWaterHex(fromHex) && isWaterHex(toHex)) return;

      const fromNode = isWaterHex(fromHex)
        ? `${segment.__uuid || segment.From_Hex_ID_Ref}:water-from`
        : fromHex.id;
      const toNode = isWaterHex(toHex)
        ? `${segment.__uuid || segment.To_Hex_ID_Ref}:water-to`
        : toHex.id;

      const fromPoint = isWaterHex(fromHex)
        ? pointWhereLineLeavesHex(toHex, fromHex.center)
        : fromHex.center;
      const toPoint = isWaterHex(toHex)
        ? pointWhereLineLeavesHex(fromHex, toHex.center)
        : toHex.center;

      points.set(fromNode, fromPoint);
      points.set(toNode, toPoint);
      addGraphEdge(graph, fromNode, toNode);
      edges.push({ from: fromNode, to: toNode });
    });

    return { graph, points, edges };
  }

  function addGraphEdge(graph, from, to) {
    if (!from || !to || from === to) return;
    if (!graph.has(from)) graph.set(from, new Set());
    if (!graph.has(to)) graph.set(to, new Set());
    graph.get(from).add(to);
    graph.get(to).add(from);
  }

  function traceRiverNodeChain(start, next, graph, visited) {
    const chain = [start, next];
    visited.add(overlayEdgeVisitKey(start, next));

    let previous = start;
    let current = next;

    while ((graph.get(current)?.size || 0) === 2) {
      const onward = [...graph.get(current)].find(nodeId => nodeId !== previous);
      if (!onward || visited.has(overlayEdgeVisitKey(current, onward))) break;
      chain.push(onward);
      visited.add(overlayEdgeVisitKey(current, onward));
      previous = current;
      current = onward;
    }

    return chain;
  }

  function pathForRiverNodeChain(chain, pointsByNodeId) {
    const points = chain.map(nodeId => pointsByNodeId.get(nodeId)).filter(Boolean);
    if (points.length < 2) return "";
    if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

    const commands = [`M ${points[0].x} ${points[0].y}`];
    for (let index = 1; index < points.length - 1; index += 1) {
      const current = points[index];
      const next = points[index + 1];
      const mid = {
        x: current.x + (next.x - current.x) * 0.42,
        y: current.y + (next.y - current.y) * 0.42
      };
      commands.push(`Q ${current.x} ${current.y} ${mid.x} ${mid.y}`);
    }
    const last = points[points.length - 1];
    commands.push(`T ${last.x} ${last.y}`);
    return commands.join(" ");
  }

  function curvedSegmentPath(from, to, seed) {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy) || 1;
    const bend = Math.min(18, distance * 0.18);
    const direction = stableHash(seed) % 2 ? 1 : -1;
    const cx = (from.x + to.x) / 2 + (-dy / distance) * bend * direction;
    const cy = (from.y + to.y) / 2 + (dx / distance) * bend * direction;
    return `M ${from.x} ${from.y} Q ${cx} ${cy} ${to.x} ${to.y}`;
  }

  function getRegionBorderColor(regionId) {
    if (!regionId || isUnclaimedRegion(regionId)) return "";

    const colorKey = String(db?.regionsById?.[regionId]?.Border_Color || "gold")
      .trim()
      .toLowerCase();
    if (colorKey === "none") return "";
    if (/^#[0-9a-f]{6}$/.test(colorKey)) return colorKey;
    return REGION_BORDER_COLORS[colorKey] || REGION_BORDER_COLORS.gold;
  }

  function isUnclaimedRegion(regionId) {
    return regionId === UNCLAIMED_REGION_REF || db?.regionsById?.[regionId]?.Region_ID === UNCLAIMED_REGION_REF;
  }

  function getPoiGlyph(poi) {
    const type = String(poi?.POI_Type || "")
      .trim()
      .toLowerCase()
      .replaceAll(/\s+/g, "_");

    return POI_GLYPHS[type] || POI_GLYPHS[type.replaceAll("_", "")] || "✦";
  }

  function buildGridPath(hexes) {
    const drawn = new Set();
    const commands = [];

    hexes.forEach(hex => {
      hex.points.forEach((point, index) => {
        const next = hex.points[(index + 1) % hex.points.length];
        const key = edgeKey(point, next);
        if (drawn.has(key)) return;
        drawn.add(key);
        commands.push(`M ${point.x} ${point.y} L ${next.x} ${next.y}`);
      });
    });

    return commands.join(" ");
  }

  function getTransportChainPoint(hexId, index, chain, type) {
    const hex = renderer.hexes.find(candidate => candidate.id === hexId);
    if (!hex) return null;
    if (!isWaterHex(hex)) return hex.center;

    const sameTypeSegments = (renderer.mapOverlays || []).filter(overlay => overlay.Overlay_Type === type);
    if (transportContinuesThroughWater(hex, type, sameTypeSegments)) return hex.center;

    const neighborId = index === 0 ? chain[1] : chain[index - 1];
    const neighborHex = renderer.hexes.find(candidate => candidate.id === neighborId);
    if (!neighborHex || isWaterHex(neighborHex)) return null;

    return pointWhereLineLeavesHex(neighborHex, hex.center);
  }

  function getSnapHexIdsForPathType(type) {
    if (!["road", "path"].includes(type)) return new Set();

    const counts = {
      road: new Map(),
      path: new Map()
    };

    (renderer.mapOverlays || []).forEach(overlay => {
      if (!["road", "path"].includes(overlay.Overlay_Type)) return;
      [overlay.From_Hex_ID_Ref, overlay.To_Hex_ID_Ref].forEach(hexId => {
        if (!hexId) return;
        const typeCounts = counts[overlay.Overlay_Type];
        typeCounts.set(hexId, (typeCounts.get(hexId) || 0) + 1);
      });
    });

    const snapHexIds = new Set();
    new Set([...counts.road.keys(), ...counts.path.keys()]).forEach(hexId => {
      const roadCount = counts.road.get(hexId) || 0;
      const pathCount = counts.path.get(hexId) || 0;
      if ((roadCount && pathCount) || roadCount >= 3 || pathCount >= 3) {
        snapHexIds.add(hexId);
      }
    });

    return snapHexIds;
  }

  function getVisibleBounds(buffer = getGeneratedMapDimensions().radius * 2) {
    const rect = renderer.root.getBoundingClientRect();
    return {
      left: renderer.view.panX - buffer,
      right: renderer.view.panX + (rect.width / renderer.view.zoom) + buffer,
      top: renderer.view.panY - buffer,
      bottom: renderer.view.panY + (rect.height / renderer.view.zoom) + buffer
    };
  }

  function getVisibleHexes() {
    const bounds = getVisibleBounds();
    return renderer.hexes.filter(hex => hexIntersectsBounds(hex, bounds));
  }

  function hexIntersectsBounds(hex, bounds) {
    return !(
      hex.center.x + getGeneratedMapDimensions().radius < bounds.left ||
      hex.center.x - getGeneratedMapDimensions().radius > bounds.right ||
      hex.center.y + getGeneratedMapDimensions().hexHeight * 0.5 < bounds.top ||
      hex.center.y - getGeneratedMapDimensions().hexHeight * 0.5 > bounds.bottom
    );
  }

  function edgeKey(a, b) {
    const first = `${Math.round(a.x * 100)}:${Math.round(a.y * 100)}`;
    const second = `${Math.round(b.x * 100)}:${Math.round(b.y * 100)}`;
    return first < second ? `${first}|${second}` : `${second}|${first}`;
  }

  function clientToWorld(event) {
    const rect = renderer.root.getBoundingClientRect();
    return {
      x: renderer.view.panX + (event.clientX - rect.left) / renderer.view.zoom,
      y: renderer.view.panY + (event.clientY - rect.top) / renderer.view.zoom
    };
  }

  function worldToClient(point) {
    return {
      x: (point.x - renderer.view.panX) * renderer.view.zoom,
      y: (point.y - renderer.view.panY) * renderer.view.zoom
    };
  }

  function getHexAtWorldPoint(point) {
    return renderer.hexes.find(hex => pointInPolygon(point, hex.points)) || null;
  }

  function pointInPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].x;
      const yi = polygon[i].y;
      const xj = polygon[j].x;
      const yj = polygon[j].y;
      const intersects = ((yi > point.y) !== (yj > point.y)) &&
        (point.x < (xj - xi) * (point.y - yi) / ((yj - yi) || 1) + xi);
      if (intersects) inside = !inside;
    }
    return inside;
  }

  function handleWheel(event) {
    if (!isActive()) return;
    event.preventDefault();
    event.stopPropagation();

    const now = performance.now();
    if (now < renderer.view.wheelLockedUntil) return;

    const nextZoom = getNextZoomStep(event.deltaY < 0 ? 1 : -1);
    renderer.view.wheelLockedUntil = now + 165;
    animateZoomTo(nextZoom, event.clientX, event.clientY);
  }

  function getNextZoomStep(direction) {
    const current = renderer.view.zoom;

    if (direction > 0) {
      return ZOOM_STEPS.find(step => step > current + 0.01) || MAX_ZOOM;
    }

    return [...ZOOM_STEPS].reverse().find(step => step < current - 0.01) || MIN_ZOOM;
  }

  function setZoom(nextZoom, anchorClientX = null, anchorClientY = null) {
    const rect = renderer.root.getBoundingClientRect();
    const oldZoom = renderer.view.zoom;
    const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    const anchorX = anchorClientX == null ? rect.width / 2 : anchorClientX - rect.left;
    const anchorY = anchorClientY == null ? rect.height / 2 : anchorClientY - rect.top;
    const worldX = renderer.view.panX + anchorX / oldZoom;
    const worldY = renderer.view.panY + anchorY / oldZoom;

    renderer.view.zoom = clampedZoom;
    renderer.view.panX = worldX - anchorX / clampedZoom;
    renderer.view.panY = worldY - anchorY / clampedZoom;
    render();
  }

  function animateZoomTo(nextZoom, anchorClientX = null, anchorClientY = null) {
    const startZoom = renderer.view.zoom;
    const targetZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
    if (Math.abs(targetZoom - startZoom) < 0.0001) return;

    if (renderer.view.zoomAnimationFrame) {
      cancelAnimationFrame(renderer.view.zoomAnimationFrame);
      renderer.view.zoomAnimationFrame = null;
    }

    const rect = renderer.root.getBoundingClientRect();
    const anchorScreenX = anchorClientX === null ? rect.left + rect.width / 2 : anchorClientX;
    const anchorScreenY = anchorClientY === null ? rect.top + rect.height / 2 : anchorClientY;
    const relativeX = anchorScreenX - rect.left;
    const relativeY = anchorScreenY - rect.top;
    const anchorWorldX = renderer.view.panX + relativeX / startZoom;
    const anchorWorldY = renderer.view.panY + relativeY / startZoom;
    const duration = 145;
    const startedAt = performance.now();

    renderer.view.animatingZoom = true;

    function step(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const zoom = startZoom + (targetZoom - startZoom) * eased;

      renderer.view.zoom = zoom;
      renderer.view.panX = anchorWorldX - relativeX / zoom;
      renderer.view.panY = anchorWorldY - relativeY / zoom;
      clampView();
      render();

      if (progress < 1) {
        renderer.view.zoomAnimationFrame = requestAnimationFrame(step);
        return;
      }

      renderer.view.zoomAnimationFrame = null;
      renderer.view.animatingZoom = false;
      renderer.cacheDirty = true;
      setZoom(targetZoom, anchorClientX, anchorClientY);
    }

    renderer.view.zoomAnimationFrame = requestAnimationFrame(step);
  }

  function rememberTouchPointer(event) {
    if (event.pointerType !== "touch") return false;

    renderer.view.touchPointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (renderer.view.touchPointers.size >= 2) {
      beginPinchZoom();
      return true;
    }

    return renderer.view.pinching;
  }

  function updateTouchPointer(event) {
    if (event.pointerType !== "touch" || !renderer.view.touchPointers.has(event.pointerId)) {
      return false;
    }

    renderer.view.touchPointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    if (renderer.view.pinching) {
      applyPinchZoom();
      return true;
    }

    return false;
  }

  function forgetTouchPointer(event) {
    if (event.pointerType !== "touch") return false;

    const wasPinching = renderer.view.pinching;
    renderer.view.touchPointers.delete(event.pointerId);

    if (wasPinching && renderer.view.touchPointers.size < 2) {
      endPinchZoom();
    }

    return wasPinching;
  }

  function getPinchPointers() {
    return [...renderer.view.touchPointers.values()].slice(0, 2);
  }

  function getPointerDistance(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function getPointerMidpoint(a, b) {
    return {
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2
    };
  }

  function beginPinchZoom() {
    const [first, second] = getPinchPointers();
    if (!first || !second) return;

    if (renderer.view.zoomAnimationFrame) {
      cancelAnimationFrame(renderer.view.zoomAnimationFrame);
      renderer.view.zoomAnimationFrame = null;
    }

    const rect = renderer.root.getBoundingClientRect();
    const midpoint = getPointerMidpoint(first, second);
    const relativeX = midpoint.x - rect.left;
    const relativeY = midpoint.y - rect.top;

    renderer.view.pinching = true;
    renderer.view.dragging = false;
    renderer.view.dragMoved = true;
    renderer.view.animatingZoom = false;
    renderer.view.pinchStartDistance = Math.max(1, getPointerDistance(first, second));
    renderer.view.pinchStartZoom = renderer.view.zoom;
    renderer.view.pinchAnchorWorldX = renderer.view.panX + relativeX / renderer.view.zoom;
    renderer.view.pinchAnchorWorldY = renderer.view.panY + relativeY / renderer.view.zoom;
    renderer.view.suppressClickUntil = performance.now() + 450;

    renderer.drawing.dragLastHexId = null;
    renderer.drawing.paintedThisDrag = new Set();
  }

  function applyPinchZoom() {
    const [first, second] = getPinchPointers();
    if (!first || !second) return;

    const distance = Math.max(1, getPointerDistance(first, second));
    const ratio = distance / Math.max(1, renderer.view.pinchStartDistance);
    const nextZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, renderer.view.pinchStartZoom * ratio));
    const rect = renderer.root.getBoundingClientRect();
    const midpoint = getPointerMidpoint(first, second);
    const relativeX = midpoint.x - rect.left;
    const relativeY = midpoint.y - rect.top;

    renderer.view.zoom = nextZoom;
    renderer.view.panX = renderer.view.pinchAnchorWorldX - relativeX / nextZoom;
    renderer.view.panY = renderer.view.pinchAnchorWorldY - relativeY / nextZoom;
    renderer.view.dragMoved = true;
    renderer.view.suppressClickUntil = performance.now() + 450;

    clampView();
    render();
  }

  function endPinchZoom() {
    renderer.view.pinching = false;
    renderer.view.dragging = false;
    renderer.view.dragMoved = true;
    renderer.view.touchPointers.clear();
    renderer.view.suppressClickUntil = performance.now() + 450;
  }

  function handlePointerDown(event) {
    if (!isActive()) return;
    event.stopPropagation();

    if (rememberTouchPointer(event)) {
      event.preventDefault();
      renderer.root.setPointerCapture?.(event.pointerId);
      return;
    }

    if (renderer.drawing.enabled && (event.button === 1 || event.button === 2)) {
      renderer.view.dragging = true;
      renderer.view.dragMoved = false;
      renderer.view.lastX = event.clientX;
      renderer.view.lastY = event.clientY;
      renderer.root.setPointerCapture?.(event.pointerId);
      return;
    }

    if (renderer.drawing.enabled) {
      event.preventDefault();
      renderer.root.setPointerCapture?.(event.pointerId);
      renderer.drawing.paintedThisDrag = new Set();
      applyDrawingAtEvent(event);
      return;
    }

    renderer.view.dragging = true;
    renderer.view.dragMoved = false;
    renderer.view.lastX = event.clientX;
    renderer.view.lastY = event.clientY;
    renderer.root.setPointerCapture?.(event.pointerId);
  }

  function handlePointerMove(event) {
    if (!isActive()) return;
    event.stopPropagation();

    if (updateTouchPointer(event)) {
      event.preventDefault();
      return;
    }

    if (renderer.drawing.enabled && renderer.view.dragging) {
      const dx = event.clientX - renderer.view.lastX;
      const dy = event.clientY - renderer.view.lastY;
      renderer.view.lastX = event.clientX;
      renderer.view.lastY = event.clientY;
      renderer.view.panX -= dx / renderer.view.zoom;
      renderer.view.panY -= dy / renderer.view.zoom;
      renderer.view.dragMoved = renderer.view.dragMoved || Math.abs(dx) + Math.abs(dy) > 3;
      render();
      return;
    }

    if (renderer.drawing.enabled) {
      event.preventDefault();
      const hex = getHexAtWorldPoint(clientToWorld(event));
      const nextHoverEdge = renderer.drawing.tool === "wall" && hex
        ? { hexId: hex.id, edge: nearestEdgeFromWorldPoint(clientToWorld(event), hex) }
        : null;

      const hoverChanged = JSON.stringify(renderer.drawing.hoverEdge) !== JSON.stringify(nextHoverEdge);
      renderer.drawing.hoverEdge = nextHoverEdge;

      if ((PATH_OVERLAY_TYPES.has(renderer.drawing.tool) || REGION_PAINT_TYPES.has(renderer.drawing.tool) || renderer.drawing.tool === "terrain") && (event.buttons & 1) === 1) {
        applyDrawingAtEvent(event, true);
        return;
      }

      if (hoverChanged) renderSvgOnly();
      return;
    }

    if (renderer.view.dragging) {
      const dx = event.clientX - renderer.view.lastX;
      const dy = event.clientY - renderer.view.lastY;
      renderer.view.lastX = event.clientX;
      renderer.view.lastY = event.clientY;
      renderer.view.panX -= dx / renderer.view.zoom;
      renderer.view.panY -= dy / renderer.view.zoom;
      renderer.view.dragMoved = renderer.view.dragMoved || Math.abs(dx) + Math.abs(dy) > 3;
      render();
      return;
    }

    const hovered = getHexAtWorldPoint(clientToWorld(event));
    const nextHoverId = hovered?.id || null;
    if (renderer.hoveredHexId !== nextHoverId) {
      renderer.hoveredHexId = nextHoverId;
      render();
    }
  }

  function handlePointerUp(event) {
    if (!isActive()) return;
    event.stopPropagation();

    if (forgetTouchPointer(event)) {
      event.preventDefault();
      renderer.root.releasePointerCapture?.(event.pointerId);
      renderSvgOnly();
      return;
    }

    if (renderer.drawing.enabled) {
      renderer.view.dragging = false;
      renderer.drawing.dragLastHexId = null;
      renderer.drawing.paintedThisDrag = new Set();
      renderer.root.releasePointerCapture?.(event.pointerId);
      renderSvgOnly();
      return;
    }
    renderer.view.dragging = false;
    renderer.root.releasePointerCapture?.(event.pointerId);
  }

  function handlePointerCancel(event) {
    handlePointerUp(event);
  }

  function handleClick(event) {
    if (!isActive()) return;
    event.stopPropagation();

    if (renderer.view.pinching || performance.now() < renderer.view.suppressClickUntil) {
      event.preventDefault();
      return;
    }

    if (renderer.drawing.enabled) {
      event.preventDefault();
      return;
    }

    if (renderer.view.dragMoved) {
      renderer.view.dragMoved = false;
      return;
    }

    const hex = getHexAtWorldPoint(clientToWorld(event));
    closePanel?.({ syncHistory: false });
    document.getElementById("codex-button")?.classList.remove("codex-label-visible");

    if (!hex) {
      clearSelection();
      selectedHexId = null;
      return;
    }

    selectGeneratedHex(hex.id);
  }

  function applyDrawingAtEvent(event, fromDrag = false) {
    if (renderer.drawing.saving) return;

    const point = clientToWorld(event);
    const hex = getHexAtWorldPoint(point);
    if (!hex) return;

    const tool = renderer.drawing.tool;
    const dragKey = `${tool}:${hex.id}`;
    if (fromDrag && renderer.drawing.paintedThisDrag.has(dragKey)) return;
    renderer.drawing.paintedThisDrag.add(dragKey);

    if (PATH_OVERLAY_TYPES.has(tool)) {
      const previousHexId = renderer.drawing.dragLastHexId || renderer.drawing.lastHexId;
      renderer.drawing.dragLastHexId = hex.id;
      renderer.drawing.lastHexId = hex.id;
      if (!previousHexId || previousHexId === hex.id) {
        renderSvgOnly();
        return;
      }
      persistPathOverlaySequence(tool, previousHexId, hex.id);
      return;
    }

    if (tool === "wall") {
      persistWallOverlay(hex.id, nearestEdgeFromWorldPoint(point, hex));
      return;
    }

    if (tool === "region") {
      assignHexRegion(hex.id, renderer.drawing.regionId, "geographic");
      return;
    }

    if (tool === "unregion") {
      assignHexRegion(hex.id, UNCLAIMED_REGION_REF, "geographic");
      return;
    }

    if (tool === "political-region") {
      assignHexRegion(hex.id, renderer.drawing.politicalRegionId, "political");
      return;
    }

    if (tool === "clear-political-region") {
      assignHexRegion(hex.id, "", "political");
      return;
    }

    if (tool === "terrain") {
      updateGeneratedHexTerrain(hex.id);
      return;
    }

    if (tool === "terrain-eyedropper") {
      pickTerrainFromHex(hex.id);
      return;
    }

    if (tool === "erase") {
      eraseOverlaysAtHex(hex.id);
    }
  }

  async function updateGeneratedHexTerrain(hexId) {
    const campaign = getActiveCampaign?.();
    if (!campaign || !hexId) return;
    const before = getTerrainSnapshot(hexId);
    if (!before) return;
    const targetBase = renderer.drawing.terrainBase === "feature_only"
      ? before.baseTerrain
      : renderer.drawing.terrainBase;
    const features = getValidTerrainFeatures(renderer.drawing.terrainBase, renderer.drawing.terrainFeatures);
    const targetElevation = renderer.drawing.terrainBase === "feature_only"
      ? before.elevation
      : renderer.drawing.terrainElevation === "auto"
        ? getAutoTerrainElevation(targetBase, features)
        : renderer.drawing.terrainElevation;

    renderer.drawing.saving = true;

    try {
      const { data, error } = await campaignSupabase.rpc("update_generated_hex_terrain", {
        target_campaign_id: campaign.id,
        target_hex_ref: hexId,
        target_base_terrain: targetBase,
        target_terrain_features: features,
        target_elevation: targetElevation
      });

      if (error) throw error;

      updateLocalHexTerrain(hexId, data, {
        baseTerrain: targetBase,
        features,
        elevation: targetElevation
      });
      const after = getTerrainSnapshot(hexId);
      if (after && JSON.stringify(before) !== JSON.stringify(after)) {
        pushMapEditAction({
          type: "terrain",
          hexId,
          before,
          after
        });
      }
      renderer.cacheDirty = true;
      render();
    } catch (error) {
      console.error("Unable to update generated hex terrain:", error);
      window.alert?.(error.message || "Unable to update hex terrain.");
    } finally {
      renderer.drawing.saving = false;
    }
  }

  function getValidTerrainFeatures(baseTerrain, features) {
    const valid = new Set(getValidFeaturesForTerrainSelection(baseTerrain));
    return normalizeTerrainFeatureSelection(features)
      .filter(feature => valid.has(feature))
      .slice(0, 3);
  }

  function pickTerrainFromHex(hexId) {
    const snapshot = getTerrainSnapshot(hexId);
    if (!snapshot) return;
    renderer.drawing.terrainBase = snapshot.baseTerrain || "plains";
    renderer.drawing.terrainFeatures = getValidTerrainFeatures(renderer.drawing.terrainBase, snapshot.features);
    renderer.drawing.terrainElevation = snapshot.elevation;
    updateTerrainControls();
  }

  function getTerrainSnapshot(hexId) {
    const hex = renderer.hexes.find(candidate => candidate.id === hexId);
    if (!hex) return null;
    return {
      baseTerrain: hex.baseTerrain,
      features: [...new Set(hex.features || [])].slice(0, 3),
      elevation: Number.isFinite(Number(hex.elevation)) ? Number(hex.elevation) : 0
    };
  }

  function updateLocalHexTerrain(hexId, rpcRow, fallback) {
    const record = Array.isArray(rpcRow) ? rpcRow[0] : rpcRow;
    const baseTerrain = record?.base_terrain || fallback.baseTerrain;
    const features = Array.isArray(record?.terrain_features) ? record.terrain_features : fallback.features;
    const elevation = Number.isFinite(Number(record?.elevation)) ? Number(record.elevation) : fallback.elevation;
    const terrainLabel = record?.terrain || getGeneratedTerrainLabel(baseTerrain, features);

    const renderedHex = renderer.hexes.find(hex => hex.id === hexId);
    if (renderedHex) {
      renderedHex.baseTerrain = baseTerrain;
      renderedHex.features = features;
      renderedHex.elevation = elevation;
      renderedHex.fill = TERRAIN_COLORS[baseTerrain] || renderedHex.fill;
      if (renderedHex.record) {
        renderedHex.record.Base_Terrain = baseTerrain;
        renderedHex.record.Terrain_Features = features;
        renderedHex.record.Elevation = String(elevation);
        renderedHex.record.Terrain = terrainLabel;
      }
    }

    const rawHex = db?.raw?.hexes?.find(hex => hex.Hex_ID === hexId);
    if (rawHex) {
      rawHex.Base_Terrain = baseTerrain;
      rawHex.Terrain_Features = features;
      rawHex.Elevation = String(elevation);
      rawHex.Terrain = terrainLabel;
    }

    if (db?.hexesById?.[hexId]) {
      db.hexesById[hexId].Base_Terrain = baseTerrain;
      db.hexesById[hexId].Terrain_Features = features;
      db.hexesById[hexId].Elevation = String(elevation);
      db.hexesById[hexId].Terrain = terrainLabel;
    }

    if (renderer.selectedHexId === hexId && renderer.popup && !renderer.popup.hidden) {
      showPopup(hexId);
    }
  }

  function getGeneratedTerrainLabel(baseTerrain, features) {
    if (typeof getCodexGeneratedTerrainName === "function") {
      return getCodexGeneratedTerrainName(baseTerrain, features);
    }

    const baseLabel = BASE_TERRAIN_OPTIONS.find(([base]) => base === baseTerrain)?.[1] || baseTerrain || "Unknown";
    const featureLabels = getValidTerrainFeatures(baseTerrain, features)
      .map(feature => TERRAIN_FEATURE_LABELS[feature])
      .filter(Boolean);
    return featureLabels.length ? `${baseLabel} + ${featureLabels.join(" + ")}` : baseLabel;
  }

  async function assignHexRegion(hexId, regionId = "", regionType = "geographic") {
    const campaign = getActiveCampaign?.();
    if (!campaign || !hexId) return;
    if (regionType !== "political" && !regionId) return;
    const before = getRegionSnapshot(hexId);

    try {
      const { error } = await campaignSupabase.rpc("assign_generated_hex_region_layer", {
        target_campaign_id: campaign.id,
        target_hex_ref: hexId,
        target_region_ref: regionId,
        target_region_type: regionType
      });

      if (error) throw error;

      updateLocalHexRegion(hexId, regionId, regionType);
      const after = getRegionSnapshot(hexId);
      if (before && after && JSON.stringify(before) !== JSON.stringify(after)) {
        pushMapEditAction({
          type: "region",
          hexId,
          regionType,
          before,
          after
        });
      }
      renderSvgOnly();
    } catch (error) {
      console.error("Unable to assign generated hex region:", error);
      window.alert?.(error.message || "Unable to assign hex region.");
    }
  }

  function getRegionSnapshot(hexId) {
    const hex = renderer.hexes.find(candidate => candidate.id === hexId);
    if (!hex) return null;
    return {
      geographicRegionId: hex.regionId || "",
      politicalRegionId: hex.politicalRegionId || ""
    };
  }

  function updateLocalHexRegion(hexId, regionId, regionType = "geographic") {
    const renderedHex = renderer.hexes.find(hex => hex.id === hexId);
    if (renderedHex) {
      if (regionType === "political") {
        renderedHex.politicalRegionId = regionId;
        if (renderedHex.record) renderedHex.record.Political_Region_ID_Ref = regionId;
      } else {
        renderedHex.regionId = regionId;
        if (renderedHex.record) renderedHex.record.Region_ID_Ref = regionId;
      }
    }

    const rawHex = db?.raw?.hexes?.find(hex => hex.Hex_ID === hexId);
    if (rawHex) {
      if (regionType === "political") rawHex.Political_Region_ID_Ref = regionId;
      else rawHex.Region_ID_Ref = regionId;
    }

    if (db?.hexesById?.[hexId]) {
      if (regionType === "political") db.hexesById[hexId].Political_Region_ID_Ref = regionId;
      else db.hexesById[hexId].Region_ID_Ref = regionId;
    }

    if (renderer.selectedHexId === hexId && renderer.popup && !renderer.popup.hidden) {
      showPopup(hexId);
    }
  }

  async function persistPathOverlaySequence(tool, fromHexId, toHexId) {
    const sequence = getHexLineSequence(fromHexId, toHexId);
    const action = [];
    for (let index = 0; index < sequence.length - 1; index += 1) {
      const overlay = await persistPathOverlay(tool, sequence[index], sequence[index + 1]);
      if (overlay) action.push(overlay);
    }
    pushOverlayUndoAction(action);
  }

  async function persistPathOverlay(tool, fromHexId, toHexId) {
    const campaign = getActiveCampaign?.();
    if (!campaign) return;

    renderer.drawing.saving = true;

    try {
      const { data, error } = await campaignSupabase.rpc("add_generated_map_overlay", {
        target_campaign_id: campaign.id,
        target_overlay_type: tool,
        from_hex_ref: fromHexId,
        to_hex_ref: toHexId,
        target_edge: null,
        target_style: tool === "river" ? "river" : renderer.drawing.roadStyle
      });

      if (error) throw error;

      const overlay = adaptOverlayRpcRow(data);
      upsertLocalOverlay(overlay);
      renderer.cacheDirty = true;
      render();
      return overlay;
    } catch (error) {
      console.error("Unable to save generated map overlay:", error);
      window.alert?.(error.message || "Unable to save map overlay.");
      return null;
    } finally {
      renderer.drawing.saving = false;
      updateDrawUndoButton();
      updateDrawRedoButton();
    }
  }

  async function persistWallOverlay(hexId, edge) {
    const campaign = getActiveCampaign?.();
    if (!campaign || !edge) return;

    renderer.drawing.saving = true;

    try {
      const existed = renderer.mapOverlays.some(overlay => (
        overlay.Overlay_Type === "wall" &&
        overlay.Hex_ID_Ref === hexId &&
        overlay.Edge === edge
      ));

      const { data, error } = await campaignSupabase.rpc("add_generated_map_overlay", {
        target_campaign_id: campaign.id,
        target_overlay_type: "wall",
        from_hex_ref: hexId,
        to_hex_ref: null,
        target_edge: edge,
        target_style: "wall"
      });

      if (error) throw error;

      if (existed) {
        const removed = removeLocalWallOverlay(hexId, edge);
        pushOverlayUndoAction(removed.map(overlay => ({ ...overlay, __undoDeleted: true })));
      } else {
        const overlay = adaptOverlayRpcRow(data);
        upsertLocalOverlay(overlay);
        pushOverlayUndoAction([overlay]);
      }
      renderSvgOnly();
    } catch (error) {
      console.error("Unable to save generated map wall:", error);
      window.alert?.(error.message || "Unable to save map wall.");
    } finally {
      renderer.drawing.saving = false;
      updateDrawUndoButton();
      updateDrawRedoButton();
    }
  }

  async function eraseOverlaysAtHex(hexId) {
    const campaign = getActiveCampaign?.();
    if (!campaign) return;

    renderer.drawing.saving = true;

    try {
      const { error } = await campaignSupabase.rpc("erase_generated_map_overlays_at_hex", {
        target_campaign_id: campaign.id,
        target_hex_ref: hexId
      });

      if (error) throw error;

      const removed = renderer.mapOverlays.filter(overlay => (
        overlay.From_Hex_ID_Ref === hexId ||
        overlay.To_Hex_ID_Ref === hexId ||
        overlay.Hex_ID_Ref === hexId
      ));
      renderer.mapOverlays = renderer.mapOverlays.filter(overlay => (
        overlay.From_Hex_ID_Ref !== hexId &&
        overlay.To_Hex_ID_Ref !== hexId &&
        overlay.Hex_ID_Ref !== hexId
      ));
      if (db?.raw?.generatedMapOverlays) db.raw.generatedMapOverlays = renderer.mapOverlays;
      pushOverlayUndoAction(removed.map(overlay => ({ ...overlay, __undoDeleted: true })));
      renderer.cacheDirty = true;
      render();
    } catch (error) {
      console.error("Unable to erase generated map overlays:", error);
      window.alert?.(error.message || "Unable to erase map overlays.");
    } finally {
      renderer.drawing.saving = false;
      updateDrawUndoButton();
      updateDrawRedoButton();
    }
  }

  function pushOverlayUndoAction(overlays) {
    const valid = (overlays || []).filter(overlay => overlay?.__uuid);
    if (!valid.length) return;
    pushMapEditAction({ type: "overlay", overlays: valid });
  }

  function pushMapEditAction(action) {
    if (!action?.type) return;
    renderer.drawing.undoStack.push(action);
    renderer.drawing.redoStack = [];
    updateDrawUndoButton();
    updateDrawRedoButton();
  }

  async function undoLastDrawAction() {
    const campaign = getActiveCampaign?.();
    const action = renderer.drawing.undoStack.pop();
    if (!campaign || !action?.type) {
      updateDrawUndoButton();
      return;
    }

    renderer.drawing.saving = true;
    const showBulkLoading = getMapEditActionSize(action) >= BULK_OVERLAY_LOADING_THRESHOLD;
    if (showBulkLoading) setLoading(true);
    updateDrawUndoButton();
    updateDrawRedoButton();

    try {
      await applyMapEditAction(campaign.id, action, "undo");
      renderer.drawing.redoStack.push(action);
      renderer.cacheDirty = true;
      render();
    } catch (error) {
      console.error("Unable to undo generated map edit:", error);
      window.alert?.(error.message || "Unable to undo map edit.");
    } finally {
      renderer.drawing.saving = false;
      if (showBulkLoading) setLoading(false);
      updateDrawUndoButton();
      updateDrawRedoButton();
    }
  }

  async function redoLastDrawAction() {
    const campaign = getActiveCampaign?.();
    const action = renderer.drawing.redoStack.pop();
    if (!campaign || !action?.type) {
      updateDrawRedoButton();
      return;
    }

    renderer.drawing.saving = true;
    const showBulkLoading = getMapEditActionSize(action) >= BULK_OVERLAY_LOADING_THRESHOLD;
    if (showBulkLoading) setLoading(true);
    updateDrawUndoButton();
    updateDrawRedoButton();

    try {
      await applyMapEditAction(campaign.id, action, "redo");
      renderer.drawing.undoStack.push(action);
      renderer.cacheDirty = true;
      render();
    } catch (error) {
      console.error("Unable to redo generated map edit:", error);
      window.alert?.(error.message || "Unable to redo map edit.");
    } finally {
      renderer.drawing.saving = false;
      if (showBulkLoading) setLoading(false);
      updateDrawUndoButton();
      updateDrawRedoButton();
    }
  }

  function getMapEditActionSize(action) {
    if (action?.type === "overlay") return action.overlays?.length || 0;
    return 1;
  }

  async function applyMapEditAction(campaignId, action, direction) {
    if (action.type === "overlay") {
      await applyOverlayHistoryAction(campaignId, action.overlays || [], direction);
      return;
    }

    if (action.type === "terrain") {
      const snapshot = direction === "undo" ? action.before : action.after;
      await applyTerrainSnapshot(campaignId, action.hexId, snapshot);
      return;
    }

    if (action.type === "region") {
      const snapshot = direction === "undo" ? action.before : action.after;
      await applyRegionSnapshot(campaignId, action.hexId, snapshot);
    }
  }

  async function applyOverlayHistoryAction(campaignId, overlays, direction) {
    for (const overlay of overlays) {
      const shouldDelete = direction === "redo" ? overlay.__undoDeleted : !overlay.__undoDeleted;
      if (shouldDelete) {
        await deleteOverlayById(campaignId, overlay.__uuid);
        removeLocalOverlayById(overlay.__uuid);
      } else {
        const restored = await restoreDeletedOverlay(campaignId, overlay);
        if (restored?.__uuid) overlay.__uuid = restored.__uuid;
      }
    }
  }

  async function applyTerrainSnapshot(campaignId, hexId, snapshot) {
    if (!snapshot) return;
    const { data, error } = await campaignSupabase.rpc("update_generated_hex_terrain", {
      target_campaign_id: campaignId,
      target_hex_ref: hexId,
      target_base_terrain: snapshot.baseTerrain,
      target_terrain_features: snapshot.features || [],
      target_elevation: snapshot.elevation
    });
    if (error) throw error;
    updateLocalHexTerrain(hexId, data, snapshot);
  }

  async function applyRegionSnapshot(campaignId, hexId, snapshot) {
    if (!snapshot) return;
    const updates = [
      ["geographic", snapshot.geographicRegionId || UNCLAIMED_REGION_REF],
      ["political", snapshot.politicalRegionId || ""]
    ];

    for (const [regionType, regionId] of updates) {
      const { error } = await campaignSupabase.rpc("assign_generated_hex_region_layer", {
        target_campaign_id: campaignId,
        target_hex_ref: hexId,
        target_region_ref: regionId,
        target_region_type: regionType
      });
      if (error) throw error;
      updateLocalHexRegion(hexId, regionId, regionType);
    }
  }

  async function clearAllDrawnOverlays() {
    const campaign = getActiveCampaign?.();
    if (!campaign || !renderer.mapOverlays.length) return;

    const confirmed = window.confirm?.("Clear all drawn roads, rivers, paths, and walls from this generated map?");
    if (!confirmed) return;

    const removed = [...renderer.mapOverlays];
    renderer.drawing.saving = true;
    const showBulkLoading = removed.length >= BULK_OVERLAY_LOADING_THRESHOLD;
    if (showBulkLoading) setLoading(true);
    updateDrawUndoButton();
    updateDrawRedoButton();
    updateDrawClearButton();

    try {
      const { error } = await campaignSupabase.rpc("clear_generated_map_overlays", {
        target_campaign_id: campaign.id
      });

      if (error) throw error;

      renderer.mapOverlays = [];
      if (db?.raw?.generatedMapOverlays) db.raw.generatedMapOverlays = renderer.mapOverlays;
      pushOverlayUndoAction(removed.map(overlay => ({ ...overlay, __undoDeleted: true })));
      renderer.cacheDirty = true;
      render();
    } catch (error) {
      console.error("Unable to clear generated map overlays:", error);
      window.alert?.(error.message || "Unable to clear map overlays.");
    } finally {
      renderer.drawing.saving = false;
      if (showBulkLoading) setLoading(false);
      updateDrawUndoButton();
      updateDrawRedoButton();
      updateDrawClearButton();
    }
  }

  async function deleteOverlayById(campaignId, overlayId) {
    const { error } = await campaignSupabase.rpc("delete_generated_map_overlay", {
      target_campaign_id: campaignId,
      target_overlay_id: overlayId
    });
    if (error) throw error;
  }

  async function restoreDeletedOverlay(campaignId, overlay) {
    const { data, error } = await campaignSupabase.rpc("add_generated_map_overlay", {
      target_campaign_id: campaignId,
      target_overlay_type: overlay.Overlay_Type,
      from_hex_ref: overlay.Overlay_Type === "wall" ? overlay.Hex_ID_Ref : overlay.From_Hex_ID_Ref,
      to_hex_ref: overlay.Overlay_Type === "wall" ? null : overlay.To_Hex_ID_Ref,
      target_edge: overlay.Overlay_Type === "wall" ? overlay.Edge : null,
      target_style: overlay.Style
    });

    if (error) throw error;
    const restored = adaptOverlayRpcRow(data);
    upsertLocalOverlay(restored);
    return restored;
  }

  function adaptOverlayRpcRow(row) {
    const record = Array.isArray(row) ? row[0] : row;
    if (!record) return null;

    return {
      __uuid: record.id,
      Overlay_Type: record.overlay_type || "",
      From_Hex_ID_Ref: getHexRefForUuid(record.from_hex_id),
      To_Hex_ID_Ref: getHexRefForUuid(record.to_hex_id),
      Hex_ID_Ref: getHexRefForUuid(record.hex_id),
      Edge: record.edge || "",
      Style: record.style || ""
    };
  }

  function getHexRefForUuid(hexUuid) {
    if (!hexUuid) return "";
    return renderer.hexes.find(hex => hex.record?.__uuid === hexUuid)?.id || "";
  }

  function upsertLocalOverlay(overlay) {
    if (!overlay?.__uuid) return;

    const existingIndex = renderer.mapOverlays.findIndex(candidate => candidate.__uuid === overlay.__uuid);
    if (existingIndex >= 0) {
      renderer.mapOverlays.splice(existingIndex, 1, overlay);
    } else {
      renderer.mapOverlays.push(overlay);
    }

    if (db?.raw?.generatedMapOverlays) db.raw.generatedMapOverlays = renderer.mapOverlays;
    updateDrawClearButton();
  }

  function removeLocalWallOverlay(hexId, edge) {
    const removed = renderer.mapOverlays.filter(overlay => (
      overlay.Overlay_Type === "wall" &&
      overlay.Hex_ID_Ref === hexId &&
      overlay.Edge === edge
    ));
    renderer.mapOverlays = renderer.mapOverlays.filter(overlay => !(
      overlay.Overlay_Type === "wall" &&
      overlay.Hex_ID_Ref === hexId &&
      overlay.Edge === edge
    ));
    if (db?.raw?.generatedMapOverlays) db.raw.generatedMapOverlays = renderer.mapOverlays;
    return removed;
  }

  function removeLocalOverlayById(overlayId) {
    renderer.mapOverlays = renderer.mapOverlays.filter(overlay => overlay.__uuid !== overlayId);
    if (db?.raw?.generatedMapOverlays) db.raw.generatedMapOverlays = renderer.mapOverlays;
    updateDrawClearButton();
  }

  function nearestEdgeFromWorldPoint(point, hex) {
    let bestEdge = EDGE_NAMES[0];
    let bestDistance = Infinity;

    hex.points.forEach((edgeStart, index) => {
      const edgeEnd = hex.points[(index + 1) % hex.points.length];
      const distance = distanceToSegment(point, edgeStart, edgeEnd);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestEdge = EDGE_NAMES[index];
      }
    });

    return bestEdge;
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSquared));
    const projection = {
      x: a.x + t * dx,
      y: a.y + t * dy
    };
    return Math.hypot(point.x - projection.x, point.y - projection.y);
  }

  function getHexLineSequence(fromHexId, toHexId) {
    const fromHex = renderer.hexes.find(hex => hex.id === fromHexId);
    const toHex = renderer.hexes.find(hex => hex.id === toHexId);
    if (!fromHex || !toHex) return [fromHexId, toHexId];

    const distance = Math.hypot(toHex.center.x - fromHex.center.x, toHex.center.y - fromHex.center.y);
    const dimensions = getGeneratedMapDimensions();
    const steps = Math.max(1, Math.ceil(distance / (dimensions.radius * 0.55)));
    const sequence = [];

    for (let index = 0; index <= steps; index += 1) {
      const t = index / steps;
      const point = {
        x: fromHex.center.x + (toHex.center.x - fromHex.center.x) * t,
        y: fromHex.center.y + (toHex.center.y - fromHex.center.y) * t
      };
      const hex = getHexAtWorldPoint(point);
      if (hex && sequence[sequence.length - 1] !== hex.id) {
        sequence.push(hex.id);
      }
    }

    if (sequence[0] !== fromHexId) sequence.unshift(fromHexId);
    if (sequence[sequence.length - 1] !== toHexId) sequence.push(toHexId);
    return sequence;
  }

  function selectGeneratedHex(hexId) {
    renderer.selectedHexId = hexId;
    selectedHexId = hexId;
    selectedHex = { setStyle() {} };
    showPopup(hexId);
    render();
  }

  function showPopup(hexId) {
    renderer.popup.innerHTML = `<div class="generated-map-popup-content">${buildMobilePopupHtml?.(hexId) || ""}</div>`;
    renderer.popup.hidden = false;
    positionPopup();
  }

  function positionPopup() {
    if (!renderer.popup || renderer.popup.hidden || !renderer.selectedHexId) return;

    const hex = renderer.hexes.find(candidate => candidate.id === renderer.selectedHexId);
    if (!hex) return;

    const point = worldToClient(hex.center);
    renderer.popup.style.left = `${point.x}px`;
    renderer.popup.style.top = `${point.y - 34}px`;
  }

  function clearSelection() {
    renderer.selectedHexId = null;
    if (renderer.popup) {
      renderer.popup.hidden = true;
      renderer.popup.innerHTML = "";
    }
    render();
  }

  function centerHexInView(hexId, biasForInspector = false) {
    const hex = renderer.hexes.find(candidate => candidate.id === hexId || candidate.label === hexId);
    const rect = renderer.root?.getBoundingClientRect();
    if (!hex || !rect) return;

    const desiredX = rect.width * (biasForInspector ? 0.33 : 0.5);
    const desiredY = rect.height * 0.5;
    renderer.view.panX = hex.center.x - desiredX / renderer.view.zoom;
    renderer.view.panY = hex.center.y - desiredY / renderer.view.zoom;
    render();
  }

  window.generatedMapRenderer = {
    clearSelection,
    centerHexInView,
    beginLoading,
    deactivate() {
      setActive(false);
    },
    fitViewToMap() {
      fitViewToMap();
      render();
    },
    isActive,
    renderFromDatabase,
    refreshOverlayLayerFromDatabase,
    refreshPoiLayerFromDatabase,
    refreshRegionLayerFromDatabase,
    selectGeneratedHex
  };
})();
