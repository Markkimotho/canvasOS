import { useRef, useEffect, useCallback } from "react";
import { ColorSystem } from "../color/ColorSystem.js";

interface Props {
  color: string;
  onChange: (hex: string) => void;
}

/**
 * HSB color wheel — disc shows hue/saturation, vertical strip shows brightness.
 */
export function ColorWheel({ color, onChange }: Props) {
  const wheelRef = useRef<HTMLCanvasElement>(null);
  const SIZE = 160;
  const cx = SIZE / 2;
  const cy = SIZE / 2;
  const radius = SIZE / 2 - 4;

  useEffect(() => {
    const canvas = wheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    drawWheel(ctx, SIZE, cx, cy, radius);
  }, [cx, cy, radius]);

  const drawWheel = (
    ctx: CanvasRenderingContext2D,
    size: number,
    cx: number,
    cy: number,
    r: number,
  ) => {
    ctx.clearRect(0, 0, size, size);
    for (let angle = 0; angle < 360; angle++) {
      const startAngle = (angle - 0.5) * (Math.PI / 180);
      const endAngle = (angle + 0.5) * (Math.PI / 180);
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, `hsl(${angle}, 0%, 100%)`);
      grad.addColorStop(1, `hsl(${angle}, 100%, 50%)`);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.fillStyle = grad;
      ctx.fill();
    }
    // Dark overlay for brightness
    const darken = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    darken.addColorStop(0, "rgba(0,0,0,0)");
    darken.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = darken;
    ctx.fill();
  };

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (SIZE / rect.width);
      const y = (e.clientY - rect.top) * (SIZE / rect.height);
      const ctx = wheelRef.current?.getContext("2d");
      if (!ctx) return;
      const [r, g, b] = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
      const hex = ColorSystem.rgbToHex({ r: r ?? 0, g: g ?? 0, b: b ?? 0, a: 1 });
      onChange(hex);
    },
    [onChange],
  );

  const rgb = ColorSystem.hexToRgb(color);
  const preview = ColorSystem.rgbToCss(rgb);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <canvas
        ref={wheelRef}
        width={SIZE}
        height={SIZE}
        onClick={handleClick}
        role="slider"
        aria-label="Color wheel"
        style={{
          borderRadius: "50%",
          cursor: "crosshair",
          display: "block",
          width: "100%",
          maxWidth: `${SIZE}px`,
          aspectRatio: "1",
        }}
      />
      {/* Color preview + hex input */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center", width: "100%" }}>
        <div
          aria-label={`Current color: ${color}`}
          style={{
            width: "28px",
            height: "28px",
            borderRadius: "4px",
            background: preview,
            border: "1px solid #444",
            flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => {
            if (/^#[0-9a-fA-F]{0,8}$/.test(e.target.value)) onChange(e.target.value);
          }}
          aria-label="Hex color value"
          style={{
            flex: 1,
            background: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "4px",
            color: "#f0f0f0",
            padding: "4px 6px",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        />
        <input
          type="color"
          value={color.slice(0, 7)}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Native color picker"
          style={{
            width: "28px",
            height: "28px",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        />
      </div>
    </div>
  );
}
