/**
 * CanvasOS Example Plugin: Auto Color Palette
 *
 * Reads the active layer's pixels and extracts the 8 most dominant colors
 * using a simple median cut algorithm, then displays them in a panel.
 *
 * Permissions required: canvas.read, ui.panel
 */

// Entry point — called when plugin is loaded
(async () => {
  const layers = await canvasOS.canvas.getLayers();
  const activeLayer = layers.find((l) => l.visible) ?? layers[0];

  if (!activeLayer) {
    await canvasOS.ui.showPanel("<p style='color:#ef4444'>No layers found.</p>");
    return;
  }

  // Get pixels from active layer (full bounds)
  const rect = new DOMRect(0, 0, activeLayer.width, activeLayer.height);
  const imageData = await canvasOS.canvas.getPixels(activeLayer.id, rect);

  // Extract palette using median cut
  const palette = extractPalette(imageData.data, 8);

  // Build panel HTML
  const swatches = palette
    .map(
      ([r, g, b]) =>
        `<div style="width:40px;height:40px;border-radius:6px;background:rgb(${r},${g},${b});
         title="${r},${g},${b}"></div>`,
    )
    .join("");

  const html = `
    <style>
      body { font-family: system-ui; background: #1e1e1e; color: #f0f0f0; padding: 16px; }
      h2 { margin: 0 0 12px; font-size: 14px; }
      .grid { display: flex; flex-wrap: wrap; gap: 8px; }
    </style>
    <h2>Color Palette — ${activeLayer.name}</h2>
    <div class="grid">${swatches}</div>
  `;

  await canvasOS.ui.showPanel(html);
})();

/**
 * Simple median cut color quantization.
 * @param {Uint8ClampedArray} data - RGBA pixel data
 * @param {number} colorCount - number of colors to extract
 * @returns {[number, number, number][]} - array of [r, g, b] tuples
 */
function extractPalette(data, colorCount) {
  // Sample every 4th pixel for speed
  const pixels = [];
  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (a > 128) pixels.push([r, g, b]);
  }

  if (pixels.length === 0) return [];

  function medianCut(pixels, depth) {
    if (depth === 0 || pixels.length === 0) {
      // Return average color of this bucket
      const avg = [0, 0, 0];
      for (const p of pixels) {
        avg[0] += p[0];
        avg[1] += p[1];
        avg[2] += p[2];
      }
      return [avg.map((v) => Math.round(v / pixels.length))];
    }

    // Find channel with greatest range
    const ranges = [0, 1, 2].map((ch) => {
      const vals = pixels.map((p) => p[ch]);
      return Math.max(...vals) - Math.min(...vals);
    });
    const channel = ranges.indexOf(Math.max(...ranges));

    pixels.sort((a, b) => a[channel] - b[channel]);
    const mid = Math.floor(pixels.length / 2);

    return [
      ...medianCut(pixels.slice(0, mid), depth - 1),
      ...medianCut(pixels.slice(mid), depth - 1),
    ];
  }

  const depth = Math.ceil(Math.log2(colorCount));
  return medianCut(pixels, depth).slice(0, colorCount);
}
