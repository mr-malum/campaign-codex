function setCodexEditorStatus(message = "") {
  const status = document.getElementById("codex-editor-status");
  if (status) {
    status.textContent = message;
  }
}

function populateNpcHomeOptions() {
  const select = document.getElementById("codex-add-npc-home");
  if (!select) return;

  const options = [
    `<option value="">Select a home...</option>`,
    ...(db?.raw?.pois || [])
      .slice()
      .sort((a, b) => String(a.Name || a.POI_ID).localeCompare(String(b.Name || b.POI_ID)))
      .map(poi => `
        <option value="${escapeHtml(poi.POI_ID)}">
          ${escapeHtml(poi.Name || poi.POI_ID)}
        </option>
      `)
  ];

  select.innerHTML = options.join("");
}

function openAddNpcEditor() {
  document.getElementById("codex-add-npc-form")?.reset();
  populateNpcHomeOptions();
  setCodexEditorStatus("");
  document.getElementById("codex-editor-modal")?.classList.remove("hidden");
  document.getElementById("codex-editor-modal")?.setAttribute("aria-hidden", "false");
}

function closeCodexEditor() {
  document.getElementById("codex-editor-modal")?.classList.add("hidden");
  document.getElementById("codex-editor-modal")?.setAttribute("aria-hidden", "true");
}

function setCodexDeleteStatus(message = "") {
  const status = document.getElementById("codex-delete-status");
  if (status) {
    status.textContent = message;
  }
}

function closeCodexDeleteModal() {
  document.getElementById("codex-delete-modal")?.classList.add("hidden");
  document.getElementById("codex-delete-modal")?.setAttribute("aria-hidden", "true");
  setCodexDeleteStatus("");
}

const CODEX_DETAIL_RECORDS = {
  region: {
    rpcType: "region",
    indexType: "regions",
    collection: "regions",
    byId: "regionsById",
    idKey: "Region_ID",
    label: "Region",
    getName: record => record?.Region_Name || record?.Region_ID
  },
  hex: {
    rpcType: "hex",
    indexType: "hexes",
    collection: "hexes",
    byId: "hexesById",
    idKey: "Hex_ID",
    label: "Hex",
    getName: record => record?.Hex_ID
  },
  poi: {
    rpcType: "poi",
    indexType: "pois",
    collection: "pois",
    byId: "poisById",
    idKey: "POI_ID",
    label: "POI",
    getName: record => record?.Name || record?.POI_ID
  },
  "poi-group": {
    rpcType: "poi_group",
    indexType: "pois",
    collection: "poiGroups",
    byId: "poiGroupsById",
    idKey: "POI_Group_ID",
    label: "POI Group",
    getName: record => record?.POI_Group_Name || record?.POI_Group_ID
  },
  npc: {
    rpcType: "npc",
    indexType: "npcs",
    collection: "npcs",
    byId: "npcsById",
    idKey: "NPC_ID",
    label: "NPC",
    getName: record => record?.Name || record?.NPC_ID
  }
};

function getCurrentDetailDeleteTarget() {
  const page = getCurrentCodexPage?.();
  const config = page ? CODEX_DETAIL_RECORDS[page.type] : null;
  if (!page || !config || !page.id) return null;

  const record = db?.[config.byId]?.[page.id];
  if (!record) return null;

  return {
    ...config,
    pageType: page.type,
    legacyId: page.id,
    uuid: record.__uuid,
    name: config.getName(record),
    record
  };
}

function openDeleteRecordModal() {
  const target = getCurrentDetailDeleteTarget();
  const modal = document.getElementById("codex-delete-modal");
  const message = document.getElementById("codex-delete-message");
  const confirmButton = document.getElementById("codex-delete-confirm");

  if (!modal || !message || !confirmButton) return;

  setCodexDeleteStatus("");
  confirmButton.disabled = false;

  if (!target?.uuid) {
    message.textContent = "This record cannot be deleted yet because it is missing its database ID. Refresh the app and try again.";
    confirmButton.hidden = true;
  } else {
    message.textContent = `Delete ${target.label}: ${target.name}? This cannot be undone.`;
    confirmButton.hidden = false;
  }

  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
}

