import { useState, useCallback } from "react";
import { CodeArtPanel } from "@canvasos/codeart";

export function CodeArtView() {
  const [outputUrl, setOutputUrl] = useState<string | null>(null);

  const handleOutput = useCallback((imageData: ImageData) => {
    const canvas = document.createElement("canvas");
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    canvas.getContext("2d")!.putImageData(imageData, 0, 0);
    setOutputUrl(canvas.toDataURL());
  }, []);

  return (
    <main className="ml-16 mt-12 mb-12 h-[calc(100vh-6rem)] w-[calc(100vw-4rem)] flex overflow-hidden">
      {/* Left: Code editor */}
      <div className="w-1/2 h-full flex flex-col bg-surface-container-lowest border-r border-white/5">
        <CodeArtPanel width={600} height={600} onOutputChange={handleOutput} />
      </div>
      {/* Right: Live canvas output */}
      <div className="w-1/2 h-full relative bg-surface-dim flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(233,69,96,0.05)_0%,transparent_70%)]" />
        {outputUrl ? (
          <img
            src={outputUrl}
            alt="Generative art output"
            className="max-w-full max-h-full object-contain"
            style={{ imageRendering: "pixelated" }}
          />
        ) : (
          <div className="text-center text-slate-600">
            <span className="material-symbols-outlined text-6xl mb-4 block opacity-30">code</span>
            <p className="font-['JetBrains_Mono'] text-xs uppercase tracking-widest opacity-40">
              Run sketch to see output
            </p>
          </div>
        )}
        {/* HUD overlays */}
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2">
          <div className="px-3 py-1 glass-panel rounded-lg border border-white/5 text-[10px] font-mono text-secondary">
            RENDER: WEBGL / P5JS
          </div>
        </div>
      </div>
    </main>
  );
}
