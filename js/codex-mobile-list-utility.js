/* =========================================================
   MOBILE LIST FILTER UTILITY
   =========================================================

   Reuses the existing list control DOM for mobile instead of cloning controls
   and creating duplicate IDs. Desktop rail remains the source location.
*/

let originalRenderCodexListPage = renderCodexListPage;
let codexListStateCache = {};
let codexCurrentListConfig = null;

function getCodexListStateKey(config) {
  return config?.listId || config?.title || "default-list";
}

function getCodexCachedListState(config) {
  return codexListStateCache[getCodexListStateKey(config)] || null;
}

function cacheCodexListState(config) {
  if (!config) return;

  const filters = config.filters.map(filter => ({
    field: document.getElementById(filter.fieldId)?.value || filter.fieldValue,
    value: document.getElementById(filter.id)?.value || "all"
  }));

  const sortMode = document.getElementById(config.sortId)?.value || config.selectedSort;
  const direction = document.getElementById(config.directionId)?.dataset?.direction || "asc";

  codexListStateCache[getCodexListStateKey(config)] = {
    filters,
    sortMode,
    direction
  };
}

function getCodexListFilterOptionLabel(config, field, value) {
  if (!value || value === "all") return "All";

  const option = config.getFilterOptions(field).find(item => item.value === value);
  return option?.label || value;
}

function getCodexListSortLabel(config, sortMode) {
  return config.sortOptions.find(option => option.value === sortMode)?.label || sortMode || "Name";
}

function renderCodexListSummary(config) {
  const state = getCodexCachedListState(config) || {
    filters: config.filters.map(filter => ({
      field: filter.fieldValue,
      value: filter.selectedValue || "all"
    })),
    sortMode: config.selectedSort,
    direction: "asc"
  };

  const filterSummary = state.filters
    .map(filter => `${filter.field}: ${getCodexListFilterOptionLabel(config, filter.field, filter.value)}`)
    .join(" • ");

  const sortLabel = getCodexListSortLabel(config, state.sortMode);
  const directionArrow = state.direction === "desc" ? "↓" : "↑";

  return `
    <div id="codex-mobile-list-summary" class="codex-mobile-list-summary">
      <span class="codex-mobile-list-summary-filters">${escapeHtml(filterSummary)}</span>
      <span class="codex-mobile-list-summary-sort">${escapeHtml(sortLabel)} ${directionArrow}</span>
    </div>
  `;
}

function updateCodexListSummary(config = codexCurrentListConfig) {
  const summary = document.getElementById("codex-mobile-list-summary");
  if (!summary || !config) return;

  const state = getCodexCachedListState(config);
  if (!state) return;

  const filterSummary = state.filters
    .map(filter => `${filter.field}: ${getCodexListFilterOptionLabel(config, filter.field, filter.value)}`)
    .join(" • ");

  const sortLabel = getCodexListSortLabel(config, state.sortMode);
  const directionArrow = state.direction === "desc" ? "↓" : "↑";

  summary.innerHTML = `
    <span class="codex-mobile-list-summary-filters">${escapeHtml(filterSummary)}</span>
    <span class="codex-mobile-list-summary-sort">${escapeHtml(sortLabel)} ${directionArrow}</span>
  `;
}

function applyCodexCachedListState(config) {
  const cached = getCodexCachedListState(config);
  if (!cached) {
    cacheCodexListState(config);
    updateCodexListSummary(config);
    return;
  }

  cached.filters.forEach((cachedFilter, index) => {
    const filter = config.filters[index];
    if (!filter) return;

    const fieldEl = document.getElementById(filter.fieldId);
    const valueEl = document.getElementById(filter.id);

    if (fieldEl) {
      fieldEl.value = cachedFilter.field;
    }

    if (typeof filter.updateOptions === "function") {
      filter.updateOptions();
    } else {
      const options = config.getFilterOptions(cachedFilter.field);
      if (valueEl) {
        valueEl.innerHTML = renderCodexSelectOptions(options, cachedFilter.value);
      }
    }

    const updatedValueEl = document.getElementById(filter.id);
    if (updatedValueEl) {
      updatedValueEl.value = cachedFilter.value;
    }
  });

  const sortEl = document.getElementById(config.sortId);
  if (sortEl) {
    sortEl.value = cached.sortMode;
  }

  const directionEl = document.getElementById(config.directionId);
  if (directionEl) {
    directionEl.dataset.direction = cached.direction;
    directionEl.textContent = cached.direction === "asc" ? "↑ ASC" : "↓ DESC";
  }

  updateCodexListSummary(config);
}

