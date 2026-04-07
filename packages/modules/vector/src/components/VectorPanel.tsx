import { useState, useCallback } from "react";
import type { BooleanOpType } from "../BooleanOps.js";
import type { PenMode } from "../PenTool.js";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type VectorTool = "pen" | "node" | "rectangle" | "ellipse" | "polygon" | "star" | "text";

interface StrokeState {
  color: string;
  width: number;
}

interface FillState {
  color: string;
  enabled: boolean;
}

interface VectorPanelProps {
  onToolChange?: (tool: VectorTool) => void;
  onPenModeChange?: (mode: PenMode) => void;
  onStrokeChange?: (stroke: StrokeState) => void;
  onFillChange?: (fill: FillState) => void;
  onBooleanOp?: (op: BooleanOpType) => void;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionLabel({ children }: { children: string }) {
  return (
    <span
      style={{
        fontSize: "10px",
        color: "#777",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </span>
  );
}

interface ToolButtonProps {
  id: VectorTool;
  label: string;
  active: boolean;
  onClick: (id: VectorTool) => void;
}

function ToolButton({ id, label, active, onClick }: ToolButtonProps) {
  return (
    <button
      aria-label={`${label} tool`}
      aria-pressed={active}
      onClick={() => onClick(id)}
      style={{
        padding: "5px 8px",
        borderRadius: "4px",
        border: "none",
        background: active ? "rgba(99,102,241,0.2)" : "transparent",
        color: active ? "#a5b4fc" : "#ccc",
        cursor: "pointer",
        fontSize: "12px",
        textAlign: "left",
        flex: "1 1 auto",
        minWidth: "60px",
      }}
    >
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function VectorPanel({
  onToolChange,
  onPenModeChange,
  onStrokeChange,
  onFillChange,
  onBooleanOp,
}: VectorPanelProps) {
  const [activeTool, setActiveTool] = useState<VectorTool>("pen");
  const [stroke, setStroke] = useState<StrokeState>({ color: "#000000", width: 1 });
  const [fill, setFill] = useState<FillState>({ color: "#ffffff", enabled: false });

  // -------------------------------------------------------------------------
  // Tool switcher
  // -------------------------------------------------------------------------

  const handleToolClick = useCallback(
    (tool: VectorTool) => {
      setActiveTool(tool);
      onToolChange?.(tool);

      if (tool === "pen") {
        onPenModeChange?.("pen");
      } else if (tool === "node") {
        onPenModeChange?.("node");
      }
    },
    [onToolChange, onPenModeChange],
  );

  // -------------------------------------------------------------------------
  // Stroke
  // -------------------------------------------------------------------------

  const handleStrokeColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updated = { ...stroke, color: e.target.value };
      setStroke(updated);
      onStrokeChange?.(updated);
    },
    [stroke, onStrokeChange],
  );

  const handleStrokeWidthChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updated = { ...stroke, width: Number(e.target.value) };
      setStroke(updated);
      onStrokeChange?.(updated);
    },
    [stroke, onStrokeChange],
  );

  // -------------------------------------------------------------------------
  // Fill
  // -------------------------------------------------------------------------

  const handleFillToggle = useCallback(() => {
    const updated = { ...fill, enabled: !fill.enabled };
    setFill(updated);
    onFillChange?.(updated);
  }, [fill, onFillChange]);

  const handleFillColorChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const updated = { ...fill, color: e.target.value };
      setFill(updated);
      onFillChange?.(updated);
    },
    [fill, onFillChange],
  );

  // -------------------------------------------------------------------------
  // Boolean ops
  // -------------------------------------------------------------------------

  const booleanOps: { op: BooleanOpType; label: string }[] = [
    { op: "union", label: "Union" },
    { op: "subtract", label: "Subtract" },
    { op: "intersect", label: "Intersect" },
    { op: "exclude", label: "Exclude" },
    { op: "divide", label: "Divide" },
  ];

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const tools: { id: VectorTool; label: string }[] = [
    { id: "pen", label: "Pen" },
    { id: "node", label: "Node" },
    { id: "rectangle", label: "Rect" },
    { id: "ellipse", label: "Ellipse" },
    { id: "polygon", label: "Polygon" },
    { id: "star", label: "Star" },
    { id: "text", label: "Text" },
  ];

  return (
    <div
      role="region"
      aria-label="Vector module panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        padding: "8px",
        height: "100%",
        overflowY: "auto",
        userSelect: "none",
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Tool switcher                                                        */}
      {/* ------------------------------------------------------------------ */}
      <section aria-label="Vector tools">
        <SectionLabel>Tools</SectionLabel>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "2px",
            marginTop: "6px",
          }}
        >
          {tools.map(({ id, label }) => (
            <ToolButton
              key={id}
              id={id}
              label={label}
              active={activeTool === id}
              onClick={handleToolClick}
            />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Stroke                                                               */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Stroke settings"
        style={{
          borderTop: "1px solid #333",
          paddingTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SectionLabel>Stroke</SectionLabel>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="stroke-color" style={{ fontSize: "12px", color: "#ccc", flexShrink: 0 }}>
            Color
          </label>
          <input
            id="stroke-color"
            type="color"
            aria-label="Stroke color"
            value={stroke.color}
            onChange={handleStrokeColorChange}
            style={{
              width: "36px",
              height: "24px",
              padding: "0",
              border: "none",
              cursor: "pointer",
              background: "transparent",
            }}
          />
          <span style={{ fontSize: "11px", color: "#888", flex: 1 }}>{stroke.color}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="stroke-width" style={{ fontSize: "12px", color: "#ccc", flexShrink: 0 }}>
            Width
          </label>
          <input
            id="stroke-width"
            type="range"
            aria-label="Stroke width"
            min={0}
            max={32}
            step={0.5}
            value={stroke.width}
            onChange={handleStrokeWidthChange}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: "11px", color: "#888", minWidth: "28px", textAlign: "right" }}>
            {stroke.width}px
          </span>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Fill                                                                 */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Fill settings"
        style={{
          borderTop: "1px solid #333",
          paddingTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SectionLabel>Fill</SectionLabel>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <label htmlFor="fill-toggle" style={{ fontSize: "12px", color: "#ccc" }}>
            Enabled
          </label>
          <input
            id="fill-toggle"
            type="checkbox"
            role="switch"
            aria-label="Enable fill"
            checked={fill.enabled}
            onChange={handleFillToggle}
            style={{ cursor: "pointer" }}
          />
        </div>

        {fill.enabled && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <label htmlFor="fill-color" style={{ fontSize: "12px", color: "#ccc", flexShrink: 0 }}>
              Color
            </label>
            <input
              id="fill-color"
              type="color"
              aria-label="Fill color"
              value={fill.color}
              onChange={handleFillColorChange}
              style={{
                width: "36px",
                height: "24px",
                padding: "0",
                border: "none",
                cursor: "pointer",
                background: "transparent",
              }}
            />
            <span style={{ fontSize: "11px", color: "#888", flex: 1 }}>{fill.color}</span>
          </div>
        )}
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* Boolean operations                                                   */}
      {/* ------------------------------------------------------------------ */}
      <section
        aria-label="Boolean operations"
        style={{
          borderTop: "1px solid #333",
          paddingTop: "8px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
      >
        <SectionLabel>Boolean Ops</SectionLabel>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "4px" }}>
          {booleanOps.map(({ op, label }) => (
            <button
              key={op}
              aria-label={`Boolean ${label}`}
              onClick={() => onBooleanOp?.(op)}
              style={{
                padding: "4px 8px",
                borderRadius: "4px",
                border: "1px solid #444",
                background: "transparent",
                color: "#ccc",
                cursor: "pointer",
                fontSize: "11px",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
