/* =========================================================
   CODEX ICONS
   ========================================================= */

const CODEX_ICONS = {
  region: "✥",
  poi: "○",
  "poi-group": "◎",
  npc: "♟",
  hex: "⬡",
  map: "▧",
  lore: "▤",
  journal: "✎",
  search: "⌕",
  all: "▤",
  fallback: "•"
};

function getCodexIcon(key) {
  return CODEX_ICONS[key] || CODEX_ICONS.fallback;
}
