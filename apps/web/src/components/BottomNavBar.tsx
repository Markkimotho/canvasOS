import { useCanvasStore } from "../stores/canvasStore";

export function BottomNavBar() {
  const zoom = useCanvasStore((s) => s.zoom);

  return (
    <footer className="fixed bottom-0 w-full z-50 flex justify-between items-center px-8 h-12 bg-slate-950/95 border-t border-white/5">
      <div className="flex gap-8">
        <div className="flex items-center gap-2 text-[#E94560] cursor-pointer">
          <span className="material-symbols-outlined text-lg">zoom_in</span>
          <span className="font-['JetBrains_Mono'] text-xs">Zoom: {Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
          <span className="material-symbols-outlined text-lg">speed</span>
          <span className="font-['JetBrains_Mono'] text-xs">FPS: 60.0</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400 hover:text-slate-200 cursor-pointer transition-colors">
          <span className="material-symbols-outlined text-lg">view_kanban</span>
          <span className="font-['JetBrains_Mono'] text-xs">Timeline</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-mono opacity-40 uppercase tracking-[0.2em]">
        <span>CanvasOS // Active</span>
        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
      </div>
    </footer>
  );
}
