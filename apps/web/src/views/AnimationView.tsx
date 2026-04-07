import { useState, useCallback } from "react";
import { AnimatePanel } from "@canvasos/animate";
import type { FpsOption } from "@canvasos/animate";

export function AnimationView() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [fps, setFps] = useState<FpsOption>(24);

  const handleFrameChange = useCallback((frame: number) => {
    setCurrentFrame(frame);
  }, []);

  const handleFpsChange = useCallback((nextFps: FpsOption) => {
    setFps(nextFps);
  }, []);

  return (
    <main className="ml-16 mt-12 mb-12 h-[calc(100vh-6rem)] overflow-hidden bg-surface-dim flex flex-col">
      {/* Canvas area */}
      <div className="flex-1 bg-surface-container-lowest flex items-center justify-center relative">
        <div
          className="aspect-video max-h-full max-w-full bg-white"
          style={{ maxWidth: "70%", boxShadow: "0 8px 64px rgba(0,0,0,0.9)", borderRadius: "1px" }}
        >
          {/* Canvas placeholder - in production this would be the actual animation canvas */}
          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
            <span className="text-slate-600 font-mono text-xs uppercase tracking-widest">
              Animation Canvas
            </span>
          </div>
        </div>
      </div>
      {/* Timeline panel */}
      <div className="h-72 flex-shrink-0 bg-surface-container-lowest border-t border-white/5">
        <AnimatePanel
          duration={120}
          fps={fps}
          tracks={[]}
          currentFrame={currentFrame}
          onFrameChange={handleFrameChange}
          onFpsChange={handleFpsChange}
        />
      </div>
    </main>
  );
}
