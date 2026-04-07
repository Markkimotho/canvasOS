import { useCanvasStore } from "../stores/canvasStore";
import { useToast } from "./ToastProvider";
import { FileFormatManager } from "@canvasos/core";

const MODULE_LABELS: Record<string, string> = {
  paint: "Paint",
  vector: "Vector",
  "sculpt-3d": "3D Sculpt",
  animate: "Animate",
  audio: "Audio",
  codeart: "Code Art",
  photo: "Photo",
  write: "Write",
  ai: "AI Generate",
};

export function Toolbar() {
  const { showToast } = useToast();
  const zoom = useCanvasStore((s) => s.zoom);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const activeModule = useCanvasStore((s) => s.activeModule);

  const handleSave = async () => {
    const store = useCanvasStore.getState();
    const project = store.activeProjectId ? store.projects[store.activeProjectId] : null;
    if (!project) return;
    try {
      const blob = await FileFormatManager.save(project);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.metadata.name}.cvos`;
      a.click();
      URL.revokeObjectURL(url);
      showToast("Project saved", "success");
    } catch {
      showToast("Save failed", "error");
    }
  };

  return (
    <header
      role="banner"
      style={{
        height: "48px",
        background: "rgba(7, 7, 18, 0.85)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        padding: "0 20px",
        gap: "0",
        userSelect: "none",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Logo */}
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "-0.5px",
          color: "#f8f8fc",
          marginRight: "12px",
          flexShrink: 0,
        }}
      >
        CanvasOS
      </span>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "16px",
          background: "rgba(255,255,255,0.1)",
          marginRight: "16px",
        }}
      />

      {/* Nav items */}
      <nav style={{ display: "flex", alignItems: "center", gap: "2px" }}>
        {(["Workspace", "Assets", "Market"] as const).map((item) => {
          const isActive = item === "Workspace";
          return (
            <button
              key={item}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: isActive ? 700 : 500,
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: isActive ? "var(--primary)" : "rgba(255,255,255,0.35)",
                transition: "color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
                  (e.currentTarget as HTMLButtonElement).style.background = "none";
                }
              }}
            >
              {item}
            </button>
          );
        })}
      </nav>

      {/* Active module chip */}
      {activeModule && (
        <>
          <div
            style={{
              width: "1px",
              height: "16px",
              background: "rgba(255,255,255,0.08)",
              margin: "0 12px",
            }}
          />
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', monospace",
              color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.06em",
              textTransform: "uppercase" as const,
            }}
          >
            {MODULE_LABELS[activeModule] ?? activeModule}
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {/* Right side */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* Zoom */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "rgba(255,255,255,0.04)",
            borderRadius: "6px",
            border: "1px solid rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}
        >
          <button
            aria-label="Zoom out"
            onClick={() => setZoom(Math.max(0.1, zoom / 1.25))}
            style={zoomBtnStyle}
          >
            −
          </button>
          <button
            aria-label="Reset zoom"
            onClick={() => setZoom(1)}
            style={{
              ...zoomBtnStyle,
              minWidth: "46px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "rgba(255,255,255,0.5)",
            }}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            aria-label="Zoom in"
            onClick={() => setZoom(Math.min(32, zoom * 1.25))}
            style={zoomBtnStyle}
          >
            +
          </button>
        </div>

        {/* Icon row */}
        <IconBtn label="Collaborators" icon="group" />
        <IconBtn label="Cloud sync" icon="cloud_done" />

        {/* Export */}
        <button
          aria-label="Export project"
          onClick={handleSave}
          style={{
            padding: "0 18px",
            height: "30px",
            borderRadius: "99px",
            background: "var(--primary-container)",
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.04em",
            transform: "scale(0.96)",
            transition: "filter 0.15s, transform 0.1s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1.15)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.filter = "brightness(1)";
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.96)";
          }}
        >
          Export
        </button>
      </div>
    </header>
  );
}

function IconBtn({ label, icon }: { label: string; icon: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "4px",
        borderRadius: "6px",
        color: "rgba(255,255,255,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "color 0.15s, background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.85)";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.35)";
        (e.currentTarget as HTMLButtonElement).style.background = "none";
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>
        {icon}
      </span>
    </button>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "rgba(255,255,255,0.35)",
  cursor: "pointer",
  padding: "0 8px",
  height: "28px",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
