(function() {
  const CATEGORY_OPTIONS = Object.freeze([
    {
      value: "danger",
      label: "Danger",
      colorKey: "danger",
      options: [
        { value: "haunted", label: "Haunted" },
        { value: "cursed", label: "Cursed" },
        { value: "plagued", label: "Plagued" },
        { value: "monster_lair", label: "Monster Lair" },
        { value: "banditry", label: "Banditry" },
        { value: "warzone", label: "Warzone" },
        { value: "blighted", label: "Blighted" },
        { value: "trapped", label: "Trapped" },
        { value: "desecrated", label: "Desecrated" },
        { value: "lawless", label: "Lawless" }
      ]
    },
    {
      value: "function",
      label: "Function",
      colorKey: "function",
      options: [
        { value: "trade", label: "Trade" },
        { value: "rest", label: "Rest" },
        { value: "worship", label: "Worship" },
        { value: "research", label: "Research" },
        { value: "mining", label: "Mining" },
        { value: "farming", label: "Farming" },
        { value: "fishing", label: "Fishing" },
        { value: "smuggling", label: "Smuggling" },
        { value: "fortification", label: "Fortification" },
        { value: "administration", label: "Administration" },
        { value: "pilgrimage", label: "Pilgrimage" },
        { value: "burial", label: "Burial" },
        { value: "refuge", label: "Refuge" },
        { value: "craftwork", label: "Craftwork" }
      ]
    },
    {
      value: "state",
      label: "State",
      colorKey: "state",
      max: 2,
      options: [
        { value: "active", label: "Active" },
        { value: "abandoned", label: "Abandoned" },
        { value: "occupied", label: "Occupied" },
        { value: "sealed", label: "Sealed" },
        { value: "hidden", label: "Hidden" },
        { value: "contested", label: "Contested" },
        { value: "ruined", label: "Ruined" },
        { value: "besieged", label: "Besieged" },
        { value: "reclaimed", label: "Reclaimed" },
        { value: "dormant", label: "Dormant" }
      ]
    },
    {
      value: "affiliation",
      label: "Affiliation",
      colorKey: "affiliation",
      max: 2,
      options: [
        { value: "imperial", label: "Imperial" },
        { value: "rebel", label: "Rebel" },
        { value: "resistance", label: "Resistance" },
        { value: "guild", label: "Guild" },
        { value: "cult", label: "Cult" },
        { value: "criminal", label: "Criminal" },
        { value: "noble", label: "Noble" },
        { value: "ecclesiastical", label: "Ecclesiastical" },
        { value: "military_order", label: "Military Order" },
        { value: "arcane_order", label: "Arcane Order" },
        { value: "tribal", label: "Tribal" },
        { value: "mercantile", label: "Mercantile" }
      ]
    },
    {
      value: "character",
      label: "Character",
      colorKey: "character",
      max: 2,
      options: [
        { value: "dwarven", label: "Dwarven" },
        { value: "elven", label: "Elven" },
        { value: "fey", label: "Fey" },
        { value: "ancient", label: "Ancient" },
        { value: "draconic", label: "Draconic" },
        { value: "arcane", label: "Arcane" },
        { value: "sacred", label: "Sacred" },
        { value: "infernal", label: "Infernal" },
        { value: "celestial", label: "Celestial" },
        { value: "primordial", label: "Primordial" },
        { value: "necromantic", label: "Necromantic" },
        { value: "giant_made", label: "Giant-made" }
      ]
    },
    {
      value: "context",
      label: "Context",
      colorKey: "context",
      options: [
        { value: "underground", label: "Underground" },
        { value: "underwater", label: "Underwater" },
        { value: "island", label: "Island" },
        { value: "borderland", label: "Borderland" },
        { value: "roadside", label: "Roadside" },
        { value: "frontier", label: "Frontier" },
        { value: "crossroads", label: "Crossroads" },
        { value: "river_crossing", label: "River Crossing" },
        { value: "offshore", label: "Offshore" },
        { value: "remote", label: "Remote" }
      ]
    },
    {
      value: "mystery",
      label: "Mystery",
      colorKey: "mystery",
      max: 2,
      options: [
        { value: "forbidden", label: "Forbidden" },
        { value: "anomalous", label: "Anomalous" },
        { value: "lost", label: "Lost" },
        { value: "mythic", label: "Mythic" },
        { value: "prophetic", label: "Prophetic" },
        { value: "shrouded", label: "Shrouded" },
        { value: "impossible", label: "Impossible" },
        { value: "whispered", label: "Whispered" },
        { value: "nameless", label: "Nameless" },
        { value: "otherworldly", label: "Otherworldly" }
      ]
    }
  ]);

  const MAX_TAGS = 4;
  const TAG_OPTIONS = Object.freeze(
    CATEGORY_OPTIONS.flatMap(category => (
      category.options.map(option => ({
        ...option,
        category: category.value,
        categoryLabel: category.label,
        categoryColorKey: category.colorKey
      }))
    ))
  );

  const TAG_OPTION_BY_VALUE = Object.freeze(TAG_OPTIONS.reduce((lookup, option) => {
    lookup[option.value] = option;
    return lookup;
  }, {}));

  const CATEGORY_BY_VALUE = Object.freeze(CATEGORY_OPTIONS.reduce((lookup, category) => {
    lookup[category.value] = category;
    return lookup;
  }, {}));

  const VALUE_BY_NORMALIZED_INPUT = Object.freeze(TAG_OPTIONS.reduce((lookup, option) => {
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

  function normalizeTagValue(value) {
    const token = normalizeToken(value);
    if (!token) return "";
    return VALUE_BY_NORMALIZED_INPUT[token] || "";
  }

  function coerceRawTagValues(values) {
    if (Array.isArray(values)) return values;
    if (typeof values === "string" && values.trim()) {
      return values.split(",").map(value => value.trim()).filter(Boolean);
    }
    return [];
  }

  function getCategoryCounts(values) {
    return coerceTagValues(values).reduce((counts, value) => {
      const category = getTagCategory(value);
      if (!category) return counts;
      counts[category] = (counts[category] || 0) + 1;
      return counts;
    }, {});
  }

  function canSelectTag(value, selectedValues) {
    const normalizedValue = normalizeTagValue(value);
    if (!normalizedValue) return false;

    const values = coerceTagValues(selectedValues);
    if (values.includes(normalizedValue)) return true;
    if (values.length >= MAX_TAGS) return false;

    const category = CATEGORY_BY_VALUE[getTagCategory(normalizedValue)];
    if (!category?.max) return true;

    const counts = getCategoryCounts(values);
    return (counts[category.value] || 0) < category.max;
  }

  function coerceTagValues(values) {
    const rawValues = coerceRawTagValues(values);
    const selected = [];
    const categoryCounts = {};

    rawValues.forEach(rawValue => {
      const normalizedValue = normalizeTagValue(rawValue);
      if (!normalizedValue || selected.includes(normalizedValue)) return;
      if (selected.length >= MAX_TAGS) return;

      const category = CATEGORY_BY_VALUE[getTagCategory(normalizedValue)];
      const categoryValue = category?.value || "";
      const categoryCap = category?.max || 0;

      if (categoryCap && (categoryCounts[categoryValue] || 0) >= categoryCap) {
        return;
      }

      selected.push(normalizedValue);
      if (categoryValue) {
        categoryCounts[categoryValue] = (categoryCounts[categoryValue] || 0) + 1;
      }
    });

    return selected;
  }

  function getTagOption(value) {
    const normalizedValue = normalizeTagValue(value);
    if (!normalizedValue) return null;
    return TAG_OPTION_BY_VALUE[normalizedValue] || null;
  }

  function getTagLabel(value) {
    return getTagOption(value)?.label || String(value || "").trim();
  }

  function getTagCategory(value) {
    return getTagOption(value)?.category || "";
  }

  function getTagCategoryLabel(value) {
    const normalizedValue = CATEGORY_BY_VALUE[value]
      ? value
      : getTagCategory(value);
    return CATEGORY_BY_VALUE[normalizedValue]?.label || "";
  }

  function getTagCategoryColorKey(value) {
    const normalizedValue = CATEGORY_BY_VALUE[value]
      ? value
      : getTagCategory(value);
    return CATEGORY_BY_VALUE[normalizedValue]?.colorKey || "";
  }

  function getTagCategoryClassName(value) {
    const colorKey = getTagCategoryColorKey(value);
    return colorKey ? `codex-tag-category-${colorKey}` : "";
  }

  function getCategoryCap(value) {
    return CATEGORY_BY_VALUE[value]?.max || 0;
  }

  function getCategoryOptions() {
    return CATEGORY_OPTIONS.map(category => ({
      ...category,
      options: category.options.map(option => ({ ...option }))
    }));
  }

  function getTagOptions() {
    return TAG_OPTIONS.map(option => ({ ...option }));
  }

  window.CampaignPoiTags = Object.freeze({
    CATEGORY_OPTIONS,
    MAX_TAGS,
    TAG_OPTIONS,
    canSelectTag,
    coerceTagValues,
    getCategoryCap,
    getCategoryCounts,
    getCategoryOptions,
    getTagCategory,
    getTagCategoryClassName,
    getTagCategoryColorKey,
    getTagCategoryLabel,
    getTagLabel,
    getTagOption,
    getTagOptions,
    normalizeTagValue
  });
})();