function removeRecordFromLocalDb(target) {
  if (!target || !db?.raw?.[target.collection]) return;

  const idKey = target.idKey;
  const legacyId = target.legacyId;

  db.raw[target.collection] = db.raw[target.collection]
    .filter(record => record?.[idKey] !== legacyId);

  if (db[target.byId]) {
    delete db[target.byId][legacyId];
  }

  if (target.pageType === "poi") {
    Object.keys(db.poisByHexId || {}).forEach(key => {
      db.poisByHexId[key] = db.poisByHexId[key].filter(record => record.POI_ID !== legacyId);
    });
    Object.keys(db.poisByGroupId || {}).forEach(key => {
      db.poisByGroupId[key] = db.poisByGroupId[key].filter(record => record.POI_ID !== legacyId);
    });
  }

  if (target.pageType === "npc") {
    Object.keys(db.npcsByHomeId || {}).forEach(key => {
      db.npcsByHomeId[key] = db.npcsByHomeId[key].filter(record => record.NPC_ID !== legacyId);
    });
  }

  if (target.pageType === "region") {
    Object.values(db.hexesById || {}).forEach(hex => {
      if (hex.Region_ID_Ref === legacyId) hex.Region_ID_Ref = "";
    });
  }

  if (target.pageType === "poi-group") {
    Object.values(db.poisById || {}).forEach(poi => {
      if (poi.POI_Group_ID === legacyId) poi.POI_Group_ID = "";
    });
  }

  db.mapsByOwnerKey = groupMapsByOwner?.(db.raw.maps || []) || db.mapsByOwnerKey;
}

async function confirmDeleteRecord() {
  const campaign = getActiveCampaign?.();
  const target = getCurrentDetailDeleteTarget();
  const confirmButton = document.getElementById("codex-delete-confirm");

  if (!campaign || !target?.uuid) return;

  setCodexDeleteStatus("Deleting...");
  if (confirmButton) confirmButton.disabled = true;

  try {
    const { error } = await campaignSupabase.rpc("delete_campaign_record", {
      target_campaign_id: campaign.id,
      target_record_type: target.rpcType,
      target_record_id: target.uuid
    });

    if (error) throw error;

    removeRecordFromLocalDb(target);
    closeCodexDeleteModal();

    popCodexHistory?.();
    const returnPage = getCurrentCodexPage?.();

    if (returnPage) {
      renderCodexPage(returnPage.type, returnPage.id);
    } else {
      pushCodexHistory?.(target.indexType, null);
      renderCodexPage(target.indexType, null);
    }

    fitCodexHeaderText?.();
    updateCodexBackButton?.();
  } catch (error) {
    console.error("Failed to delete record:", error);
    const message = String(error.message || "");
    const permissionDenied = /permission|not allowed|not authorized|forbidden/i.test(message);
    setCodexDeleteStatus(permissionDenied
      ? "You do not have permission to delete this record."
      : message || "Unable to delete this record.");
    if (confirmButton) confirmButton.disabled = false;
  }
}

function getPoiUuidByLegacyId(poiId) {
  const poi = (db?.raw?.pois || []).find(row => row.POI_ID === poiId);
  return poi?.__uuid || null;
}

function adaptCreatedNpcRow(row) {
  const createdRow = Array.isArray(row) ? row[0] : row;

  return {
    __uuid: createdRow.id,
    NPC_ID: createdRow.ref_code,
    Home_ID_Ref: db?.raw?.pois?.find(poi => poi.__uuid === createdRow.home_poi_id)?.POI_ID || "",
    Title: createdRow.title || "",
    Name: createdRow.name || "",
    Organization: createdRow.organization || "",
    Race: createdRow.race || "",
    Occupation: createdRow.occupation || "",
    Lore: createdRow.lore || "",
    Image: ""
  };
}

function addCreatedNpcToLocalDb(npc) {
  db.raw.npcs.push(npc);
  db.npcsById[npc.NPC_ID] = npc;

  if (npc.Home_ID_Ref) {
    if (!db.npcsByHomeId[npc.Home_ID_Ref]) {
      db.npcsByHomeId[npc.Home_ID_Ref] = [];
    }
    db.npcsByHomeId[npc.Home_ID_Ref].push(npc);
  }
}

