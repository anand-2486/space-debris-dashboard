import { 
  ShieldAlert, 
  ArrowRight, 
  Globe, 
  Activity, 
  Crosshair, 
  Layers 
} from 'lucide-react';

export default function StageOverlays({
  scrollProgress = 0,
  onExploreOrbit,
  onViewThreats,
  layers,
  onToggleLayer,
  viewMode = '3d',
  onToggleViewMode,
  onOpenEventDetails,
}) {
  // Flight telemetry calculation derived from scroll progression
  const altitudeKm =
    scrollProgress < 0.1
      ? 0.0
      : scrollProgress < 0.3
      ? ((scrollProgress - 0.1) * 60).toFixed(1)
      : scrollProgress < 0.5
      ? (12.0 + (scrollProgress - 0.3) * 1050).toFixed(1)
      : '505.2';

  const velocityKms =
    scrollProgress < 0.1
      ? 0.0
      : scrollProgress < 0.3
      ? (0.2 + (scrollProgress - 0.1) * 5.2).toFixed(2)
      : scrollProgress < 0.5
      ? (1.25 + (scrollProgress - 0.3) * 32.0).toFixed(2)
      : '7.65';

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 sm:p-6 lg:p-8 pt-16 pb-24">
      {/* ─────────────────────────────────────────────────────────────
          STAGE 1: LAUNCH PAD HERO OVERLAY (0.00 - 0.08)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress < 0.12 && (
        <div
          className="my-auto max-w-xl transition-opacity duration-500 pointer-events-auto"
          style={{ opacity: Math.max(0, 1.0 - scrollProgress * 12.0) }}
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>MISSION STAGE 01 // LAUNCH PAD</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none font-sans">
              TRACK THE ORBIT.<br />
              <span className="text-cyan-400 drop-shadow-[0_0_25px_rgba(56,189,248,0.4)]">
                PREDICT THE RISK.
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-mono max-w-md leading-relaxed">
              Real-time space debris tracking and satellite conjunction intelligence powered by orbital mechanics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onExploreOrbit}
                className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-glow-cyan flex items-center gap-2"
              >
                <span>Explore Orbit</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onViewThreats}
                className="px-5 py-2.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-cyan-500/50 font-mono text-xs font-semibold tracking-wider uppercase transition-all flex items-center gap-2"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>View Threats</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Scroll to Launch Prompt on Stage 1 */}
      {scrollProgress < 0.08 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-cyan-400 font-mono text-xs pointer-events-none animate-bounce">
          <span className="tracking-widest uppercase text-[11px] font-bold">SCROLL TO LAUNCH</span>
          <div className="w-5 h-8 rounded-full border-2 border-cyan-400 flex items-start justify-center p-1">
            <div className="w-1 h-2 bg-cyan-400 rounded-full animate-ping"></div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 2 & 3: ASCENT & LEAVING EARTH TELEMETRY (0.08 - 0.50)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.08 && scrollProgress < 0.52 && (
        <div
          className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs transition-opacity duration-300 font-mono text-xs"
          style={{ opacity: Math.min(1.0, (scrollProgress - 0.08) * 10.0) }}
        >
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              FLIGHT TELEMETRY
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              STAGE {scrollProgress < 0.25 ? '02 // ASCENT' : '03 // LEAVING EARTH'}
            </span>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">ALTITUDE:</span>
              <span className="text-white font-bold">{altitudeKm} km</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">VELOCITY:</span>
              <span className="text-amber-400 font-bold">{velocityKms} km/s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">STATUS:</span>
              <span className="text-emerald-400 font-bold">
                {scrollProgress < 0.25 ? 'ASCENDING' : 'LEAVING EARTH'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 4 & 5: SOLAR SYSTEM INFO & EXPLORATION (0.52 - 0.76)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.52 && scrollProgress < 0.76 && (
        <div className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs font-mono text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              SOLAR SYSTEM INFO
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
              STAGE 05
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-slate-300 text-[11px]">
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">PLANETS</span>
              <span className="text-white font-bold text-sm">8</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">DWARF PLANETS</span>
              <span className="text-white font-bold text-sm">5</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">MOONS</span>
              <span className="text-white font-bold text-sm">200+</span>
            </div>
            <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">ASTEROIDS</span>
              <span className="text-white font-bold text-sm">1.3M+</span>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span>Planets continuously revolve around Sun in real time.</span>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 6: APPROACHING EARTH INFO (0.76 - 0.86)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.76 && scrollProgress < 0.86 && (
        <div className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs font-mono text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              EARTH INFO
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              STAGE 06
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">DISTANCE:</span>
              <span className="text-white font-bold">0.98 AU</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SATELLITES:</span>
              <span className="text-cyan-400 font-bold">2,842</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">DEBRIS:</span>
              <span className="text-rose-400 font-bold">15,281</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">LIVE FEED:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                ACTIVE
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 7: EARTH ORBITAL ENVIRONMENT & LAYER TOGGLES (0.86 - 0.93)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.86 && scrollProgress < 0.93 && (
        <div className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs font-mono text-xs space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              ORBITAL ENVIRONMENT
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              STAGE 07
            </span>
          </div>

          {/* Orbital Shell Filter Pills */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1.5">Orbital Shells</span>
            <div className="grid grid-cols-4 gap-1">
              {['leo', 'sso', 'meo', 'geo'].map((shell) => {
                const active = layers[shell];
                return (
                  <button
                    key={shell}
                    type="button"
                    onClick={() => onToggleLayer(shell)}
                    className={`py-1 rounded text-center text-[10px] font-bold uppercase transition-all ${
                      active
                        ? 'bg-cyan-600 text-white shadow-glow-cyan'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {shell}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Object Filter Switches */}
          <div>
            <span className="text-[10px] text-slate-400 uppercase block mb-1.5">Object Filters</span>
            <div className="space-y-1.5 text-[11px]">
              {[
                { key: 'satellites', label: 'Satellites' },
                { key: 'debris', label: 'Debris Field' },
                { key: 'orbitLines', label: 'Orbit Lines' },
                { key: 'labels', label: 'Telemetry Labels' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <span className="text-slate-300">{item.label}</span>
                  <button
                    type="button"
                    onClick={() => onToggleLayer(item.key)}
                    className={`w-8 h-4 rounded-full transition-colors relative flex items-center ${
                      layers[item.key] ? 'bg-cyan-600' : 'bg-slate-800'
                    }`}
                  >
                    <span
                      className={`w-3 h-3 rounded-full bg-white transition-transform ${
                        layers[item.key] ? 'translate-x-4.5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 8: CONJUNCTION EVENT INFO (0.93 - 0.96)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.93 && scrollProgress < 0.96 && (
        <div className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs font-mono text-xs space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-white tracking-wider flex items-center gap-1.5">
              <Crosshair className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              CONJUNCTION INFO
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
              STAGE 08
            </span>
          </div>

          <div className="space-y-1.5 text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-400">EVENT ID:</span>
              <span className="text-cyan-400 font-bold">EVT-2026-0841</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OBJECT A:</span>
              <span className="text-white font-bold">CARTOSAT-2F</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">OBJECT B:</span>
              <span className="text-rose-400 font-bold">FENGYUN 1C DEB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">TCA:</span>
              <span className="text-amber-400 font-bold">16:42:00 UTC</span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          STAGE 9: RISK ANALYSIS FLOATING ALERT PANEL (0.96 - 1.00)
          ───────────────────────────────────────────────────────────── */}
      {scrollProgress >= 0.96 && (
        <>
          {/* Main Conjunction Alert Card (Right side) */}
          <div className="absolute top-20 right-6 sm:right-8 glass-panel p-5 rounded-xl border border-rose-600/50 shadow-glow-rose pointer-events-auto max-w-sm font-mono text-xs space-y-3.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-rose-900/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping"></span>
                <span className="text-rose-400 font-bold tracking-wider uppercase text-[11px]">
                  LIVE CONJUNCTION ALERT
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase font-bold">
                CRITICAL
              </span>
            </div>

            <div>
              <div className="text-sm font-extrabold text-white mb-1">EVT-2026-0841</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold">
                <span className="text-cyan-400">CARTOSAT-2F</span>
                <span className="text-rose-400">⚡</span>
                <span className="text-rose-300">FENGYUN 1C DEB</span>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">TCA (UTC):</span>
                <span className="text-white font-bold">26 AUG 2026 16:42 UTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">MIN. SEPARATION:</span>
                <span className="text-rose-400 font-bold">184 m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">REL. VELOCITY:</span>
                <span className="text-amber-400 font-bold">14.78 km/s</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-1.5">
                <span className="text-slate-400">RISK SCORE:</span>
                <span className="text-rose-400 font-extrabold text-sm">92 / 100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">CONFIDENCE:</span>
                <span className="text-emerald-400 font-bold">81 / 100</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onOpenEventDetails}
              className="w-full py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold tracking-wider uppercase transition-all shadow-glow-rose flex items-center justify-center gap-2"
            >
              <span>View Event Details</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Left-side Risk Scale & Mode Switch */}
          <div className="absolute top-20 left-6 sm:left-8 glass-panel p-4 rounded-xl border border-slate-800 pointer-events-auto max-w-xs font-mono text-xs space-y-3 animate-fadeIn">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">Risk Scale</span>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-400"></span>
                  <span>CRITICAL (&gt;80)</span>
                </div>
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  <span>HIGH (60 - 80)</span>
                </div>
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                  <span>MEDIUM (40 - 60)</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>LOW (&lt;40)</span>
                </div>
              </div>
            </div>

            {/* 3D / 2D Scientific View Switch */}
            <div className="border-t border-slate-800 pt-2.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">View Mode</span>
              <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 w-full">
                <button
                  type="button"
                  onClick={() => onToggleViewMode('3d')}
                  className={`flex-1 py-1 rounded text-center text-xs font-bold transition-all ${
                    viewMode === '3d' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  3D
                </button>
                <button
                  type="button"
                  onClick={() => onToggleViewMode('2d')}
                  className={`flex-1 py-1 rounded text-center text-xs font-bold transition-all ${
                    viewMode === '2d' ? 'bg-cyan-600 text-white shadow-glow-cyan' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2D
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
