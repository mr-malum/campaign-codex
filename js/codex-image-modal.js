/* =========================================================
   CODEX IMAGE POPOUT MODAL
   ========================================================= */

let codexImageModalLastFocus = null;

function ensureCodexImageModal() {
  let modal = document.getElementById("codex-image-modal");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "codex-image-modal";
  modal.className = "codex-image-modal";
  modal.setAttribute("aria-hidden", "true");

  modal.innerHTML = `
    <div class="codex-image-modal-backdrop" data-codex-image-modal-close="true"></div>
    <div class="codex-image-modal-panel" role="dialog" aria-modal="true" aria-label="Expanded image">
      <button
        class="codex-image-modal-close"
        type="button"
        aria-label="Close image"
        data-codex-image-modal-close="true"
      >✕</button>
      <div class="codex-image-modal-frame">
        <img class="codex-image-modal-img" alt="">
      </div>
    </div>
  `;

  modal.addEventListener("click", event => {
    if (event.target?.dataset?.codexImageModalClose === "true") {
      closeCodexImageModal();
    }
  });

  document.body.appendChild(modal);
  return modal;
}

function openCodexImageModal(src) {
  const cleanSrc = String(src || "").trim();
  if (!cleanSrc) return;

  const modal = ensureCodexImageModal();
  const image = modal.querySelector(".codex-image-modal-img");
  const closeButton = modal.querySelector(".codex-image-modal-close");

  codexImageModalLastFocus = document.activeElement instanceof HTMLElement
    ? document.activeElement
    : null;

  image.src = cleanSrc;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  window.setTimeout(() => closeButton?.focus(), 0);
}

function closeCodexImageModal() {
  const modal = document.getElementById("codex-image-modal");
  if (!modal) return;

  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");

  const image = modal.querySelector(".codex-image-modal-img");
  if (image) image.removeAttribute("src");

  if (codexImageModalLastFocus?.focus) {
    codexImageModalLastFocus.focus();
  }

  codexImageModalLastFocus = null;
}

function getCodexImageModalSourceFromTarget(target) {
  const trigger = target?.closest?.("[data-codex-image-source]");
  if (!trigger || trigger.classList.contains("codex-image-missing")) return "";

  return trigger.dataset.codexImageHref || trigger.dataset.codexImageSource || "";
}

function bindCodexImageModalEvents() {
  document.addEventListener("click", event => {
    const src = getCodexImageModalSourceFromTarget(event.target);
    if (!src) return;

    event.preventDefault();
    event.stopPropagation();
    openCodexImageModal(src);
  }, true);

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      const modal = document.getElementById("codex-image-modal");
      if (modal?.classList.contains("open")) {
        event.preventDefault();
        closeCodexImageModal();
      }
      return;
    }

    if (event.key !== "Enter" && event.key !== " ") return;

    const src = getCodexImageModalSourceFromTarget(event.target);
    if (!src) return;

    event.preventDefault();
    event.stopPropagation();
    openCodexImageModal(src);
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  ensureCodexImageModal();
  bindCodexImageModalEvents();
});

window.openCodexImageModal = openCodexImageModal;
window.closeCodexImageModal = closeCodexImageModal;
