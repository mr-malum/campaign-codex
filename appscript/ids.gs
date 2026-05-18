/**
 * Sequential ID helpers.
 *
 * ID generation is always called under a document lock by Code.gs.
 * It scans the target sheet each time instead of trusting a cached counter,
 * which is slower but safer for a prototype connected to live Sheets.
 */

function parseNumericSuffix_(id, prefix) {
  const value = String(id || "").trim();
  if (!value || value.indexOf(prefix) !== 0) return null;

  const suffix = value.slice(prefix.length);
  if (!/^\d+$/.test(suffix)) return null;
  return Number(suffix);
}

function formatSequentialId_(entity, number) {
  const padded = String(number).padStart(entity.idPadding || 4, "0");
  return `${entity.idPrefix}${padded}`;
}

function getMaxExistingIdNumber_(entity) {
  const sheet = getSheetForEntity_(entity);
  const headers = getHeaders_(sheet);
  assertHeaders_(headers, [entity.idField], sheet.getName());

  const idColumn = getHeaderIndex_(headers)[entity.idField] + 1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;

  const values = sheet.getRange(2, idColumn, lastRow - 1, 1).getValues();
  return values.reduce((max, row) => {
    const parsed = parseNumericSuffix_(row[0], entity.idPrefix);
    return parsed === null ? max : Math.max(max, parsed);
  }, 0);
}

function generateNextId_(entity) {
  let nextNumber = getMaxExistingIdNumber_(entity) + 1;
  let candidate = formatSequentialId_(entity, nextNumber);

  // Defensive loop in case mixed/duplicate manual IDs are present.
  while (entityIdExists_(entity, candidate)) {
    nextNumber++;
    candidate = formatSequentialId_(entity, nextNumber);
  }

  return candidate;
}
