import React from 'react';
import { Database, Clock, RefreshCw } from 'lucide-react';

export default function DataFreshness({ systemStatus }) {
  const rawEpoch = systemStatus?.last_propagated;
  const rawRetrieved = systemStatus?.retrieved_at;
  const dataSource = systemStatus?.data_source;
  const pipelineStatus = systemStatus?.pipeline_status || (systemStatus?.sgp4_engine ? 'ACTIVE' : null);

  // If backend returns no status or timestamp info, don't render empty placeholders
  if (!rawEpoch && !rawRetrieved && !dataSource && !pipelineStatus) {
    return null;
  }

  const formatUtc = (isoStr) => {
    if (!isoStr) return null;
    try {
      const d = new Date(isoStr);
      return `${d.toISOString().replace('T', ' ').slice(0, 19)} UTC`;
    } catch {
      return String(isoStr);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl glass-panel text-xs text-slate-300 font-mono border border-slate-800">
      {/* Pipeline Status & Source */}
      <div className="flex flex-wrap items-center gap-3">
        {pipelineStatus && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-400 tracking-wide uppercase text-[11px]">
              {pipelineStatus} {systemStatus?.sgp4_engine ? `• ${systemStatus.sgp4_engine}` : '• SGP4'}
            </span>
          </div>
        )}

        {dataSource && (
          <>
            {pipelineStatus && <span className="text-slate-700 hidden sm:inline">|</span>}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Database className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-400">Source:</span>
              <span className="text-slate-200 truncate max-w-xs">{dataSource}</span>
            </div>
          </>
        )}
      </div>

      {/* Epoch & Last Retrieved Timestamps */}
      <div className="flex flex-wrap items-center gap-4">
        {rawEpoch && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <Clock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="text-slate-400">Epoch:</span>
            <span className="text-slate-200">{formatUtc(rawEpoch)}</span>
          </div>
        )}

        {rawRetrieved && (
          <div className="flex items-center gap-1.5 text-slate-400">
            <RefreshCw className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="text-slate-400">Retrieved:</span>
            <span className="text-slate-300">{formatUtc(rawRetrieved)}</span>
          </div>
        )}
      </div>
    </div>
  );
}
