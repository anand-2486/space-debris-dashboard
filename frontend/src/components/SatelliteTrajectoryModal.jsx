import React, { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import Plotly from 'plotly.js-dist-min';
import { X, Satellite, Layers, Compass, Globe, Info, Activity } from 'lucide-react';

function Earth3D() {
  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.0, 36, 36]} />
        <meshStandardMaterial color="#0b1b33" roughness={0.7} metalness={0.1} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.01, 24, 24]} />
        <meshBasicMaterial color="#0284c7" wireframe={true} transparent={true} opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[2.08, 32, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent={true} opacity={0.08} side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

function SatelliteOrbit3D({ trajectoryPoints, satellite }) {
  const scale = 2.4 / 6800;

  const points = React.useMemo(() => {
    if (trajectoryPoints && trajectoryPoints.length > 0) {
      return trajectoryPoints.map((p) => new THREE.Vector3((p.x_km ?? p.x) * scale, (p.z_km ?? p.z) * scale, (p.y_km ?? p.y) * scale));
    }
    // Procedural Keplerian circle if no ephemeris points
    const pts = [];
    const radius = 2.45;
    for (let i = 0; i <= 64; i++) {
      const theta = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * 0.45, Math.sin(theta) * radius));
    }
    return pts;
  }, [trajectoryPoints, scale]);

  const satPos = points[0] || new THREE.Vector3(2.45, 0, 0);

  return (
    <group>
      {/* 3D Orbit Path Line */}
      {points.length > 1 && (
        <Line points={points} color="#38bdf8" lineWidth={2.5} dashed={false} />
      )}

      {/* Satellite Node Indicator */}
      <mesh position={satPos}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function SatelliteOrbit2D({ trajectoryPoints, satellite }) {
  const containerRef = React.useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let pts = trajectoryPoints || [];
    if (pts.length === 0) {
      // Fallback circular projection
      pts = Array.from({ length: 64 }, (_, i) => {
        const theta = (i / 64) * Math.PI * 2;
        return {
          x: Math.cos(theta) * (satellite?.apogee_km || 7000),
          y: Math.sin(theta) * (satellite?.perigee_km || 6800),
        };
      });
    }

    const trace = {
      x: pts.map((p) => p.x_km ?? p.x),
      y: pts.map((p) => p.y_km ?? p.y),
      mode: 'lines+markers',
      name: satellite?.object_name || satellite?.name || 'Satellite',
      line: { color: '#38bdf8', width: 3 },
      marker: { size: 5, color: '#38bdf8' },
      type: 'scatter',
    };

    const layout = {
      title: {
        text: `2D Planar Ephemeris Projection: ${satellite?.object_name || satellite?.name || 'Satellite'} (NORAD ${satellite?.norad_cat_id || satellite?.norad_id})`,
        font: { family: 'Inter, sans-serif', size: 12, color: '#94a3b8' },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.6)',
      margin: { t: 40, r: 20, l: 50, b: 40 },
      xaxis: {
        title: { text: 'ECI X (km)', font: { family: 'JetBrains Mono', size: 10, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 9 },
      },
      yaxis: {
        title: { text: 'ECI Y (km)', font: { family: 'JetBrains Mono', size: 10, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 9 },
      },
      autosize: true,
    };

    Plotly.newPlot(containerRef.current, [trace], layout, {
      responsive: true,
      displayModeBar: false,
    });

    return () => {
      if (containerRef.current) Plotly.purge(containerRef.current);
    };
  }, [trajectoryPoints, satellite]);

  return <div ref={containerRef} className="w-full h-full min-h-[350px]" />;
}

export default function SatelliteTrajectoryModal({ isOpen, onClose, satellite, trajectory }) {
  const [activeView, setActiveView] = useState('3d');

  if (!isOpen || !satellite) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl rounded-2xl border border-cyan-500/30 overflow-hidden flex flex-col max-h-[90vh] shadow-[0_0_50px_rgba(6,182,212,0.2)]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Satellite className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">{satellite.name}</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  NORAD {satellite.norad_id}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {satellite.operator} • {satellite.type || 'Primary Monitored Asset'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Toggle (3D / 2D) */}
            <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setActiveView('3d')}
                className={`px-3 py-1 rounded transition-all font-bold ${
                  activeView === '3d'
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                3D View
              </button>
              <button
                type="button"
                onClick={() => setActiveView('2d')}
                className={`px-3 py-1 rounded transition-all font-bold ${
                  activeView === '2d'
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                2D Planar
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Orbital Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">APOGEE</span>
              <span className="text-white font-bold text-sm">{satellite.apogee_km || 520} km</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">PERIGEE</span>
              <span className="text-white font-bold text-sm">{satellite.perigee_km || 498} km</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">INCLINATION</span>
              <span className="text-cyan-400 font-bold text-sm">{satellite.inclination_deg || 97.5}°</span>
            </div>
            <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">ORBITAL PERIOD</span>
              <span className="text-white font-bold text-sm">{satellite.period_min || 94.8} min</span>
            </div>
          </div>

          {/* Visualization Container */}
          <div className="relative w-full h-[380px] rounded-xl border border-slate-800 bg-[#04060d] overflow-hidden">
            {activeView === '3d' ? (
              <Canvas camera={{ position: [0, 2.5, 6.5], fov: 45 }}>
                <color attach="background" args={['#04060d']} />
                <Stars radius={100} depth={50} count={3000} factor={3} fade speed={1} />
                <ambientLight intensity={0.4} />
                <directionalLight position={[10, 10, 5]} intensity={1.2} />
                <Earth3D />
                <SatelliteOrbit3D trajectoryPoints={trajectory} satellite={satellite} />
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
              </Canvas>
            ) : (
              <div className="p-2 w-full h-full flex items-center justify-center">
                <SatelliteOrbit2D trajectoryPoints={trajectory} satellite={satellite} />
              </div>
            )}

            <div className="absolute bottom-2 right-2 text-[10px] font-mono text-slate-500 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
              {activeView === '3d' ? '3D Interactive Orbit • Drag to rotate' : '2D ECI Projected Orbital Plane'}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
