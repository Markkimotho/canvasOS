import { useCanvasStore } from "../stores/canvasStore";
import type { ModuleId } from "../stores/canvasStore";

const MODULES: { id: ModuleId; label: string; icon: string }[] = [
  { id: "paint", label: "Paint", icon: "brush" },
  { id: "ai", label: "AI Art", icon: "auto_awesome" },
  { id: "sculpt-3d", label: "3D", icon: "view_in_ar" },
  { id: "vector", label: "Vector", icon: "edit" },
  { id: "animate", label: "Motion", icon: "timeline" },
  { id: "audio", label: "Music", icon: "music_note" },
  { id: "codeart", label: "Code", icon: "code" },
  { id: "photo", label: "Photo", icon: "photo_camera" },
  { id: "write", label: "Write", icon: "edit_note" },
];

export function ModuleNav() {
  const activeModule = useCanvasStore((s) => s.activeModule);
  const setActiveModule = useCanvasStore((s) => s.setActiveModule);

  return (
    <nav
      aria-label="Module navigation"
      style={
        {
          width: "64px",
          height: "100%",
          background:
            "linear-gradient(to right, rgba(255,255,255,0.03) 0%, rgba(7,7,18,0.90) 100%)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: "8px",
          gap: "0",
          overflowY: "auto",
          overflowX: "hidden",
        } as React.CSSProperties
      }
    >
      {MODULES.map((m) => {
        const active = activeModule === m.id;
        return (
          <button
            key={m.id}
            aria-label={m.label}
            aria-pressed={active}
            title={m.label}
            onClick={() => setActiveModule(m.id)}
            style={{
              width: "100%",
              padding: "8px 0 6px",
              border: "none",
              background: active ? "rgba(255,255,255,0.04)" : "transparent",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
              position: "relative",
              color: active ? "var(--primary)" : "rgba(255,255,255,0.3)",
              transition: "color 0.2s, background 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.3)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            {/* Active left-edge indicator */}
            {active && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: "2px",
                  background: "var(--primary)",
                  boxShadow: "0 0 8px rgba(233,69,96,0.6)",
                  borderRadius: "0 2px 2px 0",
                }}
              />
            )}

            <span
              className="material-symbols-outlined"
              style={{
                fontSize: "20px",
                fontVariationSettings: active
                  ? "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 200, 'GRAD' 0, 'opsz' 24",
              }}
            >
              {m.icon}
            </span>

            <span
              style={{
                fontSize: "7px",
                fontFamily: "'Inter', sans-serif",
                fontWeight: active ? 700 : 500,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                lineHeight: 1,
              }}
            >
              {m.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
