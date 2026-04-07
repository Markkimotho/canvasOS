import { useCanvasStore } from "../stores/canvasStore";
import { useLayerStore } from "../stores/layerStore";

export function DebugPanel() {
  const canvasState = useCanvasStore.getState();
  const layerState = useLayerStore.getState();

  return (
    <div
      role="complementary"
      aria-label="Debug panel"
      style={{
        position: "fixed",
        top: "48px",
        right: "300px",
        width: "360px",
        maxHeight: "60vh",
        overflowY: "auto",
        background: "rgba(0,0,0,0.92)",
        border: "1px solid #444",
        borderRadius: "8px",
        padding: "16px",
        zIndex: 1000,
        fontFamily: "monospace",
        fontSize: "11px",
        color: "#0f0",
      }}
    >
      <h3 style={{ margin: "0 0 8px", color: "#6366f1", fontSize: "12px" }}>
        CanvasOS Debug Panel <kbd style={{ color: "#555" }}>⌘⇧D</kbd>
      </h3>
      <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
        {JSON.stringify(
          {
            activeModule: canvasState.activeModule,
            zoom: canvasState.zoom,
            pan: { x: canvasState.panX, y: canvasState.panY },
            layerCount: layerState.layers.length,
            activeLayerId: layerState.activeLayerId,
          },
          null,
          2,
        )}
      </pre>
    </div>
  );
}
