import React from 'react';
import { Globe, Map } from 'lucide-react';

export default function ViewToggle({ activeView, onViewChange }) {
  return (
    <div className="inline-flex p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono">
      <button
        onClick={() => onViewChange('3d')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
          activeView === '3d'
            ? 'bg-cyan-600 text-white font-bold shadow-glow-cyan'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Globe className="w-3.5 h-3.5" />
        <span>3D Orbital View</span>
      </button>
      <button
        onClick={() => onViewChange('2d')}
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg transition-all ${
          activeView === '2d'
            ? 'bg-cyan-600 text-white font-bold shadow-glow-cyan'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Map className="w-3.5 h-3.5" />
        <span>2D Ground Track</span>
      </button>
    </div>
  );
}
