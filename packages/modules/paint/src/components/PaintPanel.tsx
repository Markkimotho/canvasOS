import { useState, useCallback } from "react";
import type { BrushPreset } from "@canvasos/core";
import { BrushPresetManager, DEFAULT_PRESETS } from "../brush/BrushPresetManager.js";
import { ColorWheel } from "./ColorWheel.js";
import { BrushSizeSlider } from "./BrushSizeSlider.js";

const presetManager = new BrushPresetManager();

export function PaintPanel() {
  const [activePreset, setActivePreset] = useState<BrushPreset>(DEFAULT_PRESETS[0]!);
  const [color, setColor] = useState("#000000");
  const presets = presetManager.getAll();

  const handlePresetSelect = useCallback((preset: BrushPreset) => {
    setActivePreset(preset);
  }, []);

  return (
    <div
      aria-label="Paint module panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        padding: "8px",
        height: "100%",
        overflowY: "auto",
      }}
    >
      <ColorWheel color={color} onChange={setColor} />

      <div
        style={{
          borderTop: "1px solid #333",
          paddingTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            color: "#777",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Brushes
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          {presets.map((p) => (
            <button
              key={p.id}
              aria-pressed={activePreset.id === p.id}
              onClick={() => handlePresetSelect(p)}
              style={{
                padding: "5px 8px",
                borderRadius: "4px",
                border: "none",
                background: activePreset.id === p.id ? "rgba(99,102,241,0.2)" : "transparent",
                color: activePreset.id === p.id ? "#a5b4fc" : "#ccc",
                cursor: "pointer",
                fontSize: "12px",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>{p.name}</span>
              <span style={{ color: "#555", fontSize: "10px" }}>{p.size}px</span>
            </button>
          ))}
        </div>
      </div>

      <BrushSizeSlider
        value={activePreset.size}
        onChange={(size) => {
          setActivePreset({ ...activePreset, size });
          presetManager.update(activePreset.id, { size });
        }}
      />

      <div style={{ borderTop: "1px solid #333", paddingTop: "8px" }}>
        <span style={{ fontSize: "10px", color: "#777" }}>Opacity</span>
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(activePreset.opacity * 100)}
          onChange={(e) => {
            const opacity = Number(e.target.value) / 100;
            setActivePreset({ ...activePreset, opacity });
          }}
          aria-label="Brush opacity"
          style={{ width: "100%", accentColor: "#6366f1" }}
        />
        <span style={{ fontSize: "10px", color: "#555" }}>
          {Math.round(activePreset.opacity * 100)}%
        </span>
      </div>
    </div>
  );
}
