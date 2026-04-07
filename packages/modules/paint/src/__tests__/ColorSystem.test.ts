import { describe, it, expect } from "vitest";
import { ColorSystem } from "../color/ColorSystem.js";

describe("ColorSystem", () => {
  describe("RGB ↔ HSB", () => {
    it("converts red correctly", () => {
      const rgb = { r: 255, g: 0, b: 0, a: 1 };
      const hsb = ColorSystem.rgbToHsb(rgb);
      expect(hsb.h).toBe(0);
      expect(hsb.s).toBe(100);
      expect(hsb.b).toBe(100);
    });

    it("converts pure blue", () => {
      const rgb = { r: 0, g: 0, b: 255, a: 1 };
      const hsb = ColorSystem.rgbToHsb(rgb);
      expect(hsb.h).toBe(240);
    });

    it("round-trips RGB → HSB → RGB", () => {
      const original = { r: 123, g: 45, b: 200, a: 1 };
      const hsb = ColorSystem.rgbToHsb(original);
      const back = ColorSystem.hsbToRgb(hsb);
      expect(back.r).toBeCloseTo(original.r, -1);
      expect(back.g).toBeCloseTo(original.g, -1);
      expect(back.b).toBeCloseTo(original.b, -1);
    });

    it("handles black", () => {
      const hsb = ColorSystem.rgbToHsb({ r: 0, g: 0, b: 0, a: 1 });
      expect(hsb.b).toBe(0);
      const rgb = ColorSystem.hsbToRgb(hsb);
      expect(rgb.r).toBe(0);
    });

    it("handles white", () => {
      const hsb = ColorSystem.rgbToHsb({ r: 255, g: 255, b: 255, a: 1 });
      expect(hsb.s).toBe(0);
      expect(hsb.b).toBe(100);
    });
  });

  describe("RGB ↔ CMYK", () => {
    it("converts red to CMYK", () => {
      const cmyk = ColorSystem.rgbToCmyk({ r: 255, g: 0, b: 0, a: 1 });
      expect(cmyk.c).toBe(0);
      expect(cmyk.m).toBe(100);
      expect(cmyk.y).toBe(100);
      expect(cmyk.k).toBe(0);
    });

    it("round-trips RGB → CMYK → RGB", () => {
      const original = { r: 120, g: 60, b: 200, a: 1 };
      const cmyk = ColorSystem.rgbToCmyk(original);
      const back = ColorSystem.cmykToRgb(cmyk);
      expect(back.r).toBeCloseTo(original.r, -1);
      expect(back.g).toBeCloseTo(original.g, -1);
      expect(back.b).toBeCloseTo(original.b, -1);
    });

    it("converts black correctly", () => {
      const cmyk = ColorSystem.rgbToCmyk({ r: 0, g: 0, b: 0, a: 1 });
      expect(cmyk.k).toBe(100);
    });
  });

  describe("RGB ↔ HEX", () => {
    it("converts to hex", () => {
      expect(ColorSystem.rgbToHex({ r: 255, g: 0, b: 0, a: 1 })).toBe("#ff0000");
    });

    it("parses hex to RGB", () => {
      const rgb = ColorSystem.hexToRgb("#ff0000");
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it("handles 3-char hex", () => {
      const rgb = ColorSystem.hexToRgb("#f00");
      expect(rgb.r).toBe(255);
      expect(rgb.g).toBe(0);
      expect(rgb.b).toBe(0);
    });

    it("handles alpha in hex", () => {
      const hex = ColorSystem.rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 });
      expect(hex).toBe("#ff000080");
    });
  });
});
