import { useCanvasStore } from "../stores/canvasStore";
import { useLayerStore } from "../stores/layerStore";

export function StatusBar() {
  const zoom = useCanvasStore((s) => s.zoom);
  const activeModule = useCanvasStore((s) => s.activeModule);
  const layerCount = useLayerStore((s) => s.layers.length);

  const MODULE_LABELS: Record<string, string> = {
    paint: "Paint",
    vector: "Vector",
    "sculpt-3d": "3D Sculpt",
    animate: "Animate",
    audio: "Audio",
    codeart: "Code",
    photo: "Photo",
    write: "Write",
    ai: "AI",
  };

  return (
    <footer
      role="status"
      aria-label="Status bar"
      style={{
        height: "48px",
        background: "rgba(5, 5, 15, 0.95)",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        gap: "0",
        userSelect: "none",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
      }}
    >
      {/* Left: transport-style controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        <StatusItem icon="zoom_in" label={`${Math.round(zoom * 100)}%`} active={false} />
        <StatusItem icon="speed" label="60 FPS" active={false} />
        <StatusItem icon="view_kanban" label="Timeline" active />
      </div>

      {/* Center: waveform strip (decorative) */}
      <div
        style={{
          flex: 1,
          margin: "0 24px",
          height: "20px",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.03)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: "2px",
        }}
      >
        {waveHeights.map((h, i) => (
          <div
            key={i}
            style={{
              width: "3px",
              height: `${h}px`,
              borderRadius: "2px",
              background:
                i === 8 || i === 9 || i === 10 ? "rgba(233,69,96,0.5)" : "rgba(255,255,255,0.12)",
              flexShrink: 0,
            }}
          />
        ))}
      </div>

      {/* Right: system stats */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {activeModule && (
          <span
            style={{
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.05em",
              textTransform: "uppercase" as const,
            }}
          >
            {MODULE_LABELS[activeModule] ?? activeModule}
          </span>
        )}
        <span style={{ color: "rgba(255,255,255,0.18)" }}>
          {layerCount} layer{layerCount !== 1 ? "s" : ""}
        </span>
        <span style={{ color: "rgba(255,255,255,0.15)", letterSpacing: "0.04em" }}>MEM 4.2GB</span>
        <span style={{ color: "rgba(0,212,255,0.5)", letterSpacing: "0.04em" }}>GPU 18%</span>
      </div>
    </footer>
  );
}

function StatusItem({ icon, label, active }: { icon: string; label: string; active: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        cursor: "pointer",
        color: active ? "var(--primary)" : "rgba(255,255,255,0.3)",
        transition: "color 0.15s",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "15px" }}>
        {icon}
      </span>
      <span style={{ letterSpacing: "0.06em", textTransform: "uppercase" as const }}>{label}</span>
    </div>
  );
}

// Decorative waveform heights
const waveHeights = [
  4, 8, 6, 10, 7, 12, 9, 6, 14, 16, 14, 8, 5, 9, 7, 11, 8, 5, 7, 10, 6, 8, 4, 9, 7, 5, 8, 6, 10, 7,
];
