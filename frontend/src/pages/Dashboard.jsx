import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import MissionNavigation from '../components/hud/MissionNavigation';
import KPIGrid from '../components/KPIGrid';
import { RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------------------------------------
  // INITIAL DASHBOARD LOAD
  // -------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError(null);

        const data = await apiService.getDashboard();

        if (isMounted) {
          setDashboardData(data || null);
        }
      } catch (err) {
        console.error('Failed to load dashboard telemetry:', err);

        if (isMounted) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              'Unable to retrieve dashboard telemetry from the backend.'
          );
          setDashboardData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------
  // MANUAL REFRESH
  // -------------------------------------------------------

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      setError(null);

      const data = await apiService.getDashboard();

      setDashboardData(data || null);
    } catch (err) {
      console.error('Failed to refresh dashboard telemetry:', err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          'Unable to refresh dashboard telemetry.'
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  // -------------------------------------------------------
  // BACKEND VALUES
  // -------------------------------------------------------

  const conjunctionCount = dashboardData?.conjunction_count ?? 0;

  const severityCounts = {
    critical: dashboardData?.severity_counts?.critical ?? 0,
    high: dashboardData?.severity_counts?.high ?? 0,
    medium: dashboardData?.severity_counts?.medium ?? 0,
    low: dashboardData?.severity_counts?.low ?? 0,
  };

  const hasDashboardData = dashboardData !== null;

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <MissionNavigation activeTab="DASHBOARD" />

      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">

        {/* -------------------------------------------------
            ACTION BAR
        ------------------------------------------------- */}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              isRefreshing || loading
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-700/60 cursor-wait'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border-slate-800 hover:border-cyan-500/50 shadow-sm'
            }`}
            title="Refresh telemetry from /api/dashboard"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-cyan-400 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
            />

            <span>
              {isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}
            </span>
          </button>
        </div>

        {/* -------------------------------------------------
            INITIAL LOADING
        ------------------------------------------------- */}

        {loading && !hasDashboardData && (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4 font-mono text-cyan-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />

            <p className="text-xs">
              Fetching dashboard telemetry...
            </p>

            <p className="text-[10px] text-slate-500">
              GET /api/dashboard
            </p>
          </div>
        )}

        {/* -------------------------------------------------
            INITIAL API ERROR
        ------------------------------------------------- */}

        {!loading && error && !dashboardData && (
          <div className="flex flex-col items-center justify-center min-h-[350px] text-center font-mono">
            <div className="glass-panel max-w-xl w-full p-6 rounded-xl border border-rose-900/60 bg-rose-950/10">
              <div className="flex justify-center mb-4">
                <div className="w-10 h-10 rounded-full bg-rose-950/50 border border-rose-800/70 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                </div>
              </div>

              <h2 className="text-sm font-bold text-rose-300 uppercase tracking-wider">
                Dashboard Telemetry Unavailable
              </h2>

              <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                The frontend could not retrieve data from the FastAPI
                dashboard endpoint.
              </p>

              <div className="mt-4 px-3 py-2 rounded-lg bg-slate-950/70 border border-slate-800 text-left">
                <span className="text-[10px] text-slate-500 block mb-1">
                  BACKEND RESPONSE
                </span>

                <span className="text-xs text-rose-300 break-words">
                  {error}
                </span>
              </div>

              <button
                type="button"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono bg-cyan-950/70 hover:bg-cyan-900/70 border border-cyan-700/60 text-cyan-300 transition-all"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing ? 'animate-spin' : ''
                  }`}
                />

                Retry Connection
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------
            DASHBOARD CONTENT
        ------------------------------------------------- */}

        {!loading && dashboardData && (
          <>
            {/* Refresh error while old data remains visible */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-900/60 bg-amber-950/10 text-xs font-mono text-amber-300">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />

                <span>
                  Latest refresh failed: {error}
                </span>
              </div>
            )}

            {/* -------------------------------------------------
                1. CORE KPI CARDS
            ------------------------------------------------- */}

            <KPIGrid dashboardData={dashboardData} />

            {/* -------------------------------------------------
                2. SEVERITY BREAKDOWN
            ------------------------------------------------- */}

            <div className="glass-panel p-5 rounded-xl border border-slate-800 space-y-3">

              <div className="flex flex-wrap items-center justify-between gap-3">

                <div className="flex items-center gap-2 text-xs font-mono">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />

                  <span className="text-white font-bold tracking-wider uppercase">
                    Orbital Threat Severity Breakdown
                  </span>
                </div>

                <span className="text-[11px] font-mono text-slate-400">
                  {conjunctionCount === 0
                    ? 'No conjunction encounters currently returned by the backend'
                    : `${conjunctionCount} conjunction encounters screened`}
                </span>

              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">

                {/* CRITICAL */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    CRITICAL
                  </span>

                  <span
                    className={`text-base font-mono font-bold ${
                      severityCounts.critical > 0
                        ? 'text-rose-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {severityCounts.critical}
                  </span>
                </div>

                {/* HIGH */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    HIGH
                  </span>

                  <span
                    className={`text-base font-mono font-bold ${
                      severityCounts.high > 0
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {severityCounts.high}
                  </span>
                </div>

                {/* MEDIUM */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    MEDIUM
                  </span>

                  <span className="text-base font-mono font-bold text-slate-300">
                    {severityCounts.medium}
                  </span>
                </div>

                {/* LOW */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">
                    LOW
                  </span>

                  <span className="text-base font-mono font-bold text-slate-300">
                    {severityCounts.low}
                  </span>
                </div>

              </div>
            </div>

            {/* -------------------------------------------------
                3. BACKEND STATUS
            ------------------------------------------------- */}

            <div className="flex flex-wrap items-center justify-between gap-3 px-1 text-[10px] font-mono text-slate-500">

              <span>
                DATA SOURCE: BACKEND API
              </span>

              <span>
                ENDPOINT: /api/dashboard
              </span>

              <span className="text-emerald-500">
                ● LIVE API DATA
              </span>

            </div>
          </>
        )}

      </main>
    </div>
  );
}