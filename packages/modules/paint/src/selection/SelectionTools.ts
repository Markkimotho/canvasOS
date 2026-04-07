/**
 * Selection Tools — outputs a floating Uint8ClampedArray mask channel.
 * 0 = not selected, 255 = fully selected.
 */
export type SelectionMask = Uint8ClampedArray;

export class SelectionTools {
  private width: number;
  private height: number;
  private mask: SelectionMask;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.mask = new Uint8ClampedArray(width * height);
  }

  // ──────────────────────────────────────────────
  // Rectangular marquee
  // ──────────────────────────────────────────────

  rectangularMarquee(x: number, y: number, w: number, h: number, add = false): void {
    if (!add) this.mask.fill(0);
    const x2 = Math.min(x + w, this.width);
    const y2 = Math.min(y + h, this.height);
    for (let py = Math.max(0, y); py < y2; py++) {
      for (let px = Math.max(0, x); px < x2; px++) {
        this.mask[py * this.width + px] = 255;
      }
    }
  }

  // ──────────────────────────────────────────────
  // Elliptical marquee
  // ──────────────────────────────────────────────

  ellipticalMarquee(cx: number, cy: number, rx: number, ry: number, add = false): void {
    if (!add) this.mask.fill(0);
    const x0 = Math.max(0, Math.floor(cx - rx));
    const x1 = Math.min(this.width, Math.ceil(cx + rx));
    const y0 = Math.max(0, Math.floor(cy - ry));
    const y1 = Math.min(this.height, Math.ceil(cy + ry));
    for (let py = y0; py < y1; py++) {
      for (let px = x0; px < x1; px++) {
        const dx = (px - cx) / rx;
        const dy = (py - cy) / ry;
        if (dx * dx + dy * dy <= 1) {
          this.mask[py * this.width + px] = 255;
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // Lasso (polygon-fill)
  // ──────────────────────────────────────────────

  lasso(points: { x: number; y: number }[]): void {
    this.mask.fill(0);
    if (points.length < 3) return;

    const minY = Math.max(0, Math.floor(Math.min(...points.map((p) => p.y))));
    const maxY = Math.min(this.height - 1, Math.ceil(Math.max(...points.map((p) => p.y))));

    for (let py = minY; py <= maxY; py++) {
      const intersections: number[] = [];
      for (let i = 0; i < points.length; i++) {
        const p1 = points[i]!;
        const p2 = points[(i + 1) % points.length]!;
        if ((p1.y <= py && p2.y > py) || (p2.y <= py && p1.y > py)) {
          intersections.push(p1.x + ((py - p1.y) / (p2.y - p1.y)) * (p2.x - p1.x));
        }
      }
      intersections.sort((a, b) => a - b);
      for (let j = 0; j < intersections.length - 1; j += 2) {
        const x0 = Math.max(0, Math.floor(intersections[j]!));
        const x1 = Math.min(this.width, Math.ceil(intersections[j + 1]!));
        for (let px = x0; px < x1; px++) {
          this.mask[py * this.width + px] = 255;
        }
      }
    }
  }

  // ──────────────────────────────────────────────
  // Magic wand (flood fill with tolerance)
  // ──────────────────────────────────────────────

  magicWand(
    imageData: ImageData,
    seedX: number,
    seedY: number,
    tolerance: number,
    add = false,
  ): void {
    if (!add) this.mask.fill(0);
    const { data, width, height } = imageData;
    const idx = (seedY * width + seedX) * 4;
    const sr = data[idx]!;
    const sg = data[idx + 1]!;
    const sb = data[idx + 2]!;
    const sa = data[idx + 3]!;

    const visited = new Uint8Array(width * height);
    const stack = [{ x: seedX, y: seedY }];

    const inTolerance = (x: number, y: number): boolean => {
      const i = (y * width + x) * 4;
      return (
        Math.abs(data[i]! - sr) <= tolerance &&
        Math.abs(data[i + 1]! - sg) <= tolerance &&
        Math.abs(data[i + 2]! - sb) <= tolerance &&
        Math.abs(data[i + 3]! - sa) <= tolerance
      );
    };

    while (stack.length > 0) {
      const pt = stack.pop()!;
      const { x, y } = pt;
      if (x < 0 || y < 0 || x >= width || y >= height) continue;
      const mi = y * width + x;
      if (visited[mi]) continue;
      if (!inTolerance(x, y)) continue;
      visited[mi] = 1;
      this.mask[mi] = 255;
      stack.push({ x: x + 1, y }, { x: x - 1, y }, { x, y: y + 1 }, { x, y: y - 1 });
    }
  }

  // ──────────────────────────────────────────────
  // Quick Mask — load existing alpha as mask
  // ──────────────────────────────────────────────

  fromImageDataAlpha(imageData: ImageData): void {
    for (let i = 0; i < this.width * this.height; i++) {
      this.mask[i] = imageData.data[i * 4 + 3] ?? 0;
    }
  }

  // ──────────────────────────────────────────────
  // Invert, clear
  // ──────────────────────────────────────────────

  invert(): void {
    for (let i = 0; i < this.mask.length; i++) {
      this.mask[i] = 255 - (this.mask[i] ?? 0);
    }
  }

  clear(): void {
    this.mask.fill(0);
  }

  selectAll(): void {
    this.mask.fill(255);
  }

  getMask(): SelectionMask {
    return this.mask;
  }

  hasSelection(): boolean {
    return this.mask.some((v) => v > 0);
  }
}
