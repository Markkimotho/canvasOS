import { useCanvasStore } from "../stores/canvasStore";
import type { Layer } from "@canvasos/core";
import { useLayerStore } from "../stores/layerStore";

export function LayerPanel() {
  const activeProjectId = useCanvasStore((s) => s.activeProjectId);
  const { layers, activeLayerId, addLayer, removeLayer, setActiveLayer, toggleLayerVisibility } =
    useLayerStore();

  if (!activeProjectId) return null;

  const LAYER_TYPE_ICON: Record<string, string> = {
    raster: "brush",
    vector: "edit",
    text: "text_fields",
    group: "folder",
    "3d": "view_in_ar",
    audio: "music_note",
    code: "code",
    photo: "photo_camera",
    ai: "auto_awesome",
  };

  return (
    <aside
      aria-label="Layer panel"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(var(--glass-blur))",
        WebkitBackdropFilter: "blur(var(--glass-blur))",
        borderLeft: "1px solid rgba(255,255,255,0.05)",
        borderTop: "1px solid var(--glass-top-border)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        gridColumn: "4",
        gridRow: "2",
      }}
    >
      {/* AI Generator section */}
      <section
        style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "12px",
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "var(--secondary)",
            }}
          >
            AI Generator
          </span>
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "14px", color: "var(--secondary)" }}
          >
            bolt
          </span>
        </div>

        {/* Prompt input */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            borderRadius: "8px",
            border: "1px solid rgba(0,212,255,0.1)",
            padding: "10px",
            marginBottom: "8px",
          }}
        >
          <textarea
            placeholder="Describe your vision..."
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none" as const,
              color: "var(--on-surface)",
              fontSize: "11px",
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
              height: "56px",
            }}
          />
          {/* Style chips */}
          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" as const, marginTop: "6px" }}>
            {["Cyberpunk", "Oil Paint", "Hyperreal"].map((tag, i) => (
              <span
                key={tag}
                style={{
                  padding: "2px 8px",
                  borderRadius: "4px",
                  background: i === 0 ? "rgba(0,212,255,0.1)" : "rgba(255,255,255,0.04)",
                  border: `1px solid ${i === 0 ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.08)"}`,
                  fontSize: "8px",
                  fontFamily: "'JetBrains Mono', monospace",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase" as const,
                  color: i === 0 ? "var(--secondary)" : "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Model picker */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px" }}>
          {["DALL-E 3", "SDXL", "FLUX.1"].map((model, i) => (
            <button
              key={model}
              style={{
                padding: "6px 4px",
                borderRadius: "4px",
                border: "1px solid rgba(255,255,255,0.06)",
                background: i === 0 ? "var(--secondary)" : "rgba(255,255,255,0.04)",
                color: i === 0 ? "#003642" : "rgba(255,255,255,0.4)",
                fontSize: "9px",
                fontFamily: "'JetBrains Mono', monospace",
                fontWeight: i === 0 ? 700 : 400,
                cursor: "pointer",
                transition: "border-color 0.15s",
              }}
            >
              {model}
            </button>
          ))}
        </div>
      </section>

      {/* Layers section */}
      <div style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            padding: "10px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "10px",
              fontWeight: 700,
              letterSpacing: "0.15em",
              textTransform: "uppercase" as const,
              color: "rgba(255,255,255,0.3)",
            }}
          >
            Layers
          </span>
          <div style={{ display: "flex", gap: "4px" }}>
            <IconActionBtn icon="add" label="Add layer" onClick={() => addLayer("raster")} />
            <IconActionBtn
              icon="folder"
              label="Add group"
              onClick={() => addLayer("group" as any)}
            />
          </div>
        </div>

        {/* Layer list */}
        <div
          role="list"
          aria-label="Layers"
          style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}
        >
          {layers
            .slice()
            .reverse()
            .map((layer) => (
              <LayerItem
                key={layer.id}
                layer={layer}
                isActive={layer.id === activeLayerId}
                icon={LAYER_TYPE_ICON[layer.type] ?? "layers"}
                onSelect={() => setActiveLayer(layer.id)}
                onToggleVisibility={() => toggleLayerVisibility(layer.id)}
                onDelete={() => removeLayer(layer.id)}
              />
            ))}
          {layers.length === 0 && (
            <div style={{ padding: "20px 8px", textAlign: "center" as const }}>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: "11px",
                  marginBottom: "10px",
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                No layers yet
              </p>
              <button
                onClick={() => addLayer("raster")}
                style={{
                  padding: "6px 14px",
                  borderRadius: "6px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.35)",
                  cursor: "pointer",
                  fontSize: "11px",
                }}
              >
                + Add layer
              </button>
            </div>
          )}
        </div>
      </div>

      {/* System analytics footer */}
      <section
        style={{
          padding: "12px 16px",
          background: "var(--surface-lowest)",
          borderTop: "1px solid rgba(255,255,255,0.04)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            letterSpacing: "0.1em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.2)",
            display: "block",
            marginBottom: "8px",
          }}
        >
          System Analytics
        </span>
        <StatRow label="GPU Compute" value="62%" color="var(--secondary)" percent={62} />
        <StatRow label="Memory" value="4.8GB / 16GB" color="rgba(255,255,255,0.3)" percent={30} />
      </section>
    </aside>
  );
}

