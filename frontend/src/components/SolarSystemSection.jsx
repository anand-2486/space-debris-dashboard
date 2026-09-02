import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import SolarSystemScene from './3d/SolarSystemScene';
import { Compass, RotateCw, ZoomIn, Move } from 'lucide-react';

export default function SolarSystemSection() {
  const [selectedPlanet, setSelectedPlanet] = useState(null);

  const planetFacts = {
    Mercury: 'Closest planet to the Sun • Orbital period: 88 Earth days • Surface temp: -180°C to 430°C',
    Venus: 'Thick toxic atmosphere with extreme greenhouse effect • Orbital period: 225 Earth days',
    Earth: 'Primary home orbital environment • LEO/MEO/GEO operational debris screening zone',
    Mars: 'The Red Planet • Two moons (Phobos & Deimos) • Thin CO2 atmosphere',
    Jupiter: 'Largest gas giant in Solar System • Over 95 moons • Intense magnetic field',
    Saturn: 'Spectacular ring system composed of ice and rock • 146 confirmed moons',
    Uranus: 'Ice giant with unique 98-degree axial tilt • Faint planetary ring system',
    Neptune: 'Farthest major planet • Supersonic atmospheric wind speeds exceeding 2,000 km/h',
  };

  return (
    <section id="solar-system-section" className="relative w-full min-h-screen bg-[#030611] border-t border-b border-cyan-500/10 flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-12 overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          SECTION HEADING & SUPPORTING TEXT
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 text-xs font-mono">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>ORBITAL REVOLUTION SIMULATOR</span>
        </div>

        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase font-sans">
          SOLAR SYSTEM
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 font-mono max-w-xl mx-auto leading-relaxed">
          Explore planetary motion and orbital relationships.
        </p>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3D INTERACTIVE CANVAS WITH ORBIT CONTROLS
          ───────────────────────────────────────────────────────────── */}
      <div className="relative w-full h-[620px] sm:h-[700px] my-6 rounded-2xl border border-cyan-500/20 bg-[#04060d]/90 overflow-hidden shadow-[0_0_50px_rgba(4,6,13,0.9)]">
        {/* Interactive Controls Guide HUD */}
        <div className="absolute top-4 left-4 z-20 glass-panel px-3.5 py-2.5 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-none flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <Compass className="w-3.5 h-3.5" />
            <span>3D CONTROLS:</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <RotateCw className="w-3 h-3 text-cyan-400" />
            <span>Rotate: Left Click + Drag</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <ZoomIn className="w-3 h-3 text-cyan-400" />
            <span>Zoom: Mouse Scroll</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Move className="w-3 h-3 text-cyan-400" />
            <span>Pan: Right Click + Drag</span>
          </div>
        </div>

        {/* Selected Planet Telemetry Card */}
        {selectedPlanet && (
          <div className="absolute bottom-4 left-4 z-20 glass-panel p-4 rounded-xl border border-cyan-500/40 text-xs font-mono max-w-sm animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <span className="text-cyan-300 font-bold tracking-wider uppercase">
                {selectedPlanet} TELEMETRY
              </span>
              <button
                onClick={() => setSelectedPlanet(null)}
                className="text-slate-500 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {planetFacts[selectedPlanet] || 'Planetary body in continuous Keplerian orbit around the Sun.'}
            </p>
          </div>
        )}

        {/* 3D Canvas */}
        <Canvas
          camera={{ position: [0, 26, 38], fov: 45 }}
          gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          <color attach="background" args={['#04060d']} />
          <Stars radius={200} depth={80} count={5000} factor={4} saturation={0.5} fade speed={0.8} />

          {/* Lighting */}
          <ambientLight intensity={0.35} />
          <pointLight position={[0, 0, 0]} intensity={18} color="#fff2dc" distance={120} decay={1.1} />
          <directionalLight position={[10, 20, 15]} intensity={0.8} />

          {/* Solar System 3D Scene */}
          <SolarSystemScene onSelectPlanet={(name) => setSelectedPlanet(name)} />

          {/* Basic 3D Controls: Rotate, Zoom, Pan */}
          <OrbitControls
            enableRotate={true}
            enableZoom={true}
            enablePan={true}
            minDistance={8}
            maxDistance={85}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={Math.PI / 8}
            dampingFactor={0.08}
          />
        </Canvas>
      </div>

      {/* Bottom helper tip */}
      <div className="relative z-10 text-center">
        <p className="text-[11px] font-mono text-slate-500">
          ● All 8 planetary bodies continuously revolve in real time according to relative Keplerian velocities.
        </p>
      </div>
    </section>
  );
}
