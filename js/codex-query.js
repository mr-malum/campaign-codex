/* =========================================================
   CODEX QUERY / SORT / FILTER HELPERS
   ========================================================= */

function compareText(a, b) {
  return String(a || "").localeCompare(String(b || ""));
}

function applySortDirection(result, direction) {
  return direction === "desc" ? -result : result;
}

function sortRows(rows, compareFn, direction = "asc") {
  return [...rows].sort((a, b) => {
    return applySortDirection(compareFn(a, b), direction);
  });
}

function applyFilters(rows, filters) {
  return rows.filter(row => {
    return filters.every(filter => {
      if (!filter.value || filter.value === "all") {
        return true;
      }

      const rowValue = filter.getValue
        ? filter.getValue(row)
        : row?.[filter.field];

      const rowValues = Array.isArray(rowValue)
        ? rowValue
        : [rowValue];

      return rowValues.some(value => {
        return String(value || "") === String(filter.value);
      });
    });
  });
}

function getPoiNotorietyRank(value) {
  const clean = String(value || "").trim();

  const numberMatch = clean.match(/\d+/);

  if (numberMatch) {
    return Number(numberMatch[0]);
  }

  const fallbackOrder = {
    "Mythic": 1,
    "Legendary": 2,
    "Major": 3,
    "Regional": 4,
    "Local": 5
  };

  return fallbackOrder[clean] || 999;
}

function getPoiNotorietyDisplayValue(value) {
  const clean = String(value || "").trim();
  const numberMatch = clean.match(/\d+/);
  return numberMatch ? numberMatch[0] : clean;
}

function getPoiGroupNotorietyRange(groupOrId) {
  const groupId = typeof groupOrId === "string"
    ? groupOrId
    : groupOrId?.POI_Group_ID;

  const ranks = getPoisForGroup(groupId)
    .map(poi => ({
      rank: getPoiNotorietyRank(poi["Notoriety Tier"]),
      display: getPoiNotorietyDisplayValue(poi["Notoriety Tier"])
    }))
    .filter(item => item.rank < 999 && item.display);

  if (!ranks.length) {
    return null;
  }

  ranks.sort((a, b) => a.rank - b.rank);

  return {
    lowest: ranks[0].display,
    highest: ranks[ranks.length - 1].display,
    lowestRank: ranks[0].rank,
    highestRank: ranks[ranks.length - 1].rank,
    mixed: ranks[0].rank !== ranks[ranks.length - 1].rank
  };
}

function getPoiEffectiveNotorietyRank(row) {
  if (row?.__codexRecordType === "poi-group") {
    return getPoiGroupNotorietyRange(row)?.lowestRank || 999;
  }

  return getPoiNotorietyRank(row?.["Notoriety Tier"]);
}

function formatPoiGroupNotorietyRange(groupOrId) {
  const range = getPoiGroupNotorietyRange(groupOrId);
  if (!range) return "";
  if (!range.mixed) return `Notoriety: ${range.lowest}`;
  return `Notoriety: ${range.lowest}–${range.highest}`;
}

function getPoiListSortName(row) {
  if (row?.__codexRecordType === "poi-group") {
    return row.POI_Group_Name || row.POI_Group_ID || "";
  }

  return row?.Name || row?.POI_ID || "";
}

function getPoiListTypeValue(row) {
  if (row?.__codexRecordType === "poi-group") {
    return row.Group_Type || "";
  }

  return row?.POI_Type || "";
}

function getPoiListRowTypeValues(row) {
  if (row?.__codexRecordType === "poi-group") {
    return [...new Set([
      row.Group_Type || "",
      ...getPoiListRowGroupPois(row).map(poi => poi?.POI_Type || "")
    ].filter(Boolean))];
  }

  return row?.POI_Type || "";
}

function getPoiListPopulationSortValue(row) {
  const rawValue = row?.__codexRecordType === "poi-group"
    ? row?.Population
    : getPoiEffectivePopulation(row);

  return Number(String(rawValue || "").replace(/[^\d]/g, "")) || 0;
}

function getPoiListNpcCount(row) {
  if (row?.__codexRecordType === "poi-group") {
    return getNpcsForPoiGroup(row.POI_Group_ID).length;
  }

  return getNpcsForPoi(row?.POI_ID).length;
}

function getPoiGroupForPoi(poi) {
  const groupId = poi?.POI_Group_ID;
  if (!groupId) return null;
  return db?.poiGroupsById?.[groupId] || null;
}

function getPoisForGroup(groupId) {
  if (!groupId) return [];
  return db?.poisByGroupId?.[groupId] || [];
}

function getSiblingPoisForPoi(poi) {
  const group = getPoiGroupForPoi(poi);
  if (!group) return [];

  return getPoisForGroup(group.POI_Group_ID)
    .filter(row => row.POI_ID !== poi?.POI_ID);
}

