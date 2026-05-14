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

function parseCodexRowLabel(label) {
  const parts = String(label || "")
    .split(" — ")
    .map(part => part.trim())
    .filter(Boolean);

  return {
    title: parts.shift() || "Unnamed Record",
    meta: parts.join(" • ")
  };
}

function renderCodexRow(options) {
  const title = options?.title || "Unnamed Record";
  const meta = options?.meta || "";
  const icon = options?.icon || "";
  const count = options?.count;
  const onclick = options?.onclick || "";
  const extraClasses = options?.classes || "";
  const isActive = Boolean(options?.active);
  const isDisabled = Boolean(options?.disabled);
  const disabledAttr = isDisabled ? "disabled" : "";
  const activeClass = isActive ? "codex-row-active active" : "";
  const disabledClass = isDisabled ? "codex-row-disabled" : "";
  const noIconClass = icon ? "" : "codex-linked-row";

  return `
    <button
      class="codex-row ${noIconClass} ${extraClasses} ${activeClass} ${disabledClass}"
      type="button"
      ${onclick ? `onclick="${onclick}"` : ""}
      ${disabledAttr}
    >
      ${
        icon
          ? `<span class="codex-row-icon" aria-hidden="true">${escapeHtml(icon)}</span>`
          : ""
      }

      <span class="codex-row-main">
        <span class="codex-row-title">${escapeHtml(title)}</span>
        ${meta ? `<span class="codex-row-meta">${escapeHtml(meta)}</span>` : ""}
      </span>

      ${
        count !== undefined && count !== null
          ? `<span class="codex-row-count">${escapeHtml(String(count))}</span>`
          : `<span class="codex-row-arrow" aria-hidden="true">›</span>`
      }
    </button>
  `;
}

function renderCodexLinkedList(
  rows,
  emptyText,
  type,
  idField,
  getLabel,
  getType = null,
  getIcon = null
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
        const { title, meta } = parseCodexRowLabel(label);
        const icon = getIcon ? getIcon(row, resolvedType) : "";

        return renderCodexRow({
          title,
          meta,
          icon,
          classes: "codex-linked-record-row",
          onclick: `openCodexPage('${escapeJsString(resolvedType)}', '${escapeJsString(id)}')`
        });
      }).join("")}
    </div>
  `;
}
