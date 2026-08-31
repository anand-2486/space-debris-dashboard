import React from 'react';

export default function MissionProgressRail({
  scrollProgress = 0,
  onJumpToStage,
}) {
  const stages = [
    { label: 'MISSION START', scroll: 0.0 },
    { label: 'LAUNCH', scroll: 0.12 },
    { label: 'ASCENT', scroll: 0.28 },
    { label: 'LEAVING EARTH', scroll: 0.45 },
    { label: 'SOLAR SYSTEM', scroll: 0.62 },
    { label: 'EARTH APPROACH', scroll: 0.80 },
    { label: 'TRACKING', scroll: 0.89 },
    { label: 'CONJUNCTION', scroll: 0.95 },
    { label: 'RISK', scroll: 0.99 },
  ];

  // Helper to determine active stage index
  const activeStageIndex = stages.reduce((acc, stage, idx) => {
    if (scrollProgress >= stage.scroll - 0.04) return idx;
    return acc;
  }, 0);

  return (
    <aside className="fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40 hidden md:flex flex-col items-end gap-3.5 pointer-events-auto font-mono text-[10px]">
      <div className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mb-1">
        MISSION PROGRESS
      </div>

      <div className="relative flex flex-col gap-4">
        {/* Background vertical progress track */}
        <div className="absolute right-[5px] top-2 bottom-2 w-0.5 bg-slate-800" />
        {/* Active progress fill */}
        <div
          className="absolute right-[5px] top-2 w-0.5 bg-gradient-to-b from-cyan-400 to-rose-400 transition-all duration-300"
          style={{ height: `${Math.min(100, scrollProgress * 100)}%` }}
        />

        {stages.map((st, idx) => {
          const isPassed = idx < activeStageIndex;
          const isActive = idx === activeStageIndex;

          return (
            <button
              key={st.label}
              type="button"
              onClick={() => onJumpToStage && onJumpToStage(st.scroll)}
              className="group flex items-center gap-3 text-right focus:outline-none"
            >
              {/* Stage label tooltip on hover or active */}
              <span
                className={`transition-all duration-200 tracking-wider whitespace-nowrap uppercase ${
                  isActive
                    ? 'text-cyan-300 font-extrabold text-[11px] drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                    : isPassed
                    ? 'text-slate-400 group-hover:text-slate-200'
                    : 'text-slate-600 group-hover:text-slate-400'
                }`}
              >
                {st.label}
              </span>

              {/* Node Indicator Dot */}
              <div
                className={`w-3 h-3 rounded-full z-10 flex items-center justify-center transition-all duration-300 ${
                  isActive
                    ? 'bg-cyan-400 ring-4 ring-cyan-500/30 scale-125'
                    : isPassed
                    ? 'bg-cyan-600'
                    : 'bg-slate-800 group-hover:bg-slate-700'
                }`}
              >
                {isActive && <div className="w-1 h-1 bg-white rounded-full animate-ping" />}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
