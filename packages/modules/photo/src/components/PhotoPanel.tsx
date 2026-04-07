import React, { useCallback, useRef, useState } from "react";
import type { PhotoAdjustmentParams } from "../PhotoLayer.js";
import { BackgroundRemover } from "../BackgroundRemover.js";
import type { CurveChannel, CurvePoint } from "../CurvesEditor.js";
import { generateLUT } from "../CurvesEditor.js";

// ---------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------

interface SliderRowProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

function SliderRow({ label, value, min, max, step = 1, onChange }: SliderRowProps) {
  const id = `photo-slider-${label.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <div className="flex items-center gap-3 py-1">
      <label htmlFor={id} className="w-24 shrink-0 text-sm text-zinc-300">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={`Adjust ${label}`}
        aria-valuenow={value}
        aria-valuemin={min}
        aria-valuemax={max}
        className="flex-1 accent-sky-500 cursor-pointer"
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="w-10 text-right text-xs tabular-nums text-zinc-400">
        {value > 0 ? `+${value}` : value}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Curves editor (canvas-based interactive spline)
// ---------------------------------------------------------------------------

const CANVAS_SIZE = 220;
const POINT_RADIUS = 5;

const CHANNEL_COLORS: Record<CurveChannel, string> = {
  rgb: "#e5e7eb",
  r: "#f87171",
  g: "#4ade80",
  b: "#60a5fa",
};

interface CurvesCanvasProps {
  channel: CurveChannel;
  points: CurvePoint[];
  onChange: (pts: CurvePoint[]) => void;
}

function CurvesCanvas({ channel, points, onChange }: CurvesCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragging = useRef<number | null>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Background
    ctx.fillStyle = "#18181b";
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Grid lines
    ctx.strokeStyle = "#3f3f46";
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 4; i++) {
      const pos = (i / 4) * CANVAS_SIZE;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(CANVAS_SIZE, pos);
      ctx.stroke();
    }

    // Diagonal identity reference
    ctx.strokeStyle = "#52525b";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, CANVAS_SIZE);
    ctx.lineTo(CANVAS_SIZE, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // Generate LUT for the current points and draw curve
    const lut = generateLUT(points);
    ctx.strokeStyle = CHANNEL_COLORS[channel];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < CANVAS_SIZE; x++) {
      const inputVal = Math.round((x / (CANVAS_SIZE - 1)) * 255);
      const outputVal = lut[inputVal] ?? inputVal;
      const cy = CANVAS_SIZE - (outputVal / 255) * CANVAS_SIZE;
      if (x === 0) ctx.moveTo(x, cy);
      else ctx.lineTo(x, cy);
    }
    ctx.stroke();

    // Control points
    for (const pt of points) {
      const cx = pt.x * CANVAS_SIZE;
      const cy = (1 - pt.y) * CANVAS_SIZE;
      ctx.beginPath();
      ctx.arc(cx, cy, POINT_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = CHANNEL_COLORS[channel];
      ctx.fill();
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [channel, points]);

  // Redraw whenever draw changes
  React.useEffect(() => {
    draw();
  }, [draw]);

  const toPoint = (e: React.MouseEvent<HTMLCanvasElement>): CurvePoint => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / CANVAS_SIZE)),
      y: Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / CANVAS_SIZE)),
    };
  };

  const findNearest = (pt: CurvePoint): number => {
    let best = -1;
    let bestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dx = (points[i]!.x - pt.x) * CANVAS_SIZE;
      const dy = (points[i]!.y - pt.y) * CANVAS_SIZE;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    return bestDist < POINT_RADIUS * 2 ? best : -1;
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toPoint(e);
    const idx = findNearest(pt);
    if (idx >= 0) {
      dragging.current = idx;
    } else {
      const newPts = [...points, pt].sort((a, b) => a.x - b.x);
      onChange(newPts);
      dragging.current = newPts.findIndex((p) => p.x === pt.x && p.y === pt.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging.current === null) return;
    const pt = toPoint(e);
    const newPts = [...points];
    newPts[dragging.current] = pt;
    onChange(newPts.sort((a, b) => a.x - b.x));
  };

  const handleMouseUp = () => {
    dragging.current = null;
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = toPoint(e);
    const idx = findNearest(pt);
    if (idx >= 0) {
      const newPts = points.filter((_, i) => i !== idx);
      onChange(newPts);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      role="img"
      aria-label={`Tone curve editor for ${channel === "rgb" ? "RGB master" : channel.toUpperCase()} channel`}
      className="cursor-crosshair rounded border border-zinc-700 select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    />
  );
}

// ---------------------------------------------------------------------------
// Curves section with channel tabs
// ---------------------------------------------------------------------------

interface CurvesSectionProps {
  curves: Record<CurveChannel, CurvePoint[]>;
  onChange: (channel: CurveChannel, pts: CurvePoint[]) => void;
}

function CurvesSection({ curves, onChange }: CurvesSectionProps) {
  const [activeChannel, setActiveChannel] = useState<CurveChannel>("rgb");

  const channels: CurveChannel[] = ["rgb", "r", "g", "b"];
  const tabLabels: Record<CurveChannel, string> = {
    rgb: "RGB",
    r: "R",
    g: "G",
    b: "B",
  };

  return (
    <section aria-label="Tone curves editor" className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">Curves</h3>
      <div role="tablist" aria-label="Curve channel selector" className="flex gap-1 mb-2">
        {channels.map((ch) => (
          <button
            key={ch}
            role="tab"
            aria-selected={activeChannel === ch}
            aria-controls={`curves-panel-${ch}`}
            className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
              activeChannel === ch
                ? "bg-sky-600 text-white"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
            onClick={() => setActiveChannel(ch)}
          >
            {tabLabels[ch]}
          </button>
        ))}
      </div>
      <div
        id={`curves-panel-${activeChannel}`}
        role="tabpanel"
        aria-label={`Tone curve for ${activeChannel === "rgb" ? "RGB master" : activeChannel.toUpperCase()} channel`}
      >
        <CurvesCanvas
          channel={activeChannel}
          points={curves[activeChannel]}
          onChange={(pts) => onChange(activeChannel, pts)}
        />
        <p className="text-[10px] text-zinc-600 mt-1">
          Click to add point · Double-click to remove · Drag to adjust
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Default params
// ---------------------------------------------------------------------------

const DEFAULT_PARAMS: PhotoAdjustmentParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  vibrance: 0,
  saturation: 0,
  temperature: 0,
  tint: 0,
};

// ---------------------------------------------------------------------------
// Main PhotoPanel component
// ---------------------------------------------------------------------------

export interface PhotoPanelProps {
  params?: Partial<PhotoAdjustmentParams>;
  onParamsChange?: (params: PhotoAdjustmentParams) => void;
  onRemoveBackground?: (result: ImageData) => void;
  onImportRaw?: (file: File) => void;
  sourceImageData?: ImageData;
}

export function PhotoPanel({
  params: externalParams,
  onParamsChange,
  onRemoveBackground,
  onImportRaw,
  sourceImageData,
}: PhotoPanelProps) {
  const [params, setParams] = useState<PhotoAdjustmentParams>({
    ...DEFAULT_PARAMS,
    ...externalParams,
  });
  const [curves, setCurves] = useState<Record<CurveChannel, CurvePoint[]>>({
    rgb: [],
    r: [],
    g: [],
    b: [],
  });
  const [removingBg, setRemovingBg] = useState(false);
  const [bgError, setBgError] = useState<string | null>(null);
  const rawInputRef = useRef<HTMLInputElement>(null);

  const updateParam = useCallback(
    (key: keyof PhotoAdjustmentParams, value: number) => {
      const updated = { ...params, [key]: value };
      setParams(updated);
      onParamsChange?.(updated);
    },
    [params, onParamsChange],
  );

  const handleCurveChange = useCallback((channel: CurveChannel, pts: CurvePoint[]) => {
    setCurves((prev) => ({ ...prev, [channel]: pts }));
  }, []);

  const handleRemoveBackground = useCallback(async () => {
    if (!sourceImageData) {
      setBgError("No image data available");
      return;
    }
    setRemovingBg(true);
    setBgError(null);
    try {
      const remover = new BackgroundRemover();
      const result = await remover.removeBackground(sourceImageData);
      onRemoveBackground?.(result);
    } catch (err) {
      setBgError(err instanceof Error ? err.message : "Background removal failed");
    } finally {
      setRemovingBg(false);
    }
  }, [sourceImageData, onRemoveBackground]);

  const handleRawFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        onImportRaw?.(file);
        // Reset so the same file can be re-imported
        e.target.value = "";
      }
    },
    [onImportRaw],
  );

  const adjustments: Array<{
    key: keyof PhotoAdjustmentParams;
    label: string;
    min: number;
    max: number;
    step: number;
  }> = [
    { key: "exposure", label: "Exposure", min: -5, max: 5, step: 0.1 },
    { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
    { key: "highlights", label: "Highlights", min: -100, max: 100, step: 1 },
    { key: "shadows", label: "Shadows", min: -100, max: 100, step: 1 },
    { key: "whites", label: "Whites", min: -100, max: 100, step: 1 },
    { key: "blacks", label: "Blacks", min: -100, max: 100, step: 1 },
    { key: "clarity", label: "Clarity", min: -100, max: 100, step: 1 },
    { key: "vibrance", label: "Vibrance", min: -100, max: 100, step: 1 },
    { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
    { key: "temperature", label: "Temperature", min: -100, max: 100, step: 1 },
    { key: "tint", label: "Tint", min: -100, max: 100, step: 1 },
  ];

  return (
    <aside
      aria-label="Photo adjustment panel"
      className="flex flex-col gap-2 w-64 bg-zinc-900 text-zinc-100 p-4 overflow-y-auto h-full"
    >
      {/* Adjustments */}
      <section aria-label="Light and color adjustments">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Adjustments
        </h3>
        {adjustments.map(({ key, label, min, max, step }) => (
          <SliderRow
            key={key}
            label={label}
            value={params[key]}
            min={min}
            max={max}
            step={step}
            onChange={(v) => updateParam(key, v)}
          />
        ))}
      </section>

      {/* Curves */}
      <CurvesSection curves={curves} onChange={handleCurveChange} />

      {/* Background removal */}
      <section aria-label="Background removal" className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Background
        </h3>
        <button
          aria-label="Remove background from image using AI"
          aria-busy={removingBg}
          disabled={removingBg || !sourceImageData}
          className="w-full rounded bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={() => void handleRemoveBackground()}
        >
          {removingBg ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                aria-hidden="true"
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Removing…
            </span>
          ) : (
            "Remove Background"
          )}
        </button>
        {bgError && (
          <p role="alert" className="mt-1 text-xs text-red-400">
            {bgError}
          </p>
        )}
      </section>

      {/* Import RAW */}
      <section aria-label="Import RAW photo file" className="mt-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-zinc-500 mb-2">
          Import
        </h3>
        <button
          aria-label="Import RAW photo file (.cr2, .cr3, .nef, .arw, .dng)"
          className="w-full rounded bg-zinc-700 px-3 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-600 transition-colors"
          onClick={() => rawInputRef.current?.click()}
        >
          Import RAW
        </button>
        <input
          ref={rawInputRef}
          type="file"
          accept=".cr2,.cr3,.nef,.arw,.dng"
          aria-label="RAW photo file picker"
          className="sr-only"
          tabIndex={-1}
          onChange={handleRawFileChange}
        />
        <p className="mt-1 text-[10px] text-zinc-600">Supports .cr2 .cr3 .nef .arw .dng</p>
      </section>
    </aside>
  );
}
