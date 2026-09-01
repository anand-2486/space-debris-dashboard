import React, { useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';

export default function RiskTable({
  events = [],
  onSelectEvent,
  filterSeverity: externalFilter,
  onFilterChange: externalOnFilterChange,
}) {
  const [internalFilter, setInternalFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const activeFilter =
    externalFilter !== undefined
      ? externalFilter
      : internalFilter;

  const setFilter =
    externalOnFilterChange || setInternalFilter;

  const filteredEvents = events.filter((event) => {
    const matchesSeverity =
      activeFilter === 'ALL' ||
      event.severity === activeFilter;

    const query = searchQuery
      .toLowerCase()
      .trim();

    const eventId = String(
      event.id ?? event.catalog_id ?? ''
    ).toLowerCase();

    /*
     * Backend contract:
     *
     * object_a = NORAD/object ID
     * object_b = NORAD/object ID
     *
     * They are NOT nested objects containing names.
     */
    const objectA = String(
      event.object_a ?? ''
    ).toLowerCase();

    const objectB = String(
      event.object_b ?? ''
    ).toLowerCase();

    const matchesSearch =
      !query ||
      eventId.includes(query) ||
      objectA.includes(query) ||
      objectB.includes(query);

    return (
      matchesSeverity &&
      matchesSearch
    );
  });

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-950/80 text-rose-300 border border-rose-600/50 shadow-glow-rose">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            CRITICAL
          </span>
        );

      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-600/50 shadow-glow-amber">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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

  const formatTCA = (timestamp) => {
    if (!timestamp) return '—';

    const date = new Date(timestamp);

    if (Number.isNaN(date.getTime())) {
      return String(timestamp);
    }

    return (
      `${date.getUTCHours()
        .toString()
        .padStart(2, '0')}:` +
      `${date.getUTCMinutes()
        .toString()
        .padStart(2, '0')} UTC ` +
      `(${date.toISOString().slice(5, 10)})`
    );
  };

  const formatNumber = (value, decimals = 3) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return '—';
    }

    return number.toFixed(decimals);
  };

  return (
    <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">

      {/* Header */}
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

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

            <input
              type="text"
              placeholder="Search event or NORAD ID..."
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg pl-9 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-56 transition-colors"
            />
          </div>

          {/* Severity filters */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs font-mono">
            {[
              'ALL',
              'CRITICAL',
              'HIGH',
              'MEDIUM',
              'LOW',
            ].map((severity) => (
              <button
                key={severity}
                type="button"
                onClick={() =>
                  setFilter(severity)
                }
                className={`px-2.5 py-1 rounded transition-all font-semibold ${
                  activeFilter === severity
                    ? 'bg-cyan-600 text-white shadow-glow-cyan'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">

        <table className="w-full text-left text-xs font-mono border-collapse">

          <thead>
            <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[11px]">

              <th className="py-3 px-4">
                Event ID
              </th>

              <th className="py-3 px-4">
                Object A (NORAD)
              </th>

              <th className="py-3 px-4">
                Object B (NORAD)
              </th>

              <th className="py-3 px-4">
                Severity
              </th>

              <th className="py-3 px-4">
                Risk Score
              </th>

              <th className="py-3 px-4">
                Confidence
              </th>

              <th className="py-3 px-4">
                Min Sep (m)
              </th>

              <th className="py-3 px-4">
                Rel Vel (km/s)
              </th>

              <th className="py-3 px-4">
                TCA (UTC)
              </th>

              <th className="py-3 px-4 text-right">
                Action
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-slate-800/60">

            {filteredEvents.length === 0 ? (

              <tr>
                <td
                  colSpan="10"
                  className="py-8 text-center text-slate-500 font-mono"
                >
                  No conjunction events match the
                  current filter criteria (
                  {activeFilter}
                  ).
                </td>
              </tr>

            ) : (

              filteredEvents.map((event) => {

                const eventId =
                  event.id ??
                  event.catalog_id;

                const objectA =
                  event.object_a ?? '—';

                const objectB =
                  event.object_b ?? '—';

                const separation =
                  Number(
                    event.minimum_separation_km
                  );

                const relativeVelocity =
                  Number(
                    event.relative_velocity_kms
                  );

                const riskScore =
                  Number(event.risk_score);

                const confidence =
                  Number(event.confidence);

                return (
                  <tr
                    key={eventId}
                    onClick={() =>
                      onSelectEvent &&
                      onSelectEvent(eventId)
                    }
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors group"
                  >

                    {/* Event ID */}
                    <td className="py-3.5 px-4 font-semibold text-cyan-400 group-hover:text-cyan-300">
                      {eventId}
                    </td>

                    {/* Object A */}
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-white">
                        NORAD {objectA}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Backend object_a
                      </div>
                    </td>

                    {/* Object B */}
                    <td className="py-3.5 px-4">
                      <div className="font-sans font-semibold text-slate-200">
                        NORAD {objectB}
                      </div>

                      <div className="text-[10px] text-slate-500 font-mono">
                        Backend object_b
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3.5 px-4">
                      {getSeverityBadge(
                        event.severity
                      )}
                    </td>

                    {/* Risk */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span
                        className={
                          riskScore >= 80
                            ? 'text-rose-400'
                            : riskScore >= 60
                            ? 'text-amber-400'
                            : 'text-slate-200'
                        }
                      >
                        {Number.isFinite(riskScore)
                          ? `${riskScore}/100`
                          : '—'}
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4 font-semibold text-emerald-400">
                      {Number.isFinite(confidence)
                        ? `${confidence}/100`
                        : '—'}
                    </td>

                    {/* Minimum separation */}
                    <td className="py-3.5 px-4 font-bold">

                      <span
                        className={
                          Number.isFinite(separation) &&
                          separation < 0.5
                            ? 'text-rose-400'
                            : 'text-slate-200'
                        }
                      >
                        {Number.isFinite(separation)
                          ? `${(
                              separation * 1000
                            ).toFixed(0)} m`
                          : '—'}
                      </span>

                      {Number.isFinite(separation) && (
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          ({formatNumber(
                            separation
                          )}{' '}
                          km)
                        </span>
                      )}

                    </td>

                    {/* Relative velocity */}
                    <td className="py-3.5 px-4 text-slate-300">
                      {Number.isFinite(
                        relativeVelocity
                      )
                        ? `${formatNumber(
                            relativeVelocity
                          )} km/s`
                        : '—'}
                    </td>

                    {/* TCA */}
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {formatTCA(
                        event.tca_timestamp
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">

                      <button
                        type="button"
                        onClick={(clickEvent) => {
                          clickEvent.stopPropagation();

                          if (onSelectEvent) {
                            onSelectEvent(
                              eventId
                            );
                          }
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-cyan-600 text-cyan-400 hover:text-white border border-slate-700 hover:border-cyan-500 transition-all font-sans font-medium text-xs inline-flex items-center gap-1"
                      >
                        <span>
                          View Event
                        </span>

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