import { useEffect, useRef, useCallback } from "react";
import { useCanvasStore } from "../stores/canvasStore";
import { PointerEventHandler } from "@canvasos/core";
import type { StrokePoint } from "@canvasos/core";

const CANVAS_W = 2048;
const CANVAS_H = 2048;

export function CanvasViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const pointerRef = useRef<PointerEventHandler | null>(null);
  const isPainting = useRef(false);
  const zoom = useCanvasStore((s) => s.zoom);
  const panX = useCanvasStore((s) => s.panX);
  const panY = useCanvasStore((s) => s.panY);
  const setZoom = useCanvasStore((s) => s.setZoom);
  const setPan = useCanvasStore((s) => s.setPan);
  const activeModule = useCanvasStore((s) => s.activeModule);

  // Init 2D context with white fill
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, []);

  // Wire pointer → stroke drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handler = new PointerEventHandler(
      canvas,
      (points: StrokePoint[]) => {
        const ctx = ctxRef.current;
        if (!ctx || points.length < 2) return;
        const prev = points[points.length - 2]!;
        const curr = points[points.length - 1]!;
        isPainting.current = true;
        ctx.beginPath();
        ctx.moveTo(prev.x, prev.y);
        ctx.lineTo(curr.x, curr.y);
        ctx.strokeStyle = "#1a1a1a";
        ctx.lineWidth = Math.max(1, 20 * (curr.pressure || 0.5));
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.stroke();
      },
      (_smoothed: StrokePoint[]) => {
        isPainting.current = false;
      },
    );

    pointerRef.current = handler;
    return () => {
      handler.destroy();
      pointerRef.current = null;
    };
  }, []);

  // Wheel: zoom (Ctrl) or pan
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(Math.max(0.05, Math.min(32, zoom * factor)));
      } else {
        setPan(panX - e.deltaX, panY - e.deltaY);
      }
    },
    [zoom, panX, panY, setZoom, setPan],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [handleWheel]);

  const cursor = activeModule === "paint" || !activeModule ? "crosshair" : "default";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: "radial-gradient(circle at center, #1e1e2c 0%, #0d0d1a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gridColumn: "3",
        gridRow: "2",
      }}
    >
      {/* Dot-grid background */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 1,
        }}
      />
      <canvas
        ref={canvasRef}
        aria-label="Canvas workspace — draw here"
        style={{
          position: "relative",
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "center center",
          imageRendering: zoom > 1 ? "pixelated" : "auto",
          cursor,
          boxShadow: "0 8px 64px rgba(0,0,0,0.9), 0 0 0 1px rgba(255,255,255,0.06)",
          borderRadius: "1px",
          touchAction: "none",
        }}
        width={CANVAS_W}
        height={CANVAS_H}
      />
    </div>
  );
}
