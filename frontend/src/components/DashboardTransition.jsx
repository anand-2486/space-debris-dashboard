import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, LayoutDashboard, ShieldAlert, Satellite, Orbit } from 'lucide-react';

export default function DashboardTransition() {
  const navigate = useNavigate();

  return (
    <section className="relative w-full py-20 px-4 sm:px-6 lg:px-8 bg-[#04060d] border-t border-slate-800/80 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 radar-grid opacity-20 pointer-events-none" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="glass-panel rounded-2xl p-8 sm:p-12 border border-cyan-500/25 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-center justify-between gap-8">
          
          {/* Left Text */}
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>OPERATIONAL CONJUNCTION INTELLIGENCE</span>
            </div>

            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight uppercase font-sans">
              ASTRA-TRACK MISSION DASHBOARD
            </h3>

            <p className="text-xs sm:text-sm text-slate-300 font-mono leading-relaxed">
              Monitor satellites, space debris and conjunction events using real orbital data.
            </p>

            {/* Feature Pills */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                Monitored Constellations
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Top Threat Conjunctions
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-300 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800">
                <Orbit className="w-3.5 h-3.5 text-emerald-400" />
                3D / 2D Scientific Trajectory
              </span>
            </div>
          </div>

          {/* Right Action Button */}
          <div className="shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-full md:w-auto px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black font-mono text-xs sm:text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.45)] hover:shadow-[0_0_35px_rgba(6,182,212,0.7)] flex items-center justify-center gap-3 group"
            >
              <span>OPEN MISSION DASHBOARD</span>
              <ArrowRight className="w-4 h-4 text-slate-950 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
