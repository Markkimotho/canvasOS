import { describe, it, expect } from "vitest";
import { interpolate } from "../KeyframeEngine.js";
import type { KeyframeData } from "@canvasos/core";

describe("interpolate", () => {
  const frames: KeyframeData[] = [
    { time: 0, value: 0, easing: "linear" },
    { time: 24, value: 100, easing: "linear" },
  ];

  it("returns start value at t=0", () => {
    expect(interpolate("x", frames, 0)).toBe(0);
  });

  it("returns end value at t=24", () => {
    expect(interpolate("x", frames, 24)).toBe(100);
  });

  it("interpolates linearly between keyframes", () => {
    expect(interpolate("x", frames, 12)).toBeCloseTo(50, 1);
    expect(interpolate("x", frames, 6)).toBeCloseTo(25, 1);
  });

  it("clamps before first keyframe", () => {
    expect(interpolate("x", frames, -5)).toBe(0);
  });

  it("clamps after last keyframe", () => {
    expect(interpolate("x", frames, 48)).toBe(100);
  });

  it("ease-in-quad gives nonlinear (slow start) result at midpoint", () => {
    const easeFrames: KeyframeData[] = [
      { time: 0, value: 0, easing: "ease-in-quad" },
      { time: 24, value: 100, easing: "ease-in-quad" },
    ];
    const mid = interpolate("y", easeFrames, 12);
    expect(mid).toBeLessThan(50); // ease-in starts slow
  });

  it("handles multiple keyframe segments", () => {
    const multi: KeyframeData[] = [
      { time: 0, value: 0, easing: "linear" },
      { time: 10, value: 100, easing: "linear" },
      { time: 20, value: 50, easing: "linear" },
    ];
    expect(interpolate("scaleX", multi, 5)).toBeCloseTo(50, 1);
    expect(interpolate("scaleX", multi, 15)).toBeCloseTo(75, 1);
  });

  it("returns 0 for empty keyframes array", () => {
    expect(interpolate("x", [], 10)).toBe(0);
  });
});
