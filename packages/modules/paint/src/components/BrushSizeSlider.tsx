interface Props {
  value: number;
  onChange: (size: number) => void;
  min?: number;
  max?: number;
}

export function BrushSizeSlider({ value, onChange, min = 1, max = 500 }: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "10px", color: "#777" }}>Size</span>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
          aria-label="Brush size in pixels"
          style={{
            width: "44px",
            background: "#2a2a2a",
            border: "1px solid #444",
            borderRadius: "3px",
            color: "#f0f0f0",
            padding: "2px 4px",
            fontSize: "11px",
            textAlign: "right",
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={`Brush size: ${value}px`}
        style={{ width: "100%", accentColor: "#6366f1" }}
      />
      {/* Visual preview */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "32px",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            borderRadius: "50%",
            background: "#f0f0f0",
            width: `${Math.min(value, 28)}px`,
            height: `${Math.min(value, 28)}px`,
          }}
        />
      </div>
    </div>
  );
}
