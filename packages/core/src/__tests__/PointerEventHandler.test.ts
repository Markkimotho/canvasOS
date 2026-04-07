import { describe, it, expect } from "vitest";
import { catmullRomSmooth } from "../input/PointerEventHandler.js";
import type { StrokePoint } from "../types/index.js";

const makePoint = (x: number, y: number): StrokePoint => ({
  x,
  y,
  pressure: 0.5,
  tiltX: 0,
  tiltY: 0,
  timestamp: 0,
});

describe("catmullRomSmooth", () => {
  it("returns input unchanged for fewer than 4 points", () => {
    const pts = [makePoint(0, 0), makePoint(1, 1), makePoint(2, 2)];
    expect(catmullRomSmooth(pts)).toStrictEqual(pts);
  });

  it("produces more points than input for 4+ points", () => {
    const pts = [makePoint(0, 0), makePoint(1, 0), makePoint(2, 0), makePoint(3, 0)];
    const smoothed = catmullRomSmooth(pts, 4);
    expect(smoothed.length).toBeGreaterThan(pts.length);
  });

  it("preserves start and end points", () => {
    const pts = [makePoint(0, 0), makePoint(1, 0), makePoint(2, 0), makePoint(3, 0)];
    const smoothed = catmullRomSmooth(pts);
    expect(smoothed[0]).toStrictEqual(pts[0]);
    expect(smoothed[smoothed.length - 1]).toStrictEqual(pts[pts.length - 1]);
  });

  it("smoothed points lie between input extremes", () => {
    const pts = [makePoint(0, 0), makePoint(10, 5), makePoint(20, 5), makePoint(30, 0)];
    const smoothed = catmullRomSmooth(pts);
    for (const p of smoothed) {
      expect(p.x).toBeGreaterThanOrEqual(-1);
      expect(p.x).toBeLessThanOrEqual(31);
    }
  });
});
