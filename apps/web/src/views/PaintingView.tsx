import { useEffect, useRef, useState, useCallback } from "react";
import { BrushEngine, DEFAULT_PRESETS } from "@canvasos/paint";
import { PointerEventHandler } from "@canvasos/core";
import type { BrushPreset, StrokePoint } from "@canvasos/core";

const CANVAS_SIZE = 2048;

const COLOR_SWATCHES = [
  "#000000",
  "#1a1a2e",
  "#4a4a6a",
  "#8888aa",
  "#cccccc",
  "#ffffff",
  "#E94560",
  "#e05c2a",
  "#e8c840",
  "#4caf6a",
  "#2196f3",
  "#9c27b0",
];

export function PaintingView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const brushEngineRef = useRef<BrushEngine | null>(null);
  const handlerRef = useRef<PointerEventHandler | null>(null);

  const [activePreset, setActivePreset] = useState<BrushPreset>(DEFAULT_PRESETS[0]!);
  const [hexColor, setHexColor] = useState("#000000");
  const [hexInput, setHexInput] = useState("#000000");

  // Copy BrushEngine's offscreen pixel data onto the visible canvas
  const flushToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const engine = brushEngineRef.current;
    if (!canvas || !engine) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(engine.getImageData(), 0, 0);
  }, []);

  // Mount: init canvas white fill, BrushEngine, PointerEventHandler
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // White background
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    }

    const engine = new BrushEngine(CANVAS_SIZE, CANVAS_SIZE, activePreset);
    brushEngineRef.current = engine;

    // Seed the engine with the white background so strokes composite correctly
    if (ctx) {
      const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      // BrushEngine starts with a transparent offscreen canvas; we draw white on it
      // by using the engine's ctx directly — instead, we'll draw white via strokePoints
      // approach: just fill the offscreen via a no-op trick isn't available, so we
      // keep the white only on the visible canvas and let the engine accumulate strokes
      // on its transparent buffer, then composite on top.
      void imageData; // suppress lint
    }

    const onStroke = (points: StrokePoint[]) => {
      engine.strokePoints(points, hexColorRef.current).then(flushToCanvas);
    };

    const onStrokeEnd = (points: StrokePoint[]) => {
      engine.strokePoints(points, hexColorRef.current).then(flushToCanvas);
    };

    const handler = new PointerEventHandler(canvas, onStroke, onStrokeEnd);
    handlerRef.current = handler;

    return () => {
      handler.destroy();
      engine.destroy();
      brushEngineRef.current = null;
      handlerRef.current = null;
    };
  }, []);

  // Keep a ref for the current color so stroke callbacks always get the latest
  const hexColorRef = useRef(hexColor);
  useEffect(() => {
    hexColorRef.current = hexColor;
  }, [hexColor]);

  // When active preset changes, update the engine
  useEffect(() => {
    brushEngineRef.current?.setPreset(activePreset);
  }, [activePreset]);

  const handleSwatchClick = useCallback((color: string) => {
    setHexColor(color);
    setHexInput(color);
  }, []);

  const handleHexInputCommit = useCallback(() => {
    const trimmed = hexInput.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) {
      setHexColor(trimmed);
    } else {
      setHexInput(hexColor);
    }
  }, [hexColor, hexInput]);

  return (
    <main className="ml-16 mt-12 mb-12 h-[calc(100vh-6rem)] relative overflow-hidden bg-surface-container-lowest flex items-center justify-center">
      {/* Brush size corner indicator */}
      <div className="absolute top-4 left-4 z-30 pointer-events-none">
        <span className="font-['JetBrains_Mono'] text-[10px] text-[#E94560] uppercase tracking-widest opacity-70">
          {activePreset.name} · {activePreset.size}px
        </span>
      </div>

      {/* Real canvas element */}
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        style={{
          position: "relative",
          width: "85%",
          height: "90%",
          maxWidth: "1200px",
          objectFit: "contain",
          cursor: "crosshair",
          boxShadow: "0 8px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)",
          background: "#ffffff",
        }}
      />

      {/* LEFT: Brush Presets Panel */}
      <aside className="absolute left-4 top-1/2 -translate-y-1/2 glass-panel w-52 p-4 rounded-2xl flex flex-col gap-3 shadow-2xl border border-white/5 z-20">
        <label className="text-[10px] uppercase tracking-widest text-[#E94560] font-bold block">
          Brush Presets
        </label>
        <div className="flex flex-col gap-1">
          {DEFAULT_PRESETS.map((preset) => {
            const isActive = preset.id === activePreset.id;
            return (
              <button
                key={preset.id}
                onClick={() => setActivePreset(preset)}
                className={[
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all",
                  isActive
                    ? "bg-[rgba(233,69,96,0.15)] border border-[#E94560]/40"
                    : "hover:bg-white/5 border border-transparent",
                ].join(" ")}
              >
                {/* Brush type icon */}
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 border border-white/20 flex items-center justify-center"
                  style={{
                    background: isActive ? "rgba(233,69,96,0.2)" : "rgba(255,255,255,0.04)",
                  }}
                >
                  <div
                    className="rounded-full"
                    style={{
                      width: Math.min(20, Math.max(4, preset.size / 4)),
                      height: Math.min(20, Math.max(4, preset.size / 4)),
                      background: isActive ? "#E94560" : "rgba(255,255,255,0.4)",
                      filter: preset.hardness < 0.5 ? "blur(1.5px)" : "none",
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={[
                      "text-[11px] font-medium truncate",
                      isActive ? "text-[#E94560]" : "text-on-surface/70",
                    ].join(" ")}
                  >
                    {preset.name}
                  </div>
                  <div className="text-[9px] text-on-surface/30 font-['JetBrains_Mono']">
                    {preset.size}px · {Math.round(preset.opacity * 100)}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* RIGHT: Color Panel */}
      <aside className="absolute right-4 top-1/2 -translate-y-1/2 glass-panel w-56 p-4 rounded-2xl flex flex-col gap-4 shadow-2xl border border-white/5 z-20">
        <label className="text-[10px] uppercase tracking-widest text-[#E94560] font-bold block">
          Color
        </label>

        {/* Active color swatch + hex input */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg border border-white/20 shadow-lg flex-shrink-0"
            style={{ background: hexColor }}
          />
          <div className="flex-1 bg-surface-container-lowest rounded-lg px-3 py-2 border border-white/5">
            <input
              type="text"
              value={hexInput}
              onChange={(e) => setHexInput(e.target.value)}
              onBlur={handleHexInputCommit}
              onKeyDown={(e) => e.key === "Enter" && handleHexInputCommit()}
              className="w-full bg-transparent text-xs font-['JetBrains_Mono'] text-on-surface outline-none"
              maxLength={7}
              spellCheck={false}
            />
          </div>
        </div>

        {/* 12-color swatch grid */}
        <div className="grid grid-cols-6 gap-1.5">
          {COLOR_SWATCHES.map((color) => {
            const isSelected = color === hexColor;
            return (
              <button
                key={color}
                onClick={() => handleSwatchClick(color)}
                title={color}
                className={[
                  "w-full aspect-square rounded-sm transition-transform hover:scale-110",
                  isSelected ? "ring-2 ring-[#E94560] ring-offset-1 ring-offset-[#13131f]" : "",
                ].join(" ")}
                style={{
                  background: color,
                  border: color === "#ffffff" ? "1px solid rgba(255,255,255,0.15)" : "none",
                }}
              />
            );
          })}
        </div>

        {/* Opacity & size quick info */}
        <div className="space-y-3 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-['JetBrains_Mono'] text-on-surface/40">
              <span>SIZE</span>
              <span>{activePreset.size}px</span>
            </div>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, (activePreset.size / 120) * 100)}%`,
                  background: "#E94560",
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-[10px] font-['JetBrains_Mono'] text-on-surface/40">
              <span>OPACITY</span>
              <span>{Math.round(activePreset.opacity * 100)}%</span>
            </div>
            <div className="h-1 bg-surface-container-highest rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${activePreset.opacity * 100}%`,
                  background: "#E94560",
                }}
              />
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
