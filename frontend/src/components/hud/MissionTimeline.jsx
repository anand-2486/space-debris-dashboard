import React, { useState } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';

export default function MissionTimeline({
  currentTime = '16:42',
  isPlaying = false,
  onTogglePlay,
  speed = '1x',
  onSpeedChange,
  onTimeChange,
  onGoToNow,
}) {
  const [scrubberValue, setScrubberValue] = useState(56); // 16:42 percentage on timeline

  const timeTicks = [
    { label: '10:00', pos: 0 },
    { label: '12:00', pos: 16.6 },
    { label: '14:00', pos: 33.3 },
    { label: '16:42', pos: 56, isTCA: true },
    { label: '18:00', pos: 66.6 },
    { label: '20:00', pos: 83.3 },
    { label: '22:00', pos: 100 },
  ];

  const handleSliderChange = (e) => {
    const val = Number(e.target.value);
    setScrubberValue(val);
    if (onTimeChange) onTimeChange(val);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-md border-t border-slate-800/80 px-4 py-2.5 pointer-events-auto font-mono text-xs text-slate-300">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Left: System Status & Data Source */}
        <div className="hidden lg:flex items-center gap-4 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">SYSTEM STATUS</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              ONLINE
            </span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-slate-400 block text-[10px]">PIPELINE</span>
            <span className="text-emerald-400 font-bold">READY</span>
          </div>

          <div className="h-6 w-px bg-slate-800" />

          <div>
            <span className="text-slate-400 block text-[10px]">DATA SOURCE</span>
            <span className="text-slate-200">CelesTrak GP / Space-Track</span>
          </div>
        </div>

        {/* Center: Timeline Scrubber with TCA indicator */}
        <div className="flex-1 max-w-xl space-y-1.5 mx-auto">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 uppercase font-bold">TIMELINE (UTC)</span>
              {/* Playback Controls */}
              <div className="flex items-center gap-1 ml-2">
                <button
                  type="button"
                  onClick={() => setScrubberValue((v) => Math.max(0, v - 10))}
                  className="p-1 hover:text-cyan-400 transition-colors"
                  title="Previous Step"
                >
                  <SkipBack className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="p-1 text-cyan-400 hover:text-white transition-colors"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => setScrubberValue((v) => Math.min(100, v + 10))}
                  className="p-1 hover:text-cyan-400 transition-colors"
                  title="Next Step"
                >
                  <SkipForward className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="text-cyan-400 font-bold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
              16:42 UTC (TCA)
            </div>
          </div>

          {/* Range Slider Track */}
          <div className="relative">
            <input
              type="range"
              min="0"
              max="100"
              value={scrubberValue}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            {/* Tick labels */}
            <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
              {timeTicks.map((tick) => (
                <span
                  key={tick.label}
                  className={tick.isTCA ? 'text-rose-400 font-bold' : ''}
                >
                  {tick.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Playback Speed & Go to Now Button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px]">
            {['LIVE', '1x', '10x', '100x'].map((s) => {
              const active = speed === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => onSpeedChange && onSpeedChange(s)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    active
                      ? s === 'LIVE'
                        ? 'bg-emerald-600 text-white shadow-glow-emerald'
                        : 'bg-cyan-600 text-white shadow-glow-cyan'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s === 'LIVE' ? (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                      LIVE
                    </span>
                  ) : (
                    s
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onGoToNow}
            className="px-3 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500 text-[11px] font-bold uppercase transition-colors"
          >
            GO TO NOW
          </button>
        </div>
      </div>
    </div>
  );
}