async function handleAddNpcSubmit(event) {
  event.preventDefault();

  const campaign = getActiveCampaign?.();
  if (!campaign) return;

  const name = document.getElementById("codex-add-npc-name")?.value.trim();
  const title = document.getElementById("codex-add-npc-title")?.value.trim();
  const organization = document.getElementById("codex-add-npc-organization")?.value.trim();
  const race = document.getElementById("codex-add-npc-race")?.value.trim();
  const occupation = document.getElementById("codex-add-npc-occupation")?.value.trim();
  const homePoiId = document.getElementById("codex-add-npc-home")?.value || "";
  const lore = document.getElementById("codex-add-npc-lore")?.value.trim();

  if (!name || !race || !occupation || !homePoiId) {
    setCodexEditorStatus("Name, Race, Occupation, and Home are required.");
    return;
  }

  setCodexEditorStatus("Creating NPC...");

  try {
    const { data, error } = await campaignSupabase.rpc("create_npc_with_next_ref_code", {
      target_campaign_id: campaign.id,
      npc_name: name,
      npc_title: title || null,
      npc_organization: organization || null,
      npc_race: race || null,
      npc_occupation: occupation || null,
      npc_lore: lore || null,
      npc_home_poi_id: getPoiUuidByLegacyId(homePoiId),
      npc_visibility: "shared"
    });

    if (error) throw error;

    const createdNpc = adaptCreatedNpcRow(data);
    addCreatedNpcToLocalDb(createdNpc);
    closeCodexEditor();
    renderNpcListIntoContainer();
  } catch (error) {
    console.error("Failed to create NPC:", error);
    setCodexEditorStatus(error.message || "Unable to create NPC.");
  }
}

function updateCodexContextAction(type) {
  const mobileButton = document.getElementById("codex-context-action");
  const mobileDeleteButton = document.getElementById("codex-context-delete");
  const desktopButton = document.getElementById("codex-desktop-context-action");
  const desktopDeleteButton = document.getElementById("codex-desktop-context-delete");
  const desktopShell = document.getElementById("codex-desktop-context-action-shell");
  const buttons = [mobileButton, desktopButton].filter(Boolean);
  const deleteButtons = [mobileDeleteButton, desktopDeleteButton].filter(Boolean);
  if (!buttons.length) return;

  const hideButton = (button) => {
    button.hidden = true;
    button.disabled = false;
    button.textContent = "";
    button.onclick = null;
  };

  const isNpcIndex = type === "npcs";
  const isDetailPage = ["hex", "region", "poi", "poi-group", "npc"].includes(type);

  if (isNpcIndex) {
    if (desktopShell) desktopShell.hidden = false;
    deleteButtons.forEach(hideButton);
    buttons.forEach((button) => {
      button.hidden = false;
      button.disabled = false;
      button.textContent = "Add";
      button.onclick = openAddNpcEditor;
    });
    return;
  }

  if (isDetailPage) {
    if (desktopShell) desktopShell.hidden = false;
    deleteButtons.forEach((button) => {
      button.hidden = false;
      button.disabled = false;
      button.textContent = "Delete";
      button.onclick = openDeleteRecordModal;
    });
    buttons.forEach((button) => {
      button.hidden = false;
      button.textContent = "Edit";
      button.onclick = null;
      button.disabled = true;
    });
    return;
  }

  if (desktopShell) desktopShell.hidden = true;
  deleteButtons.forEach(hideButton);
  buttons.forEach(hideButton);
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("codex-add-npc-form")
    ?.addEventListener("submit", handleAddNpcSubmit);
  document.getElementById("codex-editor-close")
    ?.addEventListener("click", closeCodexEditor);
  document.getElementById("codex-delete-cancel")
    ?.addEventListener("click", closeCodexDeleteModal);
  document.getElementById("codex-delete-confirm")
    ?.addEventListener("click", confirmDeleteRecord);
});

window.openAddNpcEditor = openAddNpcEditor;
window.updateCodexContextAction = updateCodexContextAction;