function registerCodexMobileListFilterUtility() {
  if (typeof setCodexMobileUtility !== "function") return;

  setCodexMobileUtility({
    type: "filter-sort",
    label: "Filter & Sort",
    panelTitle: "Filter & Sort",
    renderPanel: renderCodexMobileListUtilityPanel,
    bindPanel: bindCodexMobileListUtilityPanel,
    beforeClose: restoreCodexMobileListControls
  });
}

function renderCodexMobileListUtilityPanel() {
  return `<div id="codex-mobile-list-controls-mount" class="codex-mobile-list-controls-mount"></div>`;
}

function bindCodexMobileListUtilityPanel(panel) {
  const mount = panel.querySelector("#codex-mobile-list-controls-mount");
  const controls = document.getElementById("codex-list-controls-shell");

  if (!mount || !controls) return;

  controls.dataset.mobileMounted = "true";
  mount.appendChild(controls);
}

function restoreCodexMobileListControls() {
  const controls = document.getElementById("codex-list-controls-shell");
  const home = document.getElementById("codex-list-controls-home");

  if (!controls || !home) return;

  controls.dataset.mobileMounted = "false";
  home.appendChild(controls);
}

function wrapCodexListRender(config) {
  const originalRenderList = config.renderList;

  return {
    ...config,
    renderList() {
      cacheCodexListState(config);
      originalRenderList();
      updateCodexListSummary(config);
    }
  };
}

function renderCodexListPage(config) {
  const listConfig = wrapCodexListRender(config);
  codexCurrentListConfig = listConfig;

  setCodexTitle(listConfig.title);

  const cached = getCodexCachedListState(listConfig);

  const filtersForRender = listConfig.filters.map((filter, index) => {
    const cachedFilter = cached?.filters?.[index];
    const fieldValue = cachedFilter?.field || filter.fieldValue;
    const selectedValue = cachedFilter?.value || filter.selectedValue || "all";

    return {
      ...filter,
      fieldValue,
      selectedValue,
      fieldOptions: listConfig.fieldOptions,
      options: listConfig.getFilterOptions(fieldValue)
    };
  });

  const controlsHtml = renderCodexListControls({
    filters: filtersForRender,
    sortId: listConfig.sortId,
    selectedSort: cached?.sortMode || listConfig.selectedSort,
    sortOptions: listConfig.sortOptions,
    directionId: listConfig.directionId,
    direction: cached?.direction || "asc"
  });

  setCodexContent(`
    <div class="codex-list-page-shell">
      ${renderCodexListSummary(listConfig)}

      <div class="codex-list-control-split-view">
        <aside class="codex-list-control-rail">
          <div id="codex-list-controls-home">
            <div class="codex-list-controls-shell" id="codex-list-controls-shell" data-mobile-mounted="false">
              <div class="codex-mobile-controls-panel">
                <div class="codex-mobile-controls-heading">
                  <h3>Filter & Sort</h3>
                </div>

                ${controlsHtml}
              </div>
            </div>
          </div>
        </aside>

        <div class="codex-list-scroll-shell codex-scroll-fade">
          <div id="${escapeHtml(listConfig.listId)}"></div>
        </div>
      </div>
    </div>
  `, listConfig.breadcrumbs);

  document.getElementById("codex-content").classList.add("codex-list-page");

  listConfig.bindControls();
  applyCodexCachedListState(listConfig);
  listConfig.renderList();
  registerCodexMobileListFilterUtility();
}

window.registerCodexMobileListFilterUtility = registerCodexMobileListFilterUtility;
