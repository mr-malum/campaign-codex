(function () {
  const TYPE_OPTIONS = Object.freeze([
    { value: "settlement", label: "Settlement" },
    { value: "stronghold", label: "Stronghold" },
    { value: "dungeon", label: "Dungeon" },
    { value: "dungeon_complex", label: "Dungeon Complex" },
    { value: "ruin", label: "Ruin" },
    { value: "holy_site", label: "Holy Site" },
    { value: "arcane_site", label: "Arcane Site" },
    { value: "waypoint", label: "Waypoint" },
    { value: "resource_site", label: "Resource Site" },
    { value: "wilderness_site", label: "Wilderness Site" },
    { value: "hazard", label: "Hazard" },
    { value: "landmark", label: "Landmark" }
  ]);
  const NOTORIETY_OPTIONS = Object.freeze([
    { value: "1", label: "1 - Legendary", shortLabel: "1" },
    { value: "2", label: "2 - Region-defining", shortLabel: "2" },
    { value: "3", label: "3 - Major", shortLabel: "3" },
    { value: "4", label: "4 - Well-known", shortLabel: "4" },
    { value: "5", label: "5 - Notable", shortLabel: "5" },
    { value: "6", label: "6 - Local", shortLabel: "6" },
    { value: "7", label: "7 - Minor", shortLabel: "7" },
    { value: "8", label: "8 - Obscure", shortLabel: "8" },
    { value: "9", label: "9 - Rumored", shortLabel: "9" },
    { value: "10", label: "10 - Unremarked", shortLabel: "10" }
  ]);

  const LABEL_BY_VALUE = Object.freeze(TYPE_OPTIONS.reduce((lookup, option) => {
    lookup[option.value] = option.label;
    return lookup;
  }, {}));

  const VALUE_BY_NORMALIZED_INPUT = Object.freeze(TYPE_OPTIONS.reduce((lookup, option) => {
    lookup[normalizeToken(option.value)] = option.value;
    lookup[normalizeToken(option.label)] = option.value;
    return lookup;
  }, {}));

  function normalizeToken(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/['’]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function normalizeTypeValue(value) {
    const token = normalizeToken(value);
    if (!token) return "";
    return VALUE_BY_NORMALIZED_INPUT[token] || "";
  }

  function getStoredTypeValue(value) {
    return normalizeTypeValue(value) || String(value || "").trim();
  }

  function getTypeLabel(value) {
    const normalized = normalizeTypeValue(value);
    return normalized ? LABEL_BY_VALUE[normalized] : String(value || "").trim();
  }

  function isValidTypeValue(value) {
    return Boolean(normalizeTypeValue(value));
  }

  function isSettlementType(value) {
    return normalizeTypeValue(value) === "settlement";
  }

  function getTypeOptions() {
    return TYPE_OPTIONS.map(option => ({ ...option }));
  }

  function normalizeNotorietyValue(value) {
    const clean = String(value || "").trim();
    if (!clean) return "";
    const match = clean.match(/\d+/);
    if (!match) return "";
    const numeric = Number(match[0]);
    if (!Number.isInteger(numeric) || numeric < 1 || numeric > 10) return "";
    return String(numeric);
  }

  function getStoredNotorietyValue(value) {
    return normalizeNotorietyValue(value) || String(value || "").trim();
  }

  function getNotorietyOption(value) {
    const normalizedValue = normalizeNotorietyValue(value);
    if (!normalizedValue) return null;
    return NOTORIETY_OPTIONS.find(option => option.value === normalizedValue) || null;
  }

  function getNotorietyLabel(value) {
    return getNotorietyOption(value)?.shortLabel || String(value || "").trim();
  }

  function getNotorietyDetailLabel(value) {
    return getNotorietyOption(value)?.label || String(value || "").trim();
  }

  function isValidNotorietyValue(value) {
    return Boolean(normalizeNotorietyValue(value));
  }

  function getNotorietyOptions() {
    return NOTORIETY_OPTIONS.map(option => ({ ...option }));
  }

  window.CampaignPoiTypes = Object.freeze({
    NOTORIETY_OPTIONS,
    TYPE_OPTIONS,
    TYPE_VALUES: TYPE_OPTIONS.map(option => option.value),
    getNotorietyDetailLabel,
    getNotorietyLabel,
    getNotorietyOptions,
    getTypeLabel,
    getTypeOptions,
    getStoredNotorietyValue,
    getStoredTypeValue,
    isValidNotorietyValue,
    isSettlementType,
    isValidTypeValue,
    normalizeNotorietyValue,
    normalizeTypeValue
  });
})();
