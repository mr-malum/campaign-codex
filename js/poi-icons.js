(function() {
  const ASSET_BASE_PATH = "hex-mapper/assets/POIs/";
  const FALLBACK_ICON = "unknown_marker";
  const CATEGORY_OPTIONS = Object.freeze([
    {
      value: "settlements",
      label: "Settlements",
      options: [
        "city",
        "village",
        "walled_city",
        "hilltop_town",
        "mountain_city",
        "port_town",
        "farmstead",
        "walled_encampment",
        "mountain_hold",
        "mountain_pass"
      ]
    },
    {
      value: "strongholds",
      label: "Strongholds",
      options: [
        "castle",
        "fort",
        "watchtower",
        "stone_tower",
        "sea_fort",
        "gate",
        "mountain_gate",
        "mountain_hold",
        "mountain_pass"
      ]
    },
    {
      value: "dungeons_ruins",
      label: "Dungeons & Ruins",
      options: [
        "cave",
        "dungeon",
        "lair",
        "dragon_lair",
        "ruins",
        "mausoleum",
        "pyramid",
        "ziggurat",
        "shipwreck",
        "mountain_gate",
        "mountain_hold"
      ]
    },
    {
      value: "holy_arcane",
      label: "Holy & Arcane",
      options: [
        "abbey",
        "temple",
        "shrine",
        "sacred_grove",
        "mausoleum",
        "standing_stones",
        "monolith",
        "obelisk",
        "wizard_tower",
        "arcane_portal",
        "ley_nexus"
      ]
    },
    {
      value: "travel_trade",
      label: "Travel & Trade",
      options: [
        "bridge",
        "ford",
        "ferry",
        "docks",
        "harbor",
        "lighthouse",
        "rowboat",
        "sloop",
        "galleon",
        "tavern",
        "trader",
        "market",
        "mountain_pass",
        "gate",
        "campsite",
        "lodge"
      ]
    },
    {
      value: "resources_worksites",
      label: "Resources & Worksites",
      options: [
        "farmstead",
        "mine",
        "quarry",
        "lumber_camp",
        "lumber_mill",
        "windmill",
        "hunting_blind",
        "docks",
        "harbor",
        "market"
      ]
    },
    {
      value: "wilderness_landmarks",
      label: "Wilderness & Landmarks",
      options: [
        "tree",
        "dead_tree",
        "oasis",
        "spring",
        "geyser",
        "waterfall",
        "swamp",
        "reef",
        "standing_stones",
        "monolith",
        "obelisk",
        "compass_rose",
        "mountain_pass"
      ]
    },
    {
      value: "hazards_monsters",
      label: "Hazards & Monsters",
      options: [
        "lair",
        "dragon_lair",
        "kraken",
        "pirate_flag",
        "bandit_camp",
        "battlefield",
        "graveyard",
        "dead_tree",
        "shipwreck",
        "crater",
        "chest",
        "unknown_marker",
        "swamp"
      ]
    },
    {
      value: "water_coastal",
      label: "Water / Coastal",
      options: [
        "docks",
        "harbor",
        "lighthouse",
        "reef",
        "shipwreck",
        "rowboat",
        "sloop",
        "galleon",
        "ship_stern",
        "pirate_flag",
        "kraken",
        "ferry",
        "ford"
      ]
    }
  ]);

  const ICON_VALUES = Object.freeze([
    ...new Set(CATEGORY_OPTIONS.flatMap(category => category.options))
  ]);

  function normalizeToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\.svg$/i, "")
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function buildLabel(value) {
    return String(value || "")
      .split("_")
      .filter(Boolean)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  }

  const ICON_OPTIONS = Object.freeze(ICON_VALUES.map(value => ({
    value,
    label: buildLabel(value),
    assetUrl: `${ASSET_BASE_PATH}${value}.svg`
  })));

  const ICON_OPTION_BY_VALUE = Object.freeze(ICON_OPTIONS.reduce((lookup, option) => {
    lookup[option.value] = option;
    return lookup;
  }, {}));

  const VALUE_BY_NORMALIZED_INPUT = Object.freeze(ICON_OPTIONS.reduce((lookup, option) => {
    lookup[normalizeToken(option.value)] = option.value;
    lookup[normalizeToken(option.label)] = option.value;
    return lookup;
  }, {}));

  function normalizeIconValue(value) {
    const token = normalizeToken(value);
    if (!token) return "";
    return VALUE_BY_NORMALIZED_INPUT[token] || "";
  }

  function getStoredIconValue(value) {
    return normalizeIconValue(value);
  }

  function getDisplayIconValue(value) {
    return normalizeIconValue(value) || FALLBACK_ICON;
  }

  function getIconOption(value) {
    const normalizedValue = normalizeIconValue(value);
    if (!normalizedValue) return null;
    return ICON_OPTION_BY_VALUE[normalizedValue] || null;
  }

  function getIconLabel(value) {
    return getIconOption(value)?.label || buildLabel(normalizeToken(value));
  }

  function getIconAssetUrl(value, options = {}) {
    const normalizedValue = options.fallback === false
      ? normalizeIconValue(value)
      : getDisplayIconValue(value);
    if (!normalizedValue) return "";
    return `${ASSET_BASE_PATH}${normalizedValue}.svg`;
  }

  function getCategoryOptions() {
    return CATEGORY_OPTIONS.map(category => ({
      ...category,
      options: category.options
        .map(value => getIconOption(value))
        .filter(Boolean)
        .map(option => ({ ...option }))
    }));
  }

  function getIconOptions() {
    return ICON_OPTIONS.map(option => ({ ...option }));
  }

  window.CampaignPoiIcons = Object.freeze({
    ASSET_BASE_PATH,
    CATEGORY_OPTIONS,
    FALLBACK_ICON,
    ICON_OPTIONS,
    getCategoryOptions,
    getDisplayIconValue,
    getIconAssetUrl,
    getIconLabel,
    getIconOption,
    getIconOptions,
    getStoredIconValue,
    normalizeIconValue
  });
})();
