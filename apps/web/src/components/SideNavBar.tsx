import { useCanvasStore } from "../stores/canvasStore";
import type { ModuleId } from "../stores/canvasStore";

interface ModuleConfig {
  icon: string;
  label: string;
}

const MODULE_CONFIG: Record<ModuleId, ModuleConfig> = {
  paint: { icon: "brush", label: "Paint" },
  ai: { icon: "auto_awesome", label: "AI Art" },
  "sculpt-3d": { icon: "view_in_ar", label: "3D Sculpt" },
  vector: { icon: "edit", label: "Vector" },
  animate: { icon: "timeline", label: "Anim" },
  audio: { icon: "music_note", label: "Music" },
  codeart: { icon: "code", label: "Code" },
  photo: { icon: "photo_camera", label: "Photo" },
  write: { icon: "edit_note", label: "Write" },
};

const MODULE_IDS = Object.keys(MODULE_CONFIG) as ModuleId[];

export function SideNavBar() {
  const activeModule = useCanvasStore((s) => s.activeModule);
  const setActiveModule = useCanvasStore((s) => s.setActiveModule);

  return (
    <aside className="fixed left-0 top-12 bottom-0 w-16 z-40 flex flex-col items-center py-4 space-y-6 bg-slate-950/90 backdrop-blur-2xl shadow-2xl bg-gradient-to-r from-white/5 to-transparent">
      {MODULE_IDS.map((moduleId) => {
        const { icon, label } = MODULE_CONFIG[moduleId];
        const isActive = activeModule === moduleId;

        if (isActive) {
          return (
            <div
              key={moduleId}
              className="group relative flex flex-col items-center gap-1 cursor-pointer w-full py-2 text-[#E94560] shadow-[0_0_15px_rgba(233,69,96,0.3)]"
              onClick={() => setActiveModule(moduleId)}
            >
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#E94560] shadow-[0_0_15px_rgba(233,69,96,0.3)]"></div>
              <span
                className="material-symbols-outlined"
                style={{
                  fontVariationSettings: "'FILL' 1, 'wght' 200, 'GRAD' 0, 'opsz' 24",
                }}
              >
                {icon}
              </span>
              <span className="font-['Inter'] text-[8px] uppercase tracking-widest font-bold">
                {label}
              </span>
            </div>
          );
        }

        return (
          <div
            key={moduleId}
            className="group flex flex-col items-center gap-1 cursor-pointer transition-all duration-300 ease-out text-slate-500 hover:text-slate-200 hover:bg-white/5 w-full py-2"
            onClick={() => setActiveModule(moduleId)}
          >
            <span className="material-symbols-outlined">{icon}</span>
            <span className="font-['Inter'] text-[8px] uppercase tracking-widest">{label}</span>
          </div>
        );
      })}
      <div className="mt-auto pb-4 flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-slate-500 hover:text-slate-200 transition-colors cursor-pointer">
          settings
        </span>
        <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/10 flex items-center justify-center text-xs font-bold text-slate-400">
          U
        </div>
      </div>
    </aside>
  );
}