function getLocalPoisForPoi(poi) {
  if (!poi?.Hex_ID_Ref) return [];

  const siblingIds = new Set(
    getSiblingPoisForPoi(poi).map(row => row.POI_ID)
  );

  return getPoisForHex(poi.Hex_ID_Ref)
    .filter(row => row.POI_ID !== poi.POI_ID)
    .filter(row => !siblingIds.has(row.POI_ID));
}

function getNpcsForPoiGroup(groupId) {
  return getPoisForGroup(groupId).flatMap(poi => {
    return getNpcsForPoi(poi.POI_ID);
  });
}

function getPoiGroupPopulation(group, fallbackPoi = null) {
  return group?.Population || fallbackPoi?.Population || "";
}

function getPoiEffectivePopulation(poi) {
  const group = getPoiGroupForPoi(poi);
  return getPoiGroupPopulation(group, poi);
}

function createPoiGroupListRows(pois) {
  const rows = [];
  const seenGroupIds = new Set();

  pois.forEach(poi => {
    const group = getPoiGroupForPoi(poi);

    if (!group) {
      rows.push(poi);
      return;
    }

    if (seenGroupIds.has(group.POI_Group_ID)) return;

    seenGroupIds.add(group.POI_Group_ID);

    rows.push({
      ...group,
      __codexRecordType: "poi-group",
      __codexRecordId: group.POI_Group_ID,
      __codexGroupPois: getPoisForGroup(group.POI_Group_ID)
    });
  });

  (db?.raw?.poiGroups || []).forEach(group => {
    if (seenGroupIds.has(group.POI_Group_ID)) return;
    if (getPoisForGroup(group.POI_Group_ID).length) return;

    seenGroupIds.add(group.POI_Group_ID);
    rows.push({
      ...group,
      __codexRecordType: "poi-group",
      __codexRecordId: group.POI_Group_ID,
      __codexGroupPois: []
    });
  });

  return rows;
}

function getCodexMapOwnerKey(ownerType, ownerId) {
  if (!ownerType || !ownerId) return "";
  return `${String(ownerType).toLowerCase()}:${ownerId}`;
}

function getMapsForOwner(ownerType, ownerId) {
  const key = getCodexMapOwnerKey(ownerType, ownerId);
  if (!key) return [];
  return db?.mapsByOwnerKey?.[key] || [];
}

function getMapsForPoi(poiId) {
  return getMapsForOwner("poi", poiId);
}

function getMapsForPoiGroup(groupId) {
  return getMapsForOwner("poi-group", groupId);
}

function getMapsForRegion(regionId) {
  return getMapsForOwner("region", regionId);
}

function getNpcHomeLabel(npc) {
  const home = npc.Home_ID_Ref
    ? db?.poisById?.[npc.Home_ID_Ref]
    : null;

  const group = home ? getPoiGroupForPoi(home) : null;

  return group?.POI_Group_Name || home?.Name || npc.Home_ID_Ref || "";
}

function getHexRegionLabel(hex) {
  const region = hex?.Region_ID_Ref ? db?.regionsById?.[hex.Region_ID_Ref] : null;
  return region?.Region_Name || hex?.Region_ID_Ref || "";
}

function getNpcFilterValue(npc, field) {
  if (field === "Race") return npc.Race || "";
  if (field === "Occupation") return npc.Occupation || "";
  if (field === "Organization") return npc?.Organization || "";
  if (field === "Home") return getNpcHomeLabel(npc);
  return "";
}

function getPoiRegionLabel(poi) {
  const hex = poi.Hex_ID_Ref ? db?.hexesById?.[poi.Hex_ID_Ref] : null;
  return getHexRegionLabel(hex);
}

function getPoiListRowGroupPois(row) {
  if (row?.__codexRecordType !== "poi-group") {
    return [];
  }

  if (Array.isArray(row.__codexGroupPois)) {
    return row.__codexGroupPois;
  }

  return getPoisForGroup(row.POI_Group_ID);
}

function getPoiListRowNotorietyValue(row) {
  if (row?.__codexRecordType === "poi-group") {
    return getPoiGroupNotorietyRange(row)?.lowest || "";
  }

  return getPoiNotorietyDisplayValue(row?.["Notoriety Tier"]);
}

function getPoiListRowRegionValues(row) {
  if (row?.__codexRecordType === "poi-group") {
    return getPoiListRowGroupPois(row)
      .map(poi => getPoiRegionLabel(poi))
      .filter(Boolean);
  }

  return getPoiRegionLabel(row);
}

function getPoiListRowTagValues(row) {
  const coerceTagValues = window.CampaignPoiTags?.coerceTagValues;

  if (!coerceTagValues) {
    return [];
  }

  if (row?.__codexRecordType === "poi-group") {
    const groupTagValues = coerceTagValues(row?.Group_Tags || []);
    const childTagValues = getPoiListRowGroupPois(row).flatMap(poi => {
      return coerceTagValues(poi?.POI_Tags || []);
    });

    return [...new Set([
      ...groupTagValues,
      ...childTagValues
    ])];
  }

  return coerceTagValues(row?.POI_Tags || []);
}

