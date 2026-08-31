import React from 'react';
import { ArrowRight, AlertTriangle, ShieldAlert, Zap, Clock, ShieldCheck } from 'lucide-react';

export default function RiskCard({ event, onSelect }) {
  if (!event) return null;

  const eventId = event.id || event.catalog_id;
  const isCritical = event.severity === 'CRITICAL';
  const isHigh = event.severity === 'HIGH';
  const isMedium = event.severity === 'MEDIUM';

  const badgeStyles = isCritical
    ? 'bg-rose-950/80 text-rose-300 border-rose-600/50 shadow-glow-rose'
    : isHigh
    ? 'bg-amber-950/80 text-amber-300 border-amber-600/50 shadow-glow-amber'
    : isMedium
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-600/50'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-600/50';

  const formatTCA = (isoString) => {
    try {
      const d = new Date(isoString);
      const hours = d.getUTCHours().toString().padStart(2, '0');
      const mins = d.getUTCMinutes().toString().padStart(2, '0');
      const month = d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' });
      const day = d.getUTCDate();
      return `${hours}:${mins} UTC (${month} ${day})`;
    } catch {
      return isoString;
    }
  };

  const nameA = event.object_a?.name || event.object_a || 'Primary Asset';
  const typeA = event.object_a?.type || 'Payload';
  const nameB = event.object_b?.name || event.object_b || 'Threat Object';
  const typeB = event.object_b?.type || 'Debris';

  return (
    <div
      onClick={() => onSelect && onSelect(eventId)}
      className="glass-panel glass-panel-hover rounded-xl p-5 border border-slate-800 hover:border-cyan-500/40 cursor-pointer transition-all duration-300 relative group flex flex-col justify-between"
    >
      <div>
        {/* Header: Event ID + Severity Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50">
            {eventId}
          </span>
          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border uppercase flex items-center gap-1.5 ${badgeStyles}`}>
            {isCritical ? (
              <ShieldAlert className="w-3 h-3 text-rose-400" />
            ) : isHigh ? (
              <AlertTriangle className="w-3 h-3 text-amber-400" />
            ) : (
              <ShieldCheck className="w-3 h-3 text-cyan-400" />
            )}
            {event.severity}
          </span>
        </div>

        {/* Objects Confrontation: Object A → Object B */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-white font-semibold text-base mb-1 group-hover:text-cyan-300 transition-colors">
            <span className="truncate max-w-[45%]" title={nameA}>{nameA}</span>
            <span className="text-rose-400 font-mono text-xs flex-shrink-0">→</span>
            <span className="text-slate-300 truncate max-w-[45%]" title={nameB}>{nameB}</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 truncate">
            <span className="text-cyan-400/90 truncate">{typeA}</span>
            <span>vs</span>
            <span className="text-slate-400 truncate">{typeB}</span>
          </div>
        </div>

        {/* Primary Kinematic Telemetry */}
        <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-800/80 space-y-1.5 mb-4 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              TCA:
            </span>
            <span className="text-slate-200 font-semibold">{formatTCA(event.tca)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <span className="w-3.5 text-center text-rose-400 font-bold">⌖</span>
              Minimum Separation:
            </span>
            <span className="text-rose-400 font-bold">
              {event.minimum_separation_km} km
              <span className="text-slate-500 font-normal ml-1">
                ({(event.minimum_separation_km * 1000).toFixed(0)}m)
              </span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Relative Velocity:
            </span>
            <span className="text-amber-400 font-semibold">{event.relative_velocity_kms} km/s</span>
          </div>
        </div>

        {/* Strict Risk Score & Confidence Metrics */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-xs font-mono">
          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Priority Assessment</span>
            <span className="text-base font-bold text-white">
              Risk Score:{' '}
              <span className={event.risk_score >= 80 ? 'text-rose-400' : event.risk_score >= 60 ? 'text-amber-400' : 'text-slate-200'}>
                {event.risk_score}/100
              </span>
            </span>
          </div>

          <div className="bg-slate-950/80 rounded-lg p-2.5 border border-slate-800">
            <span className="text-[11px] text-slate-400 block mb-0.5">Data Confidence</span>
            <span className="text-base font-bold text-white">
              Confidence:{' '}
              <span className="text-emerald-400">
                {event.confidence}/100
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Footer: View Event Button */}
      <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] font-mono text-slate-500">
          Alt: {event.altitude_km || 500} km
        </span>
        <button
          type="button"
          className="flex items-center gap-1 text-cyan-400 font-semibold text-xs group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all"
        >
          <span>View Event</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
