export function CollabView() {
  return (
    <main className="ml-16 mt-12 mb-12 mr-80 h-[calc(100vh-6rem)] relative bg-surface-dim overflow-hidden">
      {/* Collaboration Banner */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
        <div className="bg-vector-accent/10 border border-vector-accent/20 backdrop-blur-md px-6 py-1.5 rounded-full flex items-center gap-3">
          <span className="w-2 h-2 bg-vector-accent rounded-full animate-pulse"></span>
          <p className="text-vector-accent font-medium text-xs tracking-wide">
            3 collaborators online — Mark, Aria, Dev
          </p>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="w-full h-full p-8 flex items-center justify-center">
        <div className="relative w-full max-w-4xl aspect-video bg-surface-container-low rounded-xl shadow-2xl overflow-hidden group">
          {/* Background gradient placeholder */}
          <div
            className="absolute inset-0 opacity-40 mix-blend-overlay"
            style={{
              background:
                "linear-gradient(135deg, rgba(123,47,190,0.6) 0%, rgba(233,69,96,0.4) 50%, rgba(0,212,255,0.3) 100%)",
            }}
          />

          {/* Active Layer with Lock */}
          <div className="absolute top-10 left-10 w-64 h-48 border-2 border-primary/40 rounded-lg bg-surface-container-high/60 backdrop-blur-sm p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-primary/80 uppercase tracking-widest">
                Active_Layer_01
              </span>
              <div className="flex items-center gap-1 bg-primary text-on-primary px-2 py-0.5 rounded text-[10px] font-bold">
                <span
                  className="material-symbols-outlined text-[12px]"
                  style={{
                    fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                  }}
                >
                  lock
                </span>
                LOCKED BY ARIA
              </div>
            </div>
            <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3"></div>
            </div>
          </div>

          {/* Collaborative Cursors */}
          {/* Mark (Cyan) */}
          <div className="absolute top-1/4 left-1/3 z-40 pointer-events-none">
            <div className="relative">
              <span
                className="material-symbols-outlined text-secondary text-2xl"
                style={{
                  fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                }}
              >
                near_me
              </span>
              <div className="absolute top-6 left-4 bg-secondary text-on-secondary px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-lg">
                Mark
              </div>
            </div>
          </div>

          {/* Aria (Crimson) */}
          <div className="absolute bottom-1/3 right-1/4 z-40 pointer-events-none">
            <div className="relative">
              <span
                className="material-symbols-outlined text-primary text-2xl"
                style={{
                  fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                }}
              >
                near_me
              </span>
              <div className="absolute top-6 left-4 bg-primary text-on-primary px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-lg">
                Aria
              </div>
            </div>
          </div>

          {/* Dev (Green) */}
          <div className="absolute top-1/2 right-1/2 z-40 pointer-events-none">
            <div className="relative">
              <span
                className="material-symbols-outlined text-green-400 text-2xl"
                style={{
                  fontVariationSettings: "'FILL' 1, 'wght' 300, 'GRAD' 0, 'opsz' 24",
                }}
              >
                near_me
              </span>
              <div className="absolute top-6 left-4 bg-green-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-lg">
                Dev
              </div>
            </div>
          </div>

          {/* Chat Bubbles */}
          <div className="absolute top-1/2 left-1/4 flex flex-col gap-2">
            <div className="glass-panel p-3 rounded-full rounded-bl-none shadow-xl border border-white/5 flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-rose-400 to-pink-600 flex-shrink-0" />
              <p className="text-xs font-medium text-on-surface">Should we refine this gradient?</p>
            </div>
          </div>
          <div className="absolute bottom-10 right-10">
            <div className="bg-vector-accent/90 text-slate-950 p-3 rounded-full rounded-br-none shadow-xl flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-xs font-bold">Looks great, I'm adjusting the curve now.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating HUD: Active Tools */}
      <div className="absolute bottom-20 right-4 z-30">
        <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-white/10 flex flex-col gap-3 min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Active Tools
            </span>
            <span className="material-symbols-outlined text-primary text-sm">bolt</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5">
            <span className="material-symbols-outlined text-primary">draw</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Ink Engine v2</span>
              <span className="text-[9px] text-slate-500">Aria is using this</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/5 opacity-50">
            <span className="material-symbols-outlined text-secondary">layers</span>
            <div className="flex flex-col">
              <span className="text-xs font-bold">Mesh Wrap</span>
              <span className="text-[9px] text-slate-500">Waiting for lock</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status for collab */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-slate-950/95 border-t border-white/5 flex justify-between items-center px-8">
        <div className="flex items-center gap-6 font-['JetBrains_Mono'] text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-sm">zoom_in</span>
            <span>Zoom</span>
          </div>
          <div className="flex items-center gap-2 text-[#E94560]">
            <span className="material-symbols-outlined text-sm">speed</span>
            <span className="font-bold">FPS</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-sm">view_kanban</span>
            <span>Timeline</span>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-surface-container-high px-4 py-1 rounded-full border border-white/5">
          <span className="text-[10px] font-mono text-slate-500 uppercase">Latency: 14ms</span>
          <span className="text-[10px] font-mono text-green-400 uppercase">Live Sync Active</span>
        </div>
      </div>

      {/* Right Collaboration Sidebar */}
      <aside className="absolute right-0 top-0 bottom-0 w-80 glass-panel border-l border-white/5 z-40 flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <h3 className="font-['Space_Grotesk'] text-lg font-bold tracking-tight mb-1 text-slate-100 uppercase">
            Collaboration
          </h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
            Activity Feed — Realtime
          </p>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {/* Aria */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-400 to-pink-600" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-primary">Aria</span>
                <span className="text-[9px] font-mono text-slate-500">2m ago</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Locked <span className="text-on-surface font-mono">Layer_01</span> and updated the
                primary gradient mesh.
              </p>
            </div>
          </div>

          {/* Mark */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-secondary">Mark</span>
                <span className="text-[9px] font-mono text-slate-500">5m ago</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Approved changes on the vector pathing. Commented on canvas.
              </p>
            </div>
          </div>

          {/* Dev */}
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-green-400 to-emerald-600" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-bold text-green-400">Dev</span>
                <span className="text-[9px] font-mono text-slate-500">12m ago</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Joined the session. Started 3D export preparation.
              </p>
            </div>
          </div>

          {/* Chat Input */}
          <div className="pt-4">
            <div className="bg-surface-container-highest rounded-xl p-3 border border-white/10 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
              <textarea
                className="w-full bg-transparent border-none focus:outline-none text-sm placeholder:text-slate-600 resize-none no-scrollbar h-20 text-on-surface"
                placeholder="Send message to team..."
              />
              <div className="flex justify-between items-center mt-2">
                <div className="flex gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-lg cursor-pointer hover:text-primary">
                    mood
                  </span>
                  <span className="material-symbols-outlined text-slate-500 text-lg cursor-pointer hover:text-primary">
                    attach_file
                  </span>
                </div>
                <button className="bg-primary-container text-on-primary-container p-1 rounded-lg">
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Status */}
        <div className="p-4 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">
                Recording session...
              </span>
            </div>
            <span className="material-symbols-outlined text-slate-500 text-sm cursor-pointer">
              history
            </span>
          </div>
        </div>
      </aside>
    </main>
  );
}
