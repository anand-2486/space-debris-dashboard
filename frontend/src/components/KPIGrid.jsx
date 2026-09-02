import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Compass } from 'lucide-react';

export default function KPIGrid({ dashboardData }) {
  const navigate = useNavigate();

  const satelliteCount = dashboardData?.satellite_count ?? 0;
  const conjunctionCount = dashboardData?.conjunction_count ?? 0;

  const kpis = [
    {
      id: 'kpi-satellites',
      title: 'Monitored Satellites',
      value: satelliteCount.toLocaleString(),
      unit: 'Assets',
      subtitle: 'Active spacecraft in orbital catalog',
      icon: Satellite,
      accent: 'text-cyan-400',
      border: 'border-cyan-500/30',
      tag: 'LEO Catalog',
      statusText: 'TRACKED',
      onClick: () => navigate('/satellites'),
    },
    {
      id: 'kpi-conjunctions',
      title: 'Active Conjunctions',
      value: conjunctionCount.toLocaleString(),
      unit: 'Events',
      subtitle: 'Screened close approach encounters',
      icon: Compass,
      accent: 'text-amber-400',
      border: 'border-amber-500/30',
      tag: 'Orbital Screening',
      statusText: conjunctionCount > 0 ? 'ACTIVE' : 'NOMINAL',
      onClick: () => navigate('/conjunctions'),
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={kpi.onClick}
            className={`glass-panel glass-panel-hover rounded-xl p-5 border ${kpi.border} transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
                  {kpi.title}
                </span>
                <div className={`p-2 rounded-lg bg-slate-900/80 border border-slate-800 ${kpi.accent}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>

              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-bold font-mono text-white tracking-tight">
                  {kpi.value}
                </span>
                {kpi.unit && (
                  <span className="text-sm font-mono text-slate-400 font-normal">
                    {kpi.unit}
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 line-clamp-1 mb-3 font-mono">
                {kpi.subtitle}
              </p>
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">{kpi.tag}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {kpi.statusText}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
