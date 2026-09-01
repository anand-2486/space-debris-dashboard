import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import MissionNavigation from '../components/hud/MissionNavigation';
import RiskCard from '../components/RiskCard';
import { Filter, ArrowRight, Crosshair, ArrowUpDown } from 'lucide-react';

const SEVERITY_ORDER = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

// Sort conjunctions from highest danger to lowest danger
export const sortDangerToLow = (list) => {
  if (!Array.isArray(list)) return [];

  return [...list].sort((a, b) => {
    // 1. Severity
    const rankA = SEVERITY_ORDER[a.severity?.toUpperCase()] || 0;
    const rankB = SEVERITY_ORDER[b.severity?.toUpperCase()] || 0;

    if (rankA !== rankB) {
      return rankB - rankA;
    }

    // 2. Risk score
    const scoreA =
      typeof a.risk_score === 'number' ? a.risk_score : 0;
    const scoreB =
      typeof b.risk_score === 'number' ? b.risk_score : 0;

    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // 3. Minimum separation
    const separationA =
      typeof a.minimum_separation_km === 'number'
        ? a.minimum_separation_km
        : Number.POSITIVE_INFINITY;

    const separationB =
      typeof b.minimum_separation_km === 'number'
        ? b.minimum_separation_km
        : Number.POSITIVE_INFINITY;

    return separationA - separationB;
  });
};

export default function Conjunctions() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function loadConjunctions() {
      try {
        setLoading(true);

        const data = await apiService.getConjunctions();
        const sortedData = sortDangerToLow(data);

        if (isMounted) {
          setEvents(sortedData);
        }
      } catch (err) {
        console.error('Failed to load conjunctions:', err);

        if (isMounted) {
          setEvents([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadConjunctions();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectEvent = (id) => {
    navigate(`/conjunctions/${id}`);
  };

  const sortedEvents = sortDangerToLow(events);

  const topThreat =
    sortedEvents.length > 0 ? sortedEvents[0] : null;

  const filteredEvents = sortedEvents.filter((event) => {
    if (severityFilter === 'ALL') {
      return true;
    }

    return (
      event.severity?.toUpperCase() === severityFilter
    );
  });

  const filterButtons = [
    {
      label: 'ALL',
      value: 'ALL',
      count: events.length,
    },
    {
      label: 'CRITICAL',
      value: 'CRITICAL',
      count: events.filter(
        (event) => event.severity?.toUpperCase() === 'CRITICAL'
      ).length,
    },
    {
      label: 'HIGH',
      value: 'HIGH',
      count: events.filter(
        (event) => event.severity?.toUpperCase() === 'HIGH'
      ).length,
    },
    {
      label: 'MEDIUM',
      value: 'MEDIUM',
      count: events.filter(
        (event) => event.severity?.toUpperCase() === 'MEDIUM'
      ).length,
    },
    {
      label: 'LOW',
      value: 'LOW',
      count: events.filter(
        (event) => event.severity?.toUpperCase() === 'LOW'
      ).length,
    },
  ];

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <MissionNavigation activeTab="CONJUNCTIONS" />

      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Conjunctions
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-3">

            {/* Sort indicator */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-400 bg-cyan-950/50 px-3 py-1.5 rounded-xl border border-cyan-800/40">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Ranked: Danger → Low</span>
            </div>

            {/* Severity filters */}
            <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-mono">

              <span className="text-slate-500 text-[11px] px-2 hidden sm:flex items-center gap-1">
                <Filter className="w-3 h-3 text-cyan-400" />
                <span>Filter:</span>
              </span>

              {filterButtons.map((button) => {
                const isActive =
                  severityFilter === button.value;

                let activeClass =
                  'bg-cyan-600 text-white shadow-glow-cyan';

                if (button.value === 'CRITICAL') {
                  activeClass =
                    'bg-rose-600 text-white shadow-glow-rose';
                }

                if (button.value === 'HIGH') {
                  activeClass =
                    'bg-amber-600 text-white shadow-glow-amber';
                }

                if (button.value === 'MEDIUM') {
                  activeClass =
                    'bg-cyan-700 text-white';
                }

                if (button.value === 'LOW') {
                  activeClass =
                    'bg-emerald-600 text-white shadow-glow-emerald';
                }

                return (
                  <button
                    key={button.value}
                    type="button"
                    onClick={() =>
                      setSeverityFilter(button.value)
                    }
                    className={`px-2.5 py-1 rounded-lg transition-all font-semibold flex items-center gap-1 ${
                      isActive
                        ? activeClass
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/70'
                    }`}
                  >
                    <span>{button.label}</span>

                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isActive
                          ? 'bg-black/30 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {button.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading && events.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 font-mono text-cyan-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-xs">
              Loading Conjunction Events (/api/conjunctions)...
            </p>
          </div>
        ) : (
          <>
            {/* Top Threat */}
            {topThreat && (
              <div className="glass-panel p-5 rounded-2xl border border-rose-600/40 bg-gradient-to-r from-rose-950/30 via-slate-900/60 to-slate-950/80 shadow-[0_0_30px_rgba(244,63,94,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">

                <div className="flex items-start gap-3.5">

                  <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0">
                    <Crosshair className="w-5 h-5 animate-pulse" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">

                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-600 text-white shadow-glow-rose">
                        TOP THREAT CONJUNCTION
                      </span>

                      <span className="text-xs font-mono text-slate-400">
                        {topThreat.id}
                      </span>

                    </div>

                    <h3 className="text-base font-bold text-white mt-1 font-mono">
                      {topThreat.object_a} vs {topThreat.object_b}
                    </h3>

                    <p className="text-xs font-mono text-slate-300 mt-0.5">

                      Miss Distance:{' '}

                      <span className="text-rose-400 font-bold">
                        {typeof topThreat.minimum_separation_km === 'number'
                          ? `${(
                              topThreat.minimum_separation_km * 1000
                            ).toFixed(0)}m`
                          : '—'}
                      </span>

                      {' '}• Rel. Velocity:{' '}

                      <span className="text-amber-400 font-bold">
                        {typeof topThreat.relative_velocity_kms === 'number'
                          ? `${topThreat.relative_velocity_kms} km/s`
                          : '—'}
                      </span>

                      {' '}• TCA:{' '}

                      <span className="text-cyan-400">
                        {topThreat.tca_timestamp || '—'}
                      </span>

                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleSelectEvent(topThreat.id)
                  }
                  className="px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold tracking-wider uppercase transition-all shadow-glow-rose flex items-center gap-2 shrink-0 self-end md:self-center"
                >
                  <span>Analyze 3D / 2D Trajectory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </div>
            )}

            {/* Events */}
            {filteredEvents.length === 0 ? (
              <div className="glass-panel rounded-xl p-8 border border-slate-800 text-center font-mono text-xs text-slate-500">
                No conjunction events matching severity filter:{' '}
                <span className="text-cyan-400 font-bold">
                  {severityFilter}
                </span>
                .
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((event) => (
                  <RiskCard
                    key={event.id}
                    event={event}
                    onSelect={() =>
                      handleSelectEvent(event.id)
                    }
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}