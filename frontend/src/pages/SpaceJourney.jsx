import React from 'react';
import MissionNavigation from '../components/hud/MissionNavigation';
import HeroSection from '../components/HeroSection';
import SolarSystemSection from '../components/SolarSystemSection';

import astraIcon from '../assets/astra_icon.png';

export default function SpaceJourney() {
  const scrollToSolarSystem = () => {
    const el = document.getElementById('solar-system-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-black text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* ─────────────────────────────────────────────────────────────
          1. COMPACT AEROSPACE NAVBAR FLOATING OVER HERO
          ───────────────────────────────────────────────────────────── */}
      <MissionNavigation />

      {/* ─────────────────────────────────────────────────────────────
          2. STATIC SATELLITE HERO SECTION
          ───────────────────────────────────────────────────────────── */}
      <main>
        <HeroSection onExploreOrbit={scrollToSolarSystem} />

        {/* ─────────────────────────────────────────────────────────────
            3. FULL 3D SOLAR SYSTEM SECTION (PLANETS REVOLVING AROUND SUN)
            ───────────────────────────────────────────────────────────── */}
        <SolarSystemSection />
      </main>

      {/* Aerospace Footer */}
      <footer className="w-full py-8 border-t border-slate-800/60 bg-[#03050b] text-center text-xs font-mono text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={astraIcon} alt="ASTRA-TRACK" className="w-5 h-5 object-contain" />
            <span className="text-cyan-400 font-bold">ASTRA-TRACK</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline text-[11px] tracking-widest uppercase">TRACK. ANALYZE. EXPLORE.</span>
          </div>
          <div>
            Real-time Space Debris Tracking & Conjunction Screening Engine
          </div>
          <div className="text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Telemetry Nominal</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
