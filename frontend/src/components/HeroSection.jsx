import React from 'react';
import { useNavigate } from 'react-router-dom';
import satelliteImg from '../assets/satellite_hero.png';
import astraIcon from '../assets/astra_icon.png';

export default function HeroSection({ onExploreOrbit }) {
  const navigate = useNavigate();

  const handleExploreClick = () => {
    if (onExploreOrbit) {
      onExploreOrbit();
    } else {
      const section = document.getElementById('solar-system-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <section className="relative min-h-[92vh] sm:min-h-screen w-full flex items-center justify-between pt-20 pb-16 px-6 sm:px-10 lg:px-16 overflow-hidden bg-black">
      {/* ─────────────────────────────────────────────────────────────
          UNIFIED CONTINUOUS DEEP-SPACE BACKGROUND
          ───────────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none bg-black" />

      {/* Main Grid Content */}
      <div className="relative z-10 w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
        
        {/* ─────────────────────────────────────────────────────────────
            LEFT CONTENT: BRAND, HEADLINE, DESCRIPTION, BUTTONS
            ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-cyan-950/50 border border-cyan-500/30 text-xs font-mono font-bold tracking-widest text-cyan-300 uppercase">
            <img src={astraIcon} alt="ASTRA-TRACK Logo" className="w-4 h-4 object-contain drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
            <span>ASTRA-TRACK</span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] text-slate-400 font-normal tracking-wider hidden sm:inline">TRACK. ANALYZE. EXPLORE.</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.08] font-sans">
            TRACK THE ORBIT.<br />
            <span className="text-cyan-400">
              PREDICT THE RISK.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 font-mono max-w-lg leading-relaxed">
            Real-time space debris tracking and satellite conjunction intelligence powered by orbital mechanics.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={handleExploreClick}
              className="px-7 py-3.5 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_28px_rgba(6,182,212,0.5)]"
            >
              EXPLORE ORBIT
            </button>

            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-7 py-3.5 rounded bg-transparent hover:bg-slate-900/80 text-slate-200 border border-slate-700 hover:border-cyan-500/50 font-mono text-xs font-bold tracking-wider uppercase transition-all"
            >
              VIEW DASHBOARD
            </button>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            RIGHT CONTENT: REALISTIC STATIC SATELLITE
            (Seamless transparent float in deep space)
            ───────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-6 flex items-center justify-center relative">
          {/* Soft ambient orbital glow behind spacecraft body */}
          <div className="absolute w-80 h-80 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none -z-0" />
          
          <div className="relative z-10 w-full max-w-[560px] flex items-center justify-center animate-satellite-float">
            <img
              src={satelliteImg}
              alt="ASTRA-TRACK Satellite in Deep Space"
              className="w-full h-auto object-contain select-none pointer-events-none drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)]"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
