/* =========================================================
   CODEX IMAGE MODAL SWIPE NAVIGATION
   =========================================================

   Adds mobile horizontal swipe navigation for grouped image popouts.
   This intentionally stays separate from pinch/pan handling.
*/

const codexImageModalSwipeState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  startedAt: 0,
  cancelled: false
};

function resetCodexImageModalSwipeState() {
  codexImageModalSwipeState.pointerId = null;
  codexImageModalSwipeState.startX = 0;
  codexImageModalSwipeState.startY = 0;
  codexImageModalSwipeState.lastX = 0;
  codexImageModalSwipeState.lastY = 0;
  codexImageModalSwipeState.startedAt = 0;
  codexImageModalSwipeState.cancelled = false;
}

function canCodexImageModalSwipe() {
  return (
    typeof codexImageModalState !== "undefined" &&
    isCodexImageModalOpen?.() &&
    codexImageModalState.sources?.length > 1 &&
    codexImageModalState.scale <= 1.01 &&
    !codexImageModalState.isPinching &&
    !codexImageModalState.isPanning
  );
}

function maybeStepCodexImageModalFromSwipe() {
  if (!canCodexImageModalSwipe()) return;
  if (codexImageModalSwipeState.cancelled) return;

  const dx = codexImageModalSwipeState.lastX - codexImageModalSwipeState.startX;
  const dy = codexImageModalSwipeState.lastY - codexImageModalSwipeState.startY;
  const elapsed = Date.now() - codexImageModalSwipeState.startedAt;

  const absX = Math.abs(dx);
  const absY = Math.abs(dy);

  if (absX < 52) return;
  if (absX < absY * 1.35) return;
  if (elapsed > 900 && absX < 96) return;

  stepCodexImageModal(dx < 0 ? 1 : -1);
}

function bindCodexImageModalSwipeNavigation() {
  const modal = ensureCodexImageModal?.();
  const frame = modal?.querySelector?.(".codex-image-modal-frame");
  if (!frame || frame.dataset.codexSwipeBound === "true") return;

  frame.dataset.codexSwipeBound = "true";

  frame.addEventListener("pointerdown", event => {
    if (event.pointerType !== "touch") return;
    if (!canCodexImageModalSwipe()) return;

    resetCodexImageModalSwipeState();

    codexImageModalSwipeState.pointerId = event.pointerId;
    codexImageModalSwipeState.startX = event.clientX;
    codexImageModalSwipeState.startY = event.clientY;
    codexImageModalSwipeState.lastX = event.clientX;
    codexImageModalSwipeState.lastY = event.clientY;
    codexImageModalSwipeState.startedAt = Date.now();
  }, true);

  frame.addEventListener("pointermove", event => {
    if (codexImageModalSwipeState.pointerId !== event.pointerId) return;

    codexImageModalSwipeState.lastX = event.clientX;
    codexImageModalSwipeState.lastY = event.clientY;

    if (
      codexImageModalState.activePointers?.size > 1 ||
      codexImageModalState.scale > 1.01 ||
      codexImageModalState.isPinching ||
      codexImageModalState.isPanning
    ) {
      codexImageModalSwipeState.cancelled = true;
    }
  }, true);

  frame.addEventListener("pointerup", event => {
    if (codexImageModalSwipeState.pointerId !== event.pointerId) return;

    codexImageModalSwipeState.lastX = event.clientX;
    codexImageModalSwipeState.lastY = event.clientY;

    window.setTimeout(() => {
      maybeStepCodexImageModalFromSwipe();
      resetCodexImageModalSwipeState();
    }, 0);
  }, true);

  ["pointercancel", "lostpointercapture"].forEach(eventName => {
    frame.addEventListener(eventName, event => {
      if (codexImageModalSwipeState.pointerId !== event.pointerId) return;
      resetCodexImageModalSwipeState();
    }, true);
  });
}

document.addEventListener("DOMContentLoaded", bindCodexImageModalSwipeNavigation);

window.bindCodexImageModalSwipeNavigation = bindCodexImageModalSwipeNavigation;
