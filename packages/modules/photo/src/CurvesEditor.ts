export interface CurvePoint {
  x: number; // 0–1
  y: number; // 0–1
}

export type CurveChannel = "rgb" | "r" | "g" | "b";

/**
 * Compute a Catmull-Rom spline through the given control points and
 * sample it at 256 integer input values to produce a LUT.
 */
function catmullRomSample(points: CurvePoint[], t: number): number {
  if (points.length === 0) return t;
  if (points.length === 1) return points[0]!.y;

  // Clamp to curve range
  if (t <= points[0]!.x) return points[0]!.y;
  if (t >= points[points.length - 1]!.x) return points[points.length - 1]!.y;

  // Find segment
  let i = 1;
  while (i < points.length - 1 && points[i]!.x < t) i++;

  const p0 = points[Math.max(0, i - 2)]!;
  const p1 = points[i - 1]!;
  const p2 = points[i]!;
  const p3 = points[Math.min(points.length - 1, i + 1)]!;

  const dx = p2.x - p1.x;
  if (Math.abs(dx) < 1e-10) return p1.y;

  const u = (t - p1.x) / dx;
  const u2 = u * u;
  const u3 = u2 * u;

  // Catmull-Rom basis
  const m1x = (p2.x - p0.x) / 2;
  const m1y = (p2.y - p0.y) / 2;
  const m2x = (p3.x - p1.x) / 2;
  const m2y = (p3.y - p1.y) / 2;

  // Hermite form
  const h00 = 2 * u3 - 3 * u2 + 1;
  const h10 = u3 - 2 * u2 + u;
  const h01 = -2 * u3 + 3 * u2;
  const h11 = u3 - u2;

  const tangentScaleX = dx;

  return (
    h00 * p1.y +
    h10 * tangentScaleX * (m1y / (m1x === 0 ? 1 : m1x)) * dx +
    h01 * p2.y +
    h11 * tangentScaleX * (m2y / (m2x === 0 ? 1 : m2x)) * dx
  );
}

/**
 * Generate a 256-entry LUT from a set of curve control points.
 * Control points are sorted by x before interpolation.
 * If fewer than 2 points are provided, a linear identity LUT is returned.
 */
export function generateLUT(curve: CurvePoint[]): Uint8Array {
  const lut = new Uint8Array(256);

  if (curve.length === 0) {
    // Identity
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  const sorted = [...curve].sort((a, b) => a.x - b.x);

  // Ensure endpoints exist
  const withEndpoints: CurvePoint[] = [];
  if (sorted[0]!.x > 0) withEndpoints.push({ x: 0, y: sorted[0]!.y });
  withEndpoints.push(...sorted);
  if (sorted[sorted.length - 1]!.x < 1)
    withEndpoints.push({ x: 1, y: sorted[sorted.length - 1]!.y });

  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    const y = catmullRomSample(withEndpoints, t);
    lut[i] = Math.round(Math.max(0, Math.min(1, y)) * 255);
  }

  return lut;
}

/**
 * Apply a 256-entry LUT to the specified channel(s) of an ImageData.
 * Returns a new ImageData with the LUT applied; the original is not mutated.
 */
export function applyLUT(imageData: ImageData, lut: Uint8Array, channel: CurveChannel): ImageData {
  const src = imageData.data;
  const out = new Uint8ClampedArray(src.length);
  out.set(src);

  const len = src.length;

  switch (channel) {
    case "r":
      for (let i = 0; i < len; i += 4) {
        out[i] = lut[src[i]!]!;
      }
      break;

    case "g":
      for (let i = 0; i < len; i += 4) {
        out[i + 1] = lut[src[i + 1]!]!;
      }
      break;

    case "b":
      for (let i = 0; i < len; i += 4) {
        out[i + 2] = lut[src[i + 2]!]!;
      }
      break;

    case "rgb":
    default:
      for (let i = 0; i < len; i += 4) {
        out[i] = lut[src[i]!]!;
        out[i + 1] = lut[src[i + 1]!]!;
        out[i + 2] = lut[src[i + 2]!]!;
      }
      break;
  }

  return new ImageData(out, imageData.width, imageData.height);
}

/**
 * CurvesEditor manages four independent curves: RGB master, R, G, B.
 */
export class CurvesEditor {
  private curves: Record<CurveChannel, CurvePoint[]> = {
    rgb: [],
    r: [],
    g: [],
    b: [],
  };

  private luts: Record<CurveChannel, Uint8Array> = {
    rgb: this.identityLUT(),
    r: this.identityLUT(),
    g: this.identityLUT(),
    b: this.identityLUT(),
  };

  private identityLUT(): Uint8Array {
    const lut = new Uint8Array(256);
    for (let i = 0; i < 256; i++) lut[i] = i;
    return lut;
  }

  setPoints(channel: CurveChannel, points: CurvePoint[]): void {
    this.curves[channel] = [...points];
    this.luts[channel] = generateLUT(points);
  }

  getPoints(channel: CurveChannel): CurvePoint[] {
    return [...this.curves[channel]];
  }

  getLUT(channel: CurveChannel): Uint8Array {
    return this.luts[channel];
  }

  /**
   * Apply all four curves in order: RGB master first, then individual channels.
   */
  applyAll(imageData: ImageData): ImageData {
    let result = applyLUT(imageData, this.luts["rgb"], "rgb");
    result = applyLUT(result, this.luts["r"], "r");
    result = applyLUT(result, this.luts["g"], "g");
    result = applyLUT(result, this.luts["b"], "b");
    return result;
  }

  reset(channel?: CurveChannel): void {
    const channels: CurveChannel[] = channel ? [channel] : ["rgb", "r", "g", "b"];
    for (const ch of channels) {
      this.curves[ch] = [];
      this.luts[ch] = this.identityLUT();
    }
  }
}
