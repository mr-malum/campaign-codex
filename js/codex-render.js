function renderCodexSelectOptions(options, selectedValue = null) {
  return options.map(option => {
    const value = typeof option === "string" ? option : option.value;
    const label = typeof option === "string" ? option : option.label;

    return `
      <option
        value="${escapeHtml(value)}"
        ${selectedValue === value ? "selected" : ""}
      >
        ${escapeHtml(label)}
      </option>
    `;
  }).join("");
}

function renderCodexListControls(config) {
  const filters = config.filters || [];

  return `
    <div class="codex-filter-row">
      ${filters.map(filter => `
        <label class="codex-dynamic-filter">
          <select
            id="${escapeHtml(filter.fieldId || `${filter.id}-field`)}"
            class="codex-filter-field-select"
          >
              ${renderCodexSelectOptions(
                filter.fieldOptions || [
                  {
                    value: filter.fieldValue || filter.id,
                    label: filter.label
                  }
                ],
                filter.fieldValue || filter.id
              )}
          </select>

          <select id="${escapeHtml(filter.id)}">
            ${renderCodexSelectOptions(filter.options, filter.selectedValue)}
          </select>
        </label>
      `).join("")}

      <label class="codex-sort-label">
        <span class="codex-sort-topline">
          Sort

          <button
            id="${escapeHtml(config.directionId)}"
            class="codex-sort-direction"
            type="button"
            data-direction="${escapeHtml(config.direction || "asc")}"
          >
            ${config.direction === "desc" ? "↓ DESC" : "↑ ASC"}
          </button>
        </span>

        <select id="${escapeHtml(config.sortId)}">
          ${renderCodexSelectOptions(config.sortOptions, config.selectedSort)}
        </select>
      </label>
    </div>
  `;
}


function renderCodexLinkedList(
  rows,
  emptyText,
  type,
  idField,
  getLabel,
  getType = null
) {
  if (!rows.length) {
    return `<p>${escapeHtml(emptyText)}</p>`;
  }

  return `
    <div class="codex-row-list codex-linked-row-list">
      ${rows.map(row => {
        const id = row?.__codexRecordId || row?.[idField];

        const resolvedType = row?.__codexRecordType || (
          getType
            ? getType(row)
            : type
        );

        const label = getLabel(row) || id || "Unnamed Record";

        const parts = String(label).split(" — ");

        const title = parts.shift() || "Unnamed Record";

        const metaLine = parts.filter(Boolean).join(" • ");

        return `
          <button
            class="codex-row codex-linked-row"
            type="button"
            onclick="openCodexPage('${escapeJsString(resolvedType)}', '${escapeJsString(id)}')"
          >
            <span class="codex-row-main">
              <span class="codex-row-title">${escapeHtml(title)}</span>

              ${
                metaLine
                  ? `<span class="codex-row-meta">${escapeHtml(metaLine)}</span>`
                  : ""
              }
            </span>

            <span class="codex-row-arrow" aria-hidden="true">›</span>
          </button>
        `;
      }).join("")}
    </div>
  `;
}
