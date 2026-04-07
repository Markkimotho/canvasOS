import { useCanvasStore } from "../stores/canvasStore";

const MODULE_LABELS: Record<string, string> = {
  paint: "Paint",
  ai: "AI Art",
  "sculpt-3d": "3D Sculpt",
  vector: "Vector",
  animate: "Anim",
  audio: "Music",
  codeart: "Code",
  photo: "Photo",
  write: "Write",
};

export function TopNavBar() {
  const activeModule = useCanvasStore((s) => s.activeModule);
  const activeLabel =
    (activeModule ? MODULE_LABELS[activeModule] : null) ?? activeModule ?? "Workspace";

  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-6 h-12 bg-slate-950/85 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
      <div className="flex items-center gap-4">
        <span className="font-['Space_Grotesk'] tracking-tight headline-md text-xl font-bold text-slate-50">
          CanvasOS
        </span>
        <div className="h-4 w-px bg-white/10 mx-2"></div>
        <nav className="hidden md:flex gap-6 items-center">
          <span className="text-[#E94560] font-bold text-xs uppercase tracking-widest cursor-pointer transition-transform scale-95 active:scale-90">
            {activeLabel}
          </span>
          <span className="text-slate-400 text-xs uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors px-2 py-1 rounded">
            Assets
          </span>
          <span className="text-slate-400 text-xs uppercase tracking-widest cursor-pointer hover:bg-white/5 transition-colors px-2 py-1 rounded">
            Market
          </span>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex -space-x-2">
          <div className="w-7 h-7 rounded-full border-2 border-slate-950 bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-[10px] font-bold text-white">
            M
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-slate-950 bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-[10px] font-bold text-white">
            A
          </div>
          <div className="w-7 h-7 rounded-full border-2 border-slate-950 bg-surface-container-high flex items-center justify-center text-[10px] font-bold">
            +2
          </div>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-white">
            group
          </span>
          <span className="material-symbols-outlined text-[20px] cursor-pointer hover:text-white">
            cloud_done
          </span>
        </div>
        <button className="bg-primary-container text-on-primary-container px-4 py-1 rounded-full text-xs font-bold transition-transform scale-95 active:scale-90 hover:brightness-110">
          Export
        </button>
      </div>
    </header>
  );
}
