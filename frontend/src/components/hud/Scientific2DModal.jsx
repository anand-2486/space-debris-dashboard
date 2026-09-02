import React from 'react';
import { X, Activity, Globe } from 'lucide-react';
import Orbit2D from '../Orbit2D';
import DistanceChart from '../DistanceChart';
import mockData from '../../data/mockEvents.json';

export default function Scientific2DModal({
  isOpen = false,
  onClose,
  event = mockData.events[0],
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-panel w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl border border-cyan-500/40 p-5 sm:p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
                2D Scientific Analysis & Ephemeris Projection
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                {event.object_a.name} × {event.object_b.name} (Event ID: {event.id || event.catalog_id})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold flex items-center gap-1.5 transition-colors shadow-glow-cyan"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Switch to 3D</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2D Planar Orbital Track Projection */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-2">
          <Orbit2D event={event} />
        </div>

        {/* Miss Distance Convergence Curve */}
        <div className="bg-slate-950/60 rounded-xl border border-slate-800 p-2">
          <DistanceChart event={event} />
        </div>
      </div>
    </div>
  );
}
