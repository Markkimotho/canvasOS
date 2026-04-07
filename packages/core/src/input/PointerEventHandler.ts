import type { StrokePoint } from "../types/index.js";

export type StrokeCallback = (points: StrokePoint[]) => void;
export type StrokeEndCallback = (points: StrokePoint[]) => void;

/**
 * Normalizes mouse / touch / stylus PointerEvents into StrokePoint streams.
 * Applies Catmull-Rom spline smoothing on stroke end.
 */
export class PointerEventHandler {
  private canvas: HTMLCanvasElement;
  private active = false;
  private currentStroke: StrokePoint[] = [];
  private onStroke: StrokeCallback;
  private onStrokeEnd: StrokeEndCallback;

  constructor(canvas: HTMLCanvasElement, onStroke: StrokeCallback, onStrokeEnd: StrokeEndCallback) {
    this.canvas = canvas;
    this.onStroke = onStroke;
    this.onStrokeEnd = onStrokeEnd;
    this.bindEvents();
  }

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", this.onDown);
    this.canvas.addEventListener("pointermove", this.onMove);
    this.canvas.addEventListener("pointerup", this.onUp);
    this.canvas.addEventListener("pointercancel", this.onUp);
    this.canvas.addEventListener("pointerleave", this.onUp);
  }

  private toPoint(e: PointerEvent): StrokePoint {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      pressure: e.pressure === 0 && e.pointerType === "mouse" ? 0.5 : e.pressure,
      tiltX: e.tiltX ?? 0,
      tiltY: e.tiltY ?? 0,
      timestamp: e.timeStamp,
    };
  }

  private onDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType !== "touch") return;
    this.canvas.setPointerCapture(e.pointerId);
    this.active = true;
    this.currentStroke = [this.toPoint(e)];
    this.onStroke(this.currentStroke);
  };

  private onMove = (e: PointerEvent) => {
    if (!this.active) return;
    // CoalescedEvents for high-frequency stylus data
    const events = "getCoalescedEvents" in e ? (e as PointerEvent).getCoalescedEvents() : [e];
    for (const ev of events) {
      this.currentStroke.push(this.toPoint(ev));
    }
    this.onStroke(this.currentStroke);
  };

  private onUp = (e: PointerEvent) => {
    if (!this.active) return;
    this.active = false;
    this.currentStroke.push(this.toPoint(e));
    const smoothed = catmullRomSmooth(this.currentStroke);
    this.onStrokeEnd(smoothed);
    this.currentStroke = [];
  };

  destroy() {
    this.canvas.removeEventListener("pointerdown", this.onDown);
    this.canvas.removeEventListener("pointermove", this.onMove);
    this.canvas.removeEventListener("pointerup", this.onUp);
    this.canvas.removeEventListener("pointercancel", this.onUp);
    this.canvas.removeEventListener("pointerleave", this.onUp);
  }
}

/**
 * Catmull-Rom spline interpolation between stroke points.
 * Inserts intermediate points for smooth curves.
 */
export function catmullRomSmooth(points: StrokePoint[], segments = 4): StrokePoint[] {
  if (points.length < 4) return points;
  const result: StrokePoint[] = [points[0]!];

  for (let i = 1; i < points.length - 2; i++) {
    const p0 = points[i - 1]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[i + 2]!;

    for (let t = 0; t <= segments; t++) {
      const u = t / segments;
      const u2 = u * u;
      const u3 = u2 * u;

      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * u +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * u2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * u3);
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * u +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * u2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * u3);

      result.push({
        x,
        y,
        pressure: lerp(p1.pressure, p2.pressure, u),
        tiltX: lerp(p1.tiltX, p2.tiltX, u),
        tiltY: lerp(p1.tiltY, p2.tiltY, u),
        timestamp: lerp(p1.timestamp, p2.timestamp, u),
      });
    }
  }

  result.push(points[points.length - 1]!);
  return result;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
