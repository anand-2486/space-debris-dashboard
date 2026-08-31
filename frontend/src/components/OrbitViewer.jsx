import React, { useState, useEffect } from 'react';
import ViewToggle from './ViewToggle';
import Orbit2D from './Orbit2D';
import Orbit3D from './Orbit3D';
import { Layers, Maximize2, Minimize2 } from 'lucide-react';

export default function OrbitViewer({ event }) {
  const [activeView, setActiveView] = useState('3d');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  if (!event) {
    return (
      <div className="glass-panel rounded-xl p-8 border border-slate-800 text-center text-slate-500 font-mono text-xs">
        No active conjunction event selected for visualization.
      </div>
    );
  }

  return (
    <div
      className={`glass-panel rounded-xl border border-slate-800 overflow-hidden flex flex-col transition-all duration-300 ${
        isFullscreen
          ? 'fixed inset-0 z-50 bg-[#04060d] p-4 rounded-none border-none'
          : 'w-full'
      }`}
    >
      {/* Header with Title, View Switcher & Fullscreen Button */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/70">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
              Orbital Conjunction Visualizer
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            {event.object_a?.name || event.object_a} vs{' '}
            {event.object_b?.name || event.object_b} (Catalog ID:{' '}
            {event.id || event.catalog_id})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewToggle activeView={activeView} onViewChange={setActiveView} />

          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all flex items-center gap-1.5 text-xs font-mono shadow-sm"
            title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen View'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <span className="hidden sm:inline">Window Fit / Fullscreen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Visualization Display Area (Window Fit & Full Height) */}
      <div
        style={{
          width: '100%',
          height: isFullscreen ? 'calc(100vh - 90px)' : '75vh',
          minHeight: '620px',
        }}
        className="p-2 bg-slate-950/60 relative w-full flex flex-col"
      >
        {activeView === '3d' ? (
          <Orbit3D event={event} isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
        ) : (
          <Orbit2D event={event} />
        )}
      </div>
    </div>
  );
}