function IconActionBtn({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        color: "rgba(255,255,255,0.3)",
        display: "flex",
        alignItems: "center",
        padding: "2px",
        borderRadius: "4px",
        transition: "color 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
        {icon}
      </span>
    </button>
  );
}

function StatRow({
  label,
  value,
  color,
  percent,
}: {
  label: string;
  value: string;
  color: string;
  percent: number;
}) {
  return (
    <div style={{ marginBottom: "8px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "rgba(255,255,255,0.25)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            color: "var(--on-surface)",
          }}
        >
          {value}
        </span>
      </div>
      <div style={{ height: "2px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
        <div
          style={{
            height: "100%",
            width: `${percent}%`,
            background: color,
            borderRadius: "2px",
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  );
}

function LayerItem({
  layer,
  isActive,
  icon,
  onSelect,
  onToggleVisibility,
  onDelete,
}: {
  layer: Layer;
  isActive: boolean;
  icon: string;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      role="listitem"
      aria-selected={isActive}
      onClick={onSelect}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "6px 8px",
        borderRadius: "6px",
        cursor: "pointer",
        marginBottom: "2px",
        background: isActive ? "rgba(233,69,96,0.1)" : "transparent",
        border: `1px solid ${isActive ? "rgba(233,69,96,0.2)" : "transparent"}`,
        transition: "background 0.15s, border-color 0.15s",
        position: "relative",
      }}
      onMouseEnter={(e) => {
        if (!isActive)
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Visibility */}
      <button
        aria-label={layer.visible ? "Hide layer" : "Show layer"}
        onClick={(e) => {
          e.stopPropagation();
          onToggleVisibility();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: layer.visible ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.12)",
          display: "flex",
          alignItems: "center",
          padding: 0,
          transition: "color 0.1s",
          flexShrink: 0,
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
          {layer.visible ? "visibility" : "visibility_off"}
        </span>
      </button>

      {/* Type icon */}
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "4px",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.06)",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          className="material-symbols-outlined"
          style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}
        >
          {icon}
        </span>
      </div>

      {/* Name */}
      <span
        style={{
          flex: 1,
          fontSize: "11px",
          fontFamily: "'Inter', sans-serif",
          color: isActive ? "var(--on-surface)" : "rgba(255,255,255,0.45)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap" as const,
          fontWeight: isActive ? 500 : 400,
        }}
      >
        {layer.name}
      </span>
      {isActive && (
        <span
          style={{
            fontSize: "8px",
            fontFamily: "'Inter', sans-serif",
            color: "var(--primary)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
            flexShrink: 0,
          }}
        >
          Active
        </span>
      )}

      {/* Delete */}
      <button
        aria-label={`Delete ${layer.name}`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: "rgba(255,255,255,0.12)",
          fontSize: "14px",
          padding: 0,
          lineHeight: 1,
          opacity: 0,
          transition: "opacity 0.1s",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "1";
          (e.currentTarget as HTMLButtonElement).style.color = "var(--red)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.opacity = "0";
        }}
      >
        ×
      </button>
    </div>
  );
}