function getPoiFilterValue(poi, field) {
  if (field === "Type") return getPoiListRowTypeValues(poi);
  if (field === "Notoriety") return getPoiListRowNotorietyValue(poi);
  if (field === "Region") return getPoiListRowRegionValues(poi);
  if (field === "Tag") return getPoiListRowTagValues(poi);
  return "";
}

function getHexFilterValue(hex, field) {
  if (field === "Region") return getHexRegionLabel(hex);
  if (field === "Terrain") return hex.Terrain || "";
  return "";
}

function getUniqueValues(rows, getValue) {
  const values = [];

  rows.forEach(row => {
    const rowValue = getValue(row);

    if (Array.isArray(rowValue)) {
      rowValue
        .filter(Boolean)
        .forEach(value => values.push(value));
      return;
    }

    if (rowValue) {
      values.push(rowValue);
    }
  });

  return [...new Set(values)].sort();
}

function getDynamicFilterOptions(rows, getValue) {
  return [
    { value: "all", label: "All" },
    ...getUniqueValues(rows, getValue).map(value => ({
      value,
      label: value
    }))
  ];
}

function getNpcFilterOptions(field) {
  const npcs = db?.raw?.npcs || [];
  return getDynamicFilterOptions(npcs, npc => getNpcFilterValue(npc, field));
}

function getPoiFilterOptions(field) {
  const rows = createPoiGroupListRows(db?.raw?.pois || []);

  if (field === "Tag") {
    const tagValues = new Set(
      getUniqueValues(rows, row => getPoiFilterValue(row, field))
    );

    const categoryOptions = window.CampaignPoiTags?.getCategoryOptions?.() || [];
    const orderedOptions = [];

    categoryOptions.forEach(category => {
      category.options.forEach(option => {
        if (!tagValues.has(option.value)) return;
        orderedOptions.push({
          value: option.value,
          label: `${category.label}: ${option.label}`
        });
      });
    });

    return [
      { value: "all", label: "All" },
      ...orderedOptions
    ];
  }

  if (field === "Notoriety") {
    const values = getUniqueValues(rows, row => getPoiFilterValue(row, field))
      .sort((a, b) => getPoiNotorietyRank(a) - getPoiNotorietyRank(b));

    return [
      { value: "all", label: "All" },
      ...values.map(value => ({
        value,
        label: value
      }))
    ];
  }

  return getDynamicFilterOptions(rows, row => getPoiFilterValue(row, field));
}

function getHexFilterOptions(field) {
  const hexes = db?.raw?.hexes || [];
  return getDynamicFilterOptions(hexes, hex => getHexFilterValue(hex, field));
}

function updateDynamicFilterValueOptions(fieldSelectId, valueSelectId, getOptions, fallbackField) {
  const field = document.getElementById(fieldSelectId)?.value || fallbackField;
  const valueSelect = document.getElementById(valueSelectId);

  if (!valueSelect) return;

  valueSelect.innerHTML = renderCodexSelectOptions(
    getOptions(field),
    "all"
  );
}

function updateNpcFilterValueOptions(fieldSelectId, valueSelectId) {
  updateDynamicFilterValueOptions(
    fieldSelectId,
    valueSelectId,
    getNpcFilterOptions,
    "Race"
  );
}

function updatePoiFilterValueOptions(fieldSelectId, valueSelectId) {
  updateDynamicFilterValueOptions(
    fieldSelectId,
    valueSelectId,
    getPoiFilterOptions,
    "Type"
  );
}

function updateHexFilterValueOptions(fieldSelectId, valueSelectId) {
  updateDynamicFilterValueOptions(
    fieldSelectId,
    valueSelectId,
    getHexFilterOptions,
    "Region"
  );
}

function compareByTextThenName(getPrimary) {
  return (a, b) => {
    const primary = compareText(getPrimary(a), getPrimary(b));
    return primary !== 0 ? primary : compareText(a.Name || a.Hex_ID, b.Name || b.Hex_ID);
  };
}

function compareByNumberThenName(getPrimary) {
  return (a, b) => {
    const primary = getPrimary(a) - getPrimary(b);
    return primary !== 0 ? primary : compareText(a.Name || a.Hex_ID, b.Name || b.Hex_ID);
  };
}

function applyConfiguredSort(rows, compareFn, sortDirection) {
  if (!compareFn) {
    return rows;
  }

  return sortRows(rows, compareFn, sortDirection);
}

function applyConfiguredFilters(rows, filterState, getFilterValue) {
  return applyFilters(
    rows,
    filterState.map(filter => ({
      value: filter.value,
      getValue: row => getFilterValue(row, filter.field)
    }))
  );
}
