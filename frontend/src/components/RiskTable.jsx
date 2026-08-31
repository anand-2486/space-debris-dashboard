import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

export default function RiskTable({ 
  events = [], 
  onSelectEvent, 
  filterSeverity: externalFilter, 
  onFilterChange: externalOnFilterChange 
}) {
  const [internalFilter, setInternalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFilter = externalFilter !== undefined ? externalFilter : internalFilter;
  const setFilter = externalOnFilterChange || setInternalFilter;

  const filteredEvents = events.filter((evt) => {
    const matchesSeverity = activeFilter === 'ALL' || evt.severity === activeFilter;
    const q = searchQuery.toLowerCase().trim();
    const eventId = (evt.id || evt.catalog_id || '').toLowerCase();
    const nameA = (evt.object_a?.name || evt.object_a || '').toLowerCase();
    const nameB = (evt.object_b?.name || evt.object_b || '').toLowerCase();
    const operator = (evt.object_a?.operator || '').toLowerCase();

    const matchesSearch =
      !q ||
      eventId.includes(q) ||
      nameA.includes(q) ||
      nameB.includes(q) ||
      operator.includes(q);

    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-600/50 shadow-glow-rose">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse"></span>
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-glow-amber">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-600/50">
            MEDIUM
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-950/80 text-emerald-300 border border-emerald-600/50">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
      {/* Table Header & Search Controls */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">
            Conjunction Screening Table
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            SGP4 Candidate Pair Propagation & Miss Distance Telemetry
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search catalog or satellite..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 transition-colors"
            />
          </div>

          {/* Severity Filter pills */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setFilter(sev)}
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  activeFilter === sev
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">Event ID</th>
              <th className="py-3 px-4">Primary Asset (Obj A)</th>
              <th className="py-3 px-4">Threat Object (Obj B)</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Risk Score</th>
              <th className="py-3 px-4">Confidence</th>
              <th className="py-3 px-4">Min Sep (m)</th>
              <th className="py-3 px-4">Rel Vel (km/s)</th>
              <th className="py-3 px-4">TCA (UTC)</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-8 text-center text-slate-500 font-mono">
                  No conjunction events match the current filter criteria ({activeFilter}).
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => {
                const eventId = evt.id || evt.catalog_id;
                const tcaDate = new Date(evt.tca);
                const tcaStr = !isNaN(tcaDate.getTime()) 
                  ? `${tcaDate.getUTCHours().toString().padStart(2, '0')}:${tcaDate.getUTCMinutes().toString().padStart(2, '0')} UTC (${tcaDate.toISOString().slice(5, 10)})`
                  : evt.tca;

                const nameA = evt.object_a?.name || evt.object_a || 'Asset';
                const noradA = evt.object_a?.norad_id ? `NORAD ${evt.object_a.norad_id} • ` : '';
                const opA = evt.object_a?.operator || 'Active';

                const nameB = evt.object_b?.name || evt.object_b || 'Debris';
                const noradB = evt.object_b?.norad_id ? `NORAD ${evt.object_b.norad_id} • ` : '';
                const typeB = evt.object_b?.type || 'Debris';

                return (
                  <tr
                    key={eventId}
                    onClick={() => onSelectEvent && onSelectEvent(eventId)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-cyan-400 group-hover:text-cyan-300">
                      {eventId}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-white">
                        {nameA}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {noradA}{opA}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-slate-200">
                        {nameB}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {noradB}{typeB}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(evt.severity)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span className={evt.risk_score >= 80 ? 'text-rose-400' : evt.risk_score >= 60 ? 'text-amber-400' : 'text-slate-200'}>
                        {evt.risk_score}/100
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {evt.confidence}/100
                    </td>
                    <td className="py-3.5 px-4 font-bold">
                      <span className={evt.minimum_separation_km < 0.5 ? 'text-rose-400' : 'text-slate-200'}>
                        {(evt.minimum_separation_km * 1000).toFixed(0)} m
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal ml-1">
                        ({evt.minimum_separation_km} km)
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {evt.relative_velocity_kms}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {tcaStr}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectEvent) onSelectEvent(eventId);
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-slate-700 hover:border-cyan-500 transition-all font-sans font-medium text-xs inline-flex items-center gap-1"
                      >
                        <span>View Event</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
