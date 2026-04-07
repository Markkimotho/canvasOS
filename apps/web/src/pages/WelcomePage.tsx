import { useNavigate } from "react-router-dom";
import { useCanvasStore } from "../stores/canvasStore";

const TEMPLATES = [
  { label: "Blank Canvas", desc: "1920 × 1080", w: 1920, h: 1080, ratio: "16:9" },
  { label: "Square", desc: "1024 × 1024", w: 1024, h: 1024, ratio: "1:1" },
  { label: "Portrait", desc: "1080 × 1920", w: 1080, h: 1920, ratio: "9:16" },
];

const RECENT_MEDIUMS = [
  { label: "Paint", icon: "brush", color: "var(--primary)" },
  { label: "3D", icon: "view_in_ar", color: "#7B2FBE" },
  { label: "AI Art", icon: "auto_awesome", color: "var(--secondary)" },
  { label: "Vector", icon: "edit", color: "#F59E0B" },
];

export function WelcomePage() {
  const navigate = useNavigate();
  const createProject = useCanvasStore((s) => s.createProject);

  const handleNew = (_width = 1920, _height = 1080) => {
    const id = createProject("Untitled");
    navigate(`/workspace/${id}`);
  };

  return (
    <main
      style={{
        height: "100%",
        background: "var(--surface-dim)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Top bar */}
      <header
        style={{
          height: "48px",
          background: "rgba(7, 7, 18, 0.85)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: "18px",
            letterSpacing: "-0.5px",
            color: "#f8f8fc",
          }}
        >
          CanvasOS
        </span>
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "9px",
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.2)",
          }}
        >
          v1.0 — Singularity Interface
        </span>
      </header>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: "flex",
          overflow: "hidden",
        }}
      >
        {/* Left: branding / hero */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "60px 64px",
            background:
              "radial-gradient(circle at 30% 60%, rgba(123,47,190,0.08) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(233,69,96,0.06) 0%, transparent 50%)",
          }}
        >
          {/* Tag line */}
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.3em",
              textTransform: "uppercase" as const,
              color: "var(--secondary)",
              display: "block",
              marginBottom: "16px",
            }}
          >
            Medium: All Mediums
          </span>

          {/* Hero headline */}
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "80px",
              fontWeight: 800,
              letterSpacing: "-2px",
              lineHeight: 0.85,
              color: "#ffffff",
              margin: "0 0 24px",
            }}
          >
            CANVAS
            <br />
            <span style={{ color: "var(--primary-container)" }}>OS</span>
          </h1>

          <p
            style={{
              fontSize: "13px",
              color: "rgba(255,255,255,0.35)",
              maxWidth: "360px",
              lineHeight: 1.7,
              margin: "0 0 48px",
            }}
          >
            One surface, infinite mediums. Paint, sculpt, animate, generate — all in a single
            unified workspace.
          </p>

          {/* Medium pills */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" as const }}>
            {RECENT_MEDIUMS.map((m) => (
              <button
                key={m.label}
                onClick={() => handleNew()}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 14px",
                  borderRadius: "99px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: 500,
                  transition: "border-color 0.2s, color 0.2s, background 0.2s",
                }}
                onMouseEnter={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = m.color;
                  b.style.color = m.color;
                  b.style.background = `rgba(${hexToRgb(m.color)}, 0.08)`;
                }}
                onMouseLeave={(e) => {
                  const b = e.currentTarget as HTMLButtonElement;
                  b.style.borderColor = "rgba(255,255,255,0.08)";
                  b.style.color = "rgba(255,255,255,0.6)";
                  b.style.background = "rgba(255,255,255,0.04)";
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                  {m.icon}
                </span>
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: new project panel */}
        <div
          style={{
            width: "360px",
            flexShrink: 0,
            background: "var(--glass-bg)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255,255,255,0.05)",
            borderTop: "1px solid var(--glass-top-border)",
            display: "flex",
            flexDirection: "column",
            padding: "32px 24px",
            gap: "24px",
            overflowY: "auto",
          }}
        >
          <div>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: "10px",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.25)",
                margin: "0 0 12px",
              }}
            >
              New Project
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {TEMPLATES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => handleNew(t.w, t.h)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "12px 14px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "border-color 0.15s, background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "var(--primary)";
                    b.style.background = "rgba(233,69,96,0.08)";
                    b.style.color = "rgba(255,255,255,0.9)";
                  }}
                  onMouseLeave={(e) => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.borderColor = "rgba(255,255,255,0.06)";
                    b.style.background = "rgba(255,255,255,0.03)";
                    b.style.color = "rgba(255,255,255,0.6)";
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "4px",
                      background: "rgba(255,255,255,0.05)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        background: "rgba(255,255,255,0.25)",
                        borderRadius: "2px",
                        width: t.w > t.h ? "20px" : t.w < t.h ? "12px" : "16px",
                        height: t.w > t.h ? "12px" : t.w < t.h ? "20px" : "16px",
                      }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 500, marginBottom: "2px" }}>
                      {t.label}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        fontFamily: "'JetBrains Mono', monospace",
                        color: "rgba(255,255,255,0.25)",
                      }}
                    >
                      {t.desc}
                    </div>
                  </div>
                  <div style={{ marginLeft: "auto" }}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: "14px", color: "rgba(255,255,255,0.2)" }}
                    >
                      chevron_right
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Open file */}
          <label
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "12px",
              borderRadius: "8px",
              background: "transparent",
              border: "1px dashed rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.25)",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 500,
              transition: "border-color 0.15s, color 0.15s",
            }}
            onMouseEnter={(e) => {
              const l = e.currentTarget as HTMLLabelElement;
              l.style.borderColor = "rgba(255,255,255,0.25)";
              l.style.color = "rgba(255,255,255,0.6)";
            }}
            onMouseLeave={(e) => {
              const l = e.currentTarget as HTMLLabelElement;
              l.style.borderColor = "rgba(255,255,255,0.1)";
              l.style.color = "rgba(255,255,255,0.25)";
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
              upload_file
            </span>
            Open .cvos file
            <input
              type="file"
              accept=".cvos"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) console.debug("Open file:", file.name);
              }}
            />
          </label>

          {/* Version info */}
          <div
            style={{
              background: "var(--surface-lowest)",
              borderRadius: "8px",
              padding: "12px",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "8px",
                letterSpacing: "0.1em",
                textTransform: "uppercase" as const,
                color: "rgba(255,255,255,0.18)",
                display: "block",
                marginBottom: "8px",
              }}
            >
              System Status
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { label: "Engine", value: "v1.0.0", ok: true },
                { label: "GPU", value: "WebGL 2.0", ok: true },
                { label: "Canvas API", value: "Stable", ok: true },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      color: "rgba(255,255,255,0.2)",
                    }}
                  >
                    {s.label}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      color: s.ok ? "#4ade80" : "#f87171",
                    }}
                  >
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

// Rough helper to get RGB from a CSS variable-like color
function hexToRgb(color: string): string {
  const map: Record<string, string> = {
    "var(--primary)": "233,69,96",
    "var(--secondary)": "0,212,255",
    "#7B2FBE": "123,47,190",
    "#F59E0B": "245,158,11",
    "var(--primary-container)": "252,83,109",
  };
  return map[color] ?? "255,255,255";
}
