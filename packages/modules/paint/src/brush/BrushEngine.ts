import type { StrokePoint, BrushPreset } from "@canvasos/core";

/**
 * BrushEngine — stamp-based WebGL rendering.
 * Each stroke point places a brush stamp on an OffscreenCanvas / WebGL texture.
 */
export class BrushEngine {
  private offscreen: OffscreenCanvas;
  private ctx: OffscreenCanvasRenderingContext2D;
  private currentPreset: BrushPreset;
  private stampCache: Map<string, ImageBitmap> = new Map();

  constructor(width: number, height: number, preset: BrushPreset) {
    this.offscreen = new OffscreenCanvas(width, height);
    this.ctx = this.offscreen.getContext("2d")!;
    this.currentPreset = preset;
  }

  setPreset(preset: BrushPreset): void {
    this.currentPreset = preset;
  }

  async strokePoints(points: StrokePoint[], color: string, isEraser = false): Promise<void> {
    if (points.length === 0) return;
    const ctx = this.ctx;
    const preset = this.currentPreset;

    ctx.globalCompositeOperation = isEraser ? "destination-out" : "source-over";

    for (let i = 0; i < points.length; i++) {
      const pt = points[i]!;

      // Pressure-mapped size and opacity
      const sizeMultiplier = preset.pressureSizeEnabled
        ? this.applyPressureCurve(pt.pressure, preset.pressureCurve)
        : 1;
      const opacityMultiplier = preset.pressureOpacityEnabled ? pt.pressure : 1;

      const radius = (preset.size * sizeMultiplier) / 2;
      const alpha = preset.opacity * opacityMultiplier * preset.flow;

      ctx.globalAlpha = Math.min(1, Math.max(0, alpha));

      switch (preset.type) {
        case "hard-round":
          this.drawHardRound(ctx, pt.x, pt.y, radius, color);
          break;
        case "soft-round":
          this.drawSoftRound(ctx, pt.x, pt.y, radius, color, preset.hardness);
          break;
        case "airbrush":
          this.drawAirbrush(ctx, pt.x, pt.y, radius, color);
          break;
        case "ink-pen":
          this.drawInkPen(ctx, pt, points[i - 1] ?? pt, radius, color);
          break;
        case "watercolor":
          this.drawWatercolor(ctx, pt.x, pt.y, radius, color, preset.wetEdgeAmount ?? 0.3);
          break;
        case "eraser":
          this.drawHardRound(ctx, pt.x, pt.y, radius, "rgba(0,0,0,1)");
          break;
        default:
          this.drawHardRound(ctx, pt.x, pt.y, radius, color);
      }
    }
  }

  private drawHardRound(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
  ): void {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  private drawSoftRound(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    hardness: number,
  ): void {
    const inner = radius * hardness;
    const grad = ctx.createRadialGradient(x, y, inner, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private drawAirbrush(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
  ): void {
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color);
    grad.addColorStop(0.3, color.replace(/[\d.]+\)$/, "0.3)"));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private drawInkPen(
    ctx: OffscreenCanvasRenderingContext2D,
    curr: StrokePoint,
    prev: StrokePoint,
    radius: number,
    color: string,
  ): void {
    // Variable-width line based on speed
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const width = Math.max(0.5, radius * (1 - Math.min(speed / 30, 0.8)));
    ctx.beginPath();
    ctx.moveTo(prev.x, prev.y);
    ctx.lineTo(curr.x, curr.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = width * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  }

  private drawWatercolor(
    ctx: OffscreenCanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    color: string,
    wetEdge: number,
  ): void {
    // Wet edge: lighter center, darker edge
    const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
    grad.addColorStop(0, color.replace(/[\d.]+\)$/, "0.1)"));
    grad.addColorStop(1 - wetEdge, color);
    grad.addColorStop(1, color.replace(/[\d.]+\)$/, "0.05)"));
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private applyPressureCurve(pressure: number, curve: [number, number][]): number {
    if (!curve || curve.length < 2) return pressure;
    // Linear interpolation through curve points
    for (let i = 0; i < curve.length - 1; i++) {
      const [x0, y0] = curve[i]!;
      const [x1, y1] = curve[i + 1]!;
      if (pressure >= x0 && pressure <= x1) {
        const t = (pressure - x0) / (x1 - x0);
        return y0 + (y1 - y0) * t;
      }
    }
    return pressure;
  }

  getImageData(): ImageData {
    return this.ctx.getImageData(0, 0, this.offscreen.width, this.offscreen.height);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.offscreen.width, this.offscreen.height);
  }

  resize(width: number, height: number): void {
    const data = this.getImageData();
    this.offscreen.width = width;
    this.offscreen.height = height;
    this.ctx.putImageData(data, 0, 0);
  }

  destroy(): void {
    for (const bmp of this.stampCache.values()) bmp.close();
    this.stampCache.clear();
  }
}
