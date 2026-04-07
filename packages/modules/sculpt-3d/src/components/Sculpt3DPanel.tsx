import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { SculptScene } from "../SculptScene.js";

type SculptTool = "pull" | "push" | "smooth" | "flatten";

export function Sculpt3DPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SculptScene | null>(null);
  const [activeTool, setActiveTool] = useState<SculptTool>("pull");
  const [brushRadius, setBrushRadius] = useState(0.3);
  const [brushIntensity, setBrushIntensity] = useState(0.02);
  const [wireframe, setWireframe] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const scene = new SculptScene(canvas);
    sceneRef.current = scene;
    scene.start();

    const resizeObserver = new ResizeObserver(() => {
      const { width, height } = canvas.getBoundingClientRect();
      scene.resize(width, height);
    });
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
      scene.destroy();
    };
  }, []);

  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons !== 1) return;
    const scene = sceneRef.current;
    if (!scene) return;

    // Simplified: use pointer position to create a world-space hit point
    // In production this would use a raycaster
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const hitPoint = new THREE.Vector3(x, y, 0);
    const intensity = activeTool === "push" ? -brushIntensity : brushIntensity;
    scene.sculpt(hitPoint, brushRadius, intensity);
  };

  const tools: { id: SculptTool; label: string }[] = [
    { id: "pull", label: "Pull" },
    { id: "push", label: "Push" },
    { id: "smooth", label: "Smooth" },
    { id: "flatten", label: "Flatten" },
  ];

  return (
    <div
      aria-label="3D sculpting panel"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: "8px",
        padding: "8px",
      }}
    >
      {/* Tool selector */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {tools.map((t) => (
          <button
            key={t.id}
            aria-pressed={activeTool === t.id}
            onClick={() => setActiveTool(t.id)}
            style={{
              padding: "5px",
              borderRadius: "4px",
              border: "none",
              background: activeTool === t.id ? "#6366f1" : "#2a2a2a",
              color: activeTool === t.id ? "#fff" : "#ccc",
              cursor: "pointer",
              fontSize: "11px",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Brush controls */}
      <div style={{ fontSize: "11px", color: "#777" }}>
        <label>
          Radius: {brushRadius.toFixed(2)}
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.01}
            value={brushRadius}
            onChange={(e) => setBrushRadius(Number(e.target.value))}
            aria-label="Brush radius"
            style={{ width: "100%", accentColor: "#6366f1" }}
          />
        </label>
        <label>
          Intensity: {brushIntensity.toFixed(3)}
          <input
            type="range"
            min={0.001}
            max={0.1}
            step={0.001}
            value={brushIntensity}
            onChange={(e) => setBrushIntensity(Number(e.target.value))}
            aria-label="Brush intensity"
            style={{ width: "100%", accentColor: "#6366f1" }}
          />
        </label>
      </div>

      {/* Wireframe toggle */}
      <label
        style={{
          fontSize: "11px",
          color: "#aaa",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <input
          type="checkbox"
          checked={wireframe}
          onChange={(e) => setWireframe(e.target.checked)}
          aria-label="Toggle wireframe"
        />
        Wireframe
      </label>

      {/* Mesh presets */}
      <div style={{ display: "flex", gap: "4px" }}>
        {["Sphere", "Cube", "Torus"].map((name) => (
          <button
            key={name}
            onClick={() => sceneRef.current?.loadSphere()}
            style={{
              flex: 1,
              padding: "4px",
              background: "#2a2a2a",
              border: "1px solid #444",
              borderRadius: "3px",
              color: "#ccc",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* 3D Canvas */}
      <canvas
        ref={canvasRef}
        aria-label="3D sculpting canvas"
        style={{ flex: 1, borderRadius: "4px", cursor: "crosshair", minHeight: "200px" }}
        onPointerMove={handleCanvasPointer}
      />
    </div>
  );
}
