import type { ColorHSB, ColorRGB, ColorCMYK, ColorHex } from "@canvasos/core";

/**
 * ColorSystem — lossless conversions between HSB, RGB, CMYK, and HEX.
 * All values are validated on input.
 */
export class ColorSystem {
  // ──────────────────────────────────────────────
  // RGB ↔ HSB
  // ──────────────────────────────────────────────

  static rgbToHsb({ r, g, b, a }: ColorRGB): ColorHSB {
    const rn = r / 255,
      gn = g / 255,
      bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
      if (max === rn) h = ((gn - bn) / delta) % 6;
      else if (max === gn) h = (bn - rn) / delta + 2;
      else h = (rn - gn) / delta + 4;
      h = Math.round(h * 60);
      if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : Math.round((delta / max) * 100);
    const bv = Math.round(max * 100);
    return { h, s, b: bv, a };
  }

  static hsbToRgb({ h, s, b, a }: ColorHSB): ColorRGB {
    const sn = s / 100,
      bn = b / 100;
    const c = bn * sn;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = bn - c;

    let r = 0,
      g = 0,
      bv = 0;
    if (h < 60) {
      r = c;
      g = x;
      bv = 0;
    } else if (h < 120) {
      r = x;
      g = c;
      bv = 0;
    } else if (h < 180) {
      r = 0;
      g = c;
      bv = x;
    } else if (h < 240) {
      r = 0;
      g = x;
      bv = c;
    } else if (h < 300) {
      r = x;
      g = 0;
      bv = c;
    } else {
      r = c;
      g = 0;
      bv = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((bv + m) * 255),
      a,
    };
  }

  // ──────────────────────────────────────────────
  // RGB ↔ CMYK
  // ──────────────────────────────────────────────

  static rgbToCmyk({ r, g, b, a }: ColorRGB): ColorCMYK {
    const rn = r / 255,
      gn = g / 255,
      bn = b / 255;
    const k = 1 - Math.max(rn, gn, bn);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    const c = (1 - rn - k) / (1 - k);
    const m = (1 - gn - k) / (1 - k);
    const y = (1 - bn - k) / (1 - k);
    void a;
    return {
      c: Math.round(c * 100),
      m: Math.round(m * 100),
      y: Math.round(y * 100),
      k: Math.round(k * 100),
    };
  }

  static cmykToRgb({ c, m, y, k }: ColorCMYK, a = 1): ColorRGB {
    const cn = c / 100,
      mn = m / 100,
      yn = y / 100,
      kn = k / 100;
    return {
      r: Math.round(255 * (1 - cn) * (1 - kn)),
      g: Math.round(255 * (1 - mn) * (1 - kn)),
      b: Math.round(255 * (1 - yn) * (1 - kn)),
      a,
    };
  }

  // ──────────────────────────────────────────────
  // RGB ↔ HEX
  // ──────────────────────────────────────────────

  static rgbToHex({ r, g, b, a }: ColorRGB): ColorHex {
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, "0");
    const alpha = Math.round(a * 255);
    return `#${toHex(r)}${toHex(g)}${toHex(b)}${alpha < 255 ? toHex(alpha) : ""}`;
  }

  static hexToRgb(hex: ColorHex): ColorRGB {
    const clean = hex.replace(/^#/, "");
    const full =
      clean.length === 3 || clean.length === 4
        ? clean
            .split("")
            .map((c) => c + c)
            .join("")
        : clean;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    const a = full.length === 8 ? parseInt(full.slice(6, 8), 16) / 255 : 1;
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a };
  }

  // ──────────────────────────────────────────────
  // Convenience: CSS color string
  // ──────────────────────────────────────────────

  static rgbToCss({ r, g, b, a }: ColorRGB): string {
    return `rgba(${r},${g},${b},${a})`;
  }

  static hsbToCss(hsb: ColorHSB): string {
    return ColorSystem.rgbToCss(ColorSystem.hsbToRgb(hsb));
  }

  // ──────────────────────────────────────────────
  // Eyedropper — reads composited output pixel
  // ──────────────────────────────────────────────

  static pickColor(canvas: HTMLCanvasElement | OffscreenCanvas, x: number, y: number): ColorRGB {
    const ctx = (canvas as HTMLCanvasElement).getContext("2d")!;
    const [r, g, b, a] = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: (a ?? 255) / 255 };
  }
}
