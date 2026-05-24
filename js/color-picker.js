(function () {
  let activePicker = null;

  function normalizeHexColor(value, fallback = "#ffd84d") {
    const color = String(value || "").trim();
    if (/^#[0-9a-f]{6}$/i.test(color)) return color.toLowerCase();
    if (/^[0-9a-f]{6}$/i.test(color)) return `#${color.toLowerCase()}`;
    return fallback;
  }

  function hexToRgb(hex) {
    const normalized = normalizeHexColor(hex).slice(1);
    return {
      r: parseInt(normalized.slice(0, 2), 16),
      g: parseInt(normalized.slice(2, 4), 16),
      b: parseInt(normalized.slice(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    return `#${[r, g, b].map(value => {
      const bounded = Math.max(0, Math.min(255, Number(value) || 0));
      return bounded.toString(16).padStart(2, "0");
    }).join("")}`;
  }

  function rgbToHsv({ r, g, b }) {
    const red = r / 255;
    const green = g / 255;
    const blue = b / 255;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    let hue = 0;

    if (delta) {
      if (max === red) hue = ((green - blue) / delta) % 6;
      else if (max === green) hue = (blue - red) / delta + 2;
      else hue = (red - green) / delta + 4;
      hue *= 60;
      if (hue < 0) hue += 360;
    }

    return {
      h: Math.round(hue),
      s: max === 0 ? 0 : delta / max,
      v: max
    };
  }

  function hsvToRgb(h, s, v) {
    const hue = ((Number(h) || 0) % 360 + 360) % 360;
    const saturation = Math.max(0, Math.min(1, Number(s) || 0));
    const value = Math.max(0, Math.min(1, Number(v) || 0));
    const chroma = value * saturation;
    const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
    const m = value - chroma;
    let red = 0;
    let green = 0;
    let blue = 0;

    if (hue < 60) [red, green, blue] = [chroma, x, 0];
    else if (hue < 120) [red, green, blue] = [x, chroma, 0];
    else if (hue < 180) [red, green, blue] = [0, chroma, x];
    else if (hue < 240) [red, green, blue] = [0, x, chroma];
    else if (hue < 300) [red, green, blue] = [x, 0, chroma];
    else [red, green, blue] = [chroma, 0, x];

    return {
      r: Math.round((red + m) * 255),
      g: Math.round((green + m) * 255),
      b: Math.round((blue + m) * 255)
    };
  }

  function syncColorPickerControl(inputOrId) {
    const input = typeof inputOrId === "string" ? document.getElementById(inputOrId) : inputOrId;
    if (!input) return;

    const control = input.closest(".color-picker-control");
    const button = control?.querySelector("[data-color-picker-trigger]");
    const swatch = button?.querySelector(".color-picker-trigger-swatch");
    const text = button?.querySelector(".color-picker-trigger-value");
    const color = normalizeHexColor(input.value);

    if (swatch) swatch.style.backgroundColor = color;
    if (text) text.textContent = color.toUpperCase();
    if (button) {
      button.disabled = input.disabled;
      button.setAttribute("aria-disabled", input.disabled ? "true" : "false");
    }
  }

  function closeColorPicker({ commit = false } = {}) {
    if (!activePicker) return;
    const { popover, input, draftColor } = activePicker;

    if (commit && input) {
      input.value = normalizeHexColor(draftColor);
      syncColorPickerControl(input);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    }

    popover.remove();
    activePicker = null;
  }

  function positionPopover(popover, trigger) {
    const rect = trigger.getBoundingClientRect();
    const popoverRect = popover.getBoundingClientRect();
    const gap = 8;
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, window.innerWidth - popoverRect.width - 8)
    );
    const below = rect.bottom + gap;
    const top = below + popoverRect.height <= window.innerHeight - 8
      ? below
      : Math.max(8, rect.top - popoverRect.height - gap);

    popover.style.left = `${left}px`;
    popover.style.top = `${top}px`;
  }

  function openColorPicker(input, trigger) {
    if (!input || input.disabled) return;
    closeColorPicker();

    const originalColor = normalizeHexColor(input.value);
    const popover = document.createElement("div");
    popover.className = "color-picker-popover";
    popover.setAttribute("role", "dialog");
    popover.setAttribute("aria-label", "Choose color");
    popover.innerHTML = `
      <div class="color-picker-popover-head">
        <span>Color</span>
      </div>
      <div class="color-picker-spectrum" role="slider" tabindex="0" aria-label="Color shade and saturation">
        <span class="color-picker-spectrum-target" aria-hidden="true"></span>
      </div>
      <div class="color-picker-hue-row">
        <input class="color-picker-hue" type="range" min="0" max="359" aria-label="Hue">
      </div>
      <div class="color-picker-preview-row">
        <div class="color-picker-preview" aria-hidden="true"></div>
        <label class="color-picker-hex-row">
          <span>Hex</span>
          <input class="color-picker-hex-input" type="text" maxlength="7" spellcheck="false">
        </label>
      </div>
      <div class="color-picker-slider-list">
        ${["r", "g", "b"].map(channel => `
          <label class="color-picker-slider-row">
            <span>${channel.toUpperCase()}</span>
            <input class="color-picker-slider" data-color-channel="${channel}" type="range" min="0" max="255">
            <output></output>
          </label>
        `).join("")}
      </div>
      <div class="color-picker-actions">
        <button class="color-picker-confirm" type="button" aria-label="Confirm color">✓</button>
        <button class="color-picker-close" type="button" aria-label="Cancel color change">✕</button>
      </div>
    `;
    document.body.appendChild(popover);

    activePicker = {
      popover,
      input,
      trigger,
      originalColor,
      draftColor: originalColor
    };

    const spectrum = popover.querySelector(".color-picker-spectrum");
    const spectrumTarget = popover.querySelector(".color-picker-spectrum-target");
    const hueSlider = popover.querySelector(".color-picker-hue");
    const preview = popover.querySelector(".color-picker-preview");
    const hexInput = popover.querySelector(".color-picker-hex-input");
    const sliders = [...popover.querySelectorAll(".color-picker-slider")];
    let hsv = rgbToHsv(hexToRgb(originalColor));

    function renderDraft(color, options = {}) {
      const nextColor = normalizeHexColor(color, activePicker.draftColor);
      const rgb = hexToRgb(nextColor);
      const nextHsv = rgbToHsv(rgb);
      hsv = {
        ...nextHsv,
        h: options.preserveHue || nextHsv.s === 0 || nextHsv.v === 0 ? hsv.h : nextHsv.h,
        s: options.hsv?.s ?? nextHsv.s,
        v: options.hsv?.v ?? nextHsv.v
      };
      activePicker.draftColor = nextColor;
      if (preview) preview.style.backgroundColor = nextColor;
      if (spectrum) spectrum.style.setProperty("--picker-hue-color", rgbToHex(...Object.values(hsvToRgb(hsv.h, 1, 1))));
      if (spectrumTarget) {
        spectrumTarget.style.left = `${hsv.s * 100}%`;
        spectrumTarget.style.top = `${(1 - hsv.v) * 100}%`;
      }
      if (hueSlider) hueSlider.value = hsv.h;
      if (hexInput) hexInput.value = nextColor.toUpperCase();
      sliders.forEach(slider => {
        const channel = slider.dataset.colorChannel;
        slider.value = rgb[channel];
        const output = slider.closest(".color-picker-slider-row")?.querySelector("output");
        if (output) output.textContent = rgb[channel];
      });
    }

    function renderFromHsv(nextHsv) {
      hsv = {
        h: Math.max(0, Math.min(359, Number(nextHsv.h) || 0)),
        s: Math.max(0, Math.min(1, Number(nextHsv.s) || 0)),
        v: Math.max(0, Math.min(1, Number(nextHsv.v) || 0))
      };
      const rgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
      renderDraft(rgbToHex(rgb.r, rgb.g, rgb.b));
    }

    function pickFromSpectrum(event) {
      const rect = spectrum?.getBoundingClientRect();
      if (!rect) return;
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
      const nextHsv = {
        ...hsv,
        s: x / rect.width,
        v: 1 - y / rect.height
      };
      const rgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
      renderDraft(rgbToHex(rgb.r, rgb.g, rgb.b), { preserveHue: true, hsv: nextHsv });
    }

    renderDraft(originalColor);
    positionPopover(popover, trigger);

    popover.querySelector(".color-picker-close")?.addEventListener("click", () => closeColorPicker({ commit: false }));
    popover.querySelector(".color-picker-confirm")?.addEventListener("click", () => closeColorPicker({ commit: true }));

    hexInput?.addEventListener("input", () => {
      const value = hexInput.value.trim();
      if (/^#?[0-9a-f]{6}$/i.test(value)) renderDraft(value);
    });

    sliders.forEach(slider => {
      slider.addEventListener("input", () => {
        const current = hexToRgb(activePicker.draftColor);
        current[slider.dataset.colorChannel] = Number(slider.value);
        renderDraft(rgbToHex(current.r, current.g, current.b));
      });
    });

    hueSlider?.addEventListener("input", () => {
      renderFromHsv({ ...hsv, h: Number(hueSlider.value) });
    });

    spectrum?.addEventListener("pointerdown", event => {
      event.preventDefault();
      spectrum.setPointerCapture?.(event.pointerId);
      pickFromSpectrum(event);
    });

    spectrum?.addEventListener("pointermove", event => {
      if ((event.buttons & 1) !== 1) return;
      pickFromSpectrum(event);
    });

    hexInput?.focus();
    hexInput?.select();
  }

  document.addEventListener("click", event => {
    const trigger = event.target.closest("[data-color-picker-trigger]");
    if (trigger) {
      event.preventDefault();
      const control = trigger.closest(".color-picker-control");
      const input = control?.querySelector("[data-color-picker-value]");
      openColorPicker(input, trigger);
      return;
    }

    if (activePicker && !event.target.closest(".color-picker-popover")) {
      closeColorPicker({ commit: false });
    }
  });

  document.addEventListener("keydown", event => {
    if (!activePicker) return;
    if (event.key === "Escape") closeColorPicker({ commit: false });
    if (event.key === "Enter" && event.target.closest(".color-picker-popover")) {
      event.preventDefault();
      closeColorPicker({ commit: true });
    }
  });

  window.syncColorPickerControl = syncColorPickerControl;
  window.normalizeHexColor = normalizeHexColor;
  window.openColorPickerForInput = openColorPicker;
})();
