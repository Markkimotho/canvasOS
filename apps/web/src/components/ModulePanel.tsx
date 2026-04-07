import { lazy, Suspense } from "react";
import { ErrorBoundary } from "./ErrorBoundary";
import { useCanvasStore } from "../stores/canvasStore";

const PaintPanel = lazy(() => import("@canvasos/paint").then((m) => ({ default: m.PaintPanel })));
const VectorPanel = lazy(() =>
  import("@canvasos/vector").then((m) => ({ default: m.VectorPanel })),
);
const AnimatePanel = lazy(() =>
  import("@canvasos/animate").then((m) => ({ default: m.AnimatePanel })),
);
const AudioPanel = lazy(() => import("@canvasos/audio").then((m) => ({ default: m.AudioPanel })));
const CodeArtPanel = lazy(() =>
  import("@canvasos/codeart").then((m) => ({ default: m.CodeArtPanel })),
);
const PhotoPanel = lazy(() => import("@canvasos/photo").then((m) => ({ default: m.PhotoPanel })));
const WritePanel = lazy(() => import("@canvasos/write").then((m) => ({ default: m.WritePanel })));
const AIPanel = lazy(() => import("@canvasos/ai").then((m) => ({ default: m.AIPanel })));
const Sculpt3DPanel = lazy(() =>
  import("@canvasos/sculpt-3d").then((m) => ({ default: m.Sculpt3DPanel })),
);

const PANELS: Record<string, React.ReactNode> = {
  paint: <PaintPanel />,
  vector: <VectorPanel />,
  "sculpt-3d": <Sculpt3DPanel />,
  animate: <AnimatePanel />,
  audio: <AudioPanel />,
  codeart: <CodeArtPanel />,
  photo: <PhotoPanel />,
  write: <WritePanel />,
  ai: <AIPanel />,
};

export function ModulePanel() {
  const activeModule = useCanvasStore((s) => s.activeModule);
  const panel = activeModule ? PANELS[activeModule] : null;

  return (
    <aside
      aria-label="Module tools panel"
      style={{
        background: "var(--surface-lowest)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      {/* Panel header */}
      {activeModule && (
        <div
          style={{
            height: "36px",
            padding: "0 14px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              color: "rgba(255,255,255,0.25)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.12em",
            }}
          >
            {activeModule === "sculpt-3d"
              ? "3D Sculpt"
              : activeModule === "codeart"
                ? "Code Art"
                : activeModule.charAt(0).toUpperCase() + activeModule.slice(1)}
          </span>
        </div>
      )}
      <ErrorBoundary>
        <Suspense
          fallback={
            <div style={{ padding: "20px 16px", color: "var(--txt-3)", fontSize: "12px" }}>
              Loading…
            </div>
          }
        >
          {panel ?? (
            <div style={{ padding: "20px 16px", color: "var(--txt-3)", fontSize: "12px" }}>
              Select a module from the left sidebar
            </div>
          )}
        </Suspense>
      </ErrorBoundary>
    </aside>
  );
}
