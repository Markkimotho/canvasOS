export function MasterWorkspaceView() {
  return (
    <main className="flex-1 ml-16 mt-12 mb-12 flex overflow-hidden">
      <section className="flex-1 relative overflow-auto bg-surface-dim p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="grid grid-cols-12 gap-8 items-start">
            <div className="col-span-12 md:col-span-7 space-y-4">
              <span className="font-mono text-[10px] text-secondary tracking-[0.3em] uppercase block">
                Medium: AI Fusion
              </span>
              <h1 className="font-headline text-6xl md:text-8xl font-extrabold tracking-tighter leading-[0.85] text-white">
                NEON
                <br />
                <span className="text-primary-container">GENESIS</span>
              </h1>
              <p className="font-body text-slate-400 text-sm max-w-md">
                Integrating high-fidelity neural rendering with traditional oil painting textures.
                Current iteration: 4.2.1-beta.
              </p>
            </div>

            <div className="col-span-12 md:col-span-12 relative">
              <div className="aspect-[16/9] w-full rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4),0_0_15px_rgba(233,69,96,0.04)] bg-surface-container-low group">
                <div className="w-full h-full bg-gradient-to-br from-rose-900/30 via-purple-900/40 to-slate-900 group-hover:scale-105 transition-transform duration-700 min-h-[200px]"></div>
                <div className="absolute inset-0 flex flex-col justify-between p-6 pointer-events-none">
                  <div className="flex justify-between items-start">
                    <div className="glass-panel px-3 py-1 rounded text-[10px] font-mono text-white flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                      LIVE COLLAB: 4 USERS
                    </div>
                    <div className="flex flex-col gap-2">
                      <div className="glass-panel p-2 rounded flex flex-col items-center">
                        <span className="material-symbols-outlined text-sm">layers</span>
                        <span className="text-[8px] mt-1">12</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="glass-panel p-3 rounded-lg flex items-center gap-4 pointer-events-auto">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 uppercase">Brush Size</span>
                        <div className="w-32 h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
                          <div className="w-2/3 h-full bg-primary-container"></div>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-white">64px</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-12 md:col-span-4 aspect-square rounded-xl bg-surface-container p-6 flex flex-col justify-between">
              <div className="flex justify-between">
                <span className="material-symbols-outlined text-secondary">auto_awesome</span>
                <span className="font-mono text-[10px] text-slate-500">PROMPT_ENGINE</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-white">
                Neural
                <br />
                Symmetry
              </h3>
              <div className="h-12 w-full bg-surface-container-highest rounded-lg border-b border-outline-variant/30 px-3 flex items-center">
                <span className="text-xs text-slate-400 italic">"Gilded biomechanical..."</span>
              </div>
            </div>

            <div className="col-span-12 md:col-span-8 h-full rounded-xl overflow-hidden relative group min-h-[200px]">
              <div className="w-full h-full bg-gradient-to-br from-slate-800 via-purple-900/30 to-slate-900 min-h-[200px]"></div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent p-6 flex items-end">
                <div>
                  <h3 className="text-2xl font-headline font-bold text-white">
                    3D Sculpt: Vertex Flow
                  </h3>
                  <p className="text-xs text-slate-400">Optimizing 4.2m polygons in real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <aside className="w-80 glass-panel border-l border-white/5 flex flex-col">
        <div className="p-6 space-y-8 flex-1 overflow-y-auto">
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-secondary">
                AI Generator
              </h4>
              <span className="material-symbols-outlined text-xs text-secondary">bolt</span>
            </div>
            <div className="space-y-3">
              <div className="bg-surface-container-highest/50 p-4 rounded-xl border border-secondary/10">
                <textarea
                  className="w-full bg-transparent border-none text-sm text-on-surface focus:ring-0 resize-none h-24 font-body leading-relaxed focus:outline-none"
                  placeholder="Describe your vision..."
                ></textarea>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
                  <span className="px-2 py-1 rounded bg-secondary/10 border border-secondary/20 text-[9px] text-secondary font-mono whitespace-nowrap uppercase">
                    Cyberpunk
                  </span>
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-slate-400 font-mono whitespace-nowrap uppercase">
                    Oil Painting
                  </span>
                  <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] text-slate-400 font-mono whitespace-nowrap uppercase">
                    Hyperreal
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button className="bg-surface-container-high py-2 rounded text-[10px] font-mono border border-white/5 hover:border-secondary/50 transition-colors">
                  FLUX.1
                </button>
                <button className="bg-secondary text-on-secondary py-2 rounded text-[10px] font-mono font-bold">
                  DALL-E 3
                </button>
                <button className="bg-surface-container-high py-2 rounded text-[10px] font-mono border border-white/5 hover:border-secondary/50 transition-colors">
                  SDXL
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-headline text-xs font-bold uppercase tracking-widest text-slate-400">
                Layers
              </h4>
              <div className="flex gap-2">
                <span className="material-symbols-outlined text-xs">add</span>
                <span className="material-symbols-outlined text-xs">folder</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 bg-primary/10 p-2 rounded-lg border border-primary/20">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-rose-500 to-pink-700"></div>
                <div className="flex-1">
                  <span className="text-[11px] font-medium block">Neon Overlay</span>
                  <span className="text-[9px] text-primary">Active</span>
                </div>
                <span className="material-symbols-outlined text-sm">visibility</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center">
                  <span className="material-symbols-outlined text-xs">gesture</span>
                </div>
                <div className="flex-1">
                  <span className="text-[11px] font-medium block">Sketch_01</span>
                  <span className="text-[9px] text-slate-500">Multiply</span>
                </div>
                <span className="material-symbols-outlined text-sm">visibility</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg opacity-60">
                <div className="w-8 h-8 rounded bg-gradient-to-br from-slate-600 to-slate-800"></div>
                <div className="flex-1">
                  <span className="text-[11px] font-medium block">Base Background</span>
                  <span className="text-[9px] text-slate-500">Normal</span>
                </div>
                <span className="material-symbols-outlined text-sm">visibility_off</span>
              </div>
            </div>
          </section>

          <section className="bg-surface-container-lowest p-4 rounded-xl border border-white/5">
            <h4 className="font-mono text-[9px] text-slate-500 uppercase mb-3">System Analytics</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-slate-500">GPU Compute</span>
                <span className="text-on-surface">62%</span>
              </div>
              <div className="w-full h-[2px] bg-white/5 rounded-full">
                <div className="w-[62%] h-full bg-secondary shadow-[0_0_8px_#00D4FF]"></div>
              </div>
              <div className="flex justify-between text-[10px] font-mono pt-2">
                <span className="text-slate-500">Memory usage</span>
                <span className="text-on-surface">4.8GB / 16GB</span>
              </div>
            </div>
          </section>
        </div>
      </aside>
    </main>
  );
}
