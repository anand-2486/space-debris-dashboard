import React, { useState, useEffect } from 'react';
import apiService from '../services/api';
import MissionNavigation from '../components/hud/MissionNavigation';
import KPIGrid from '../components/KPIGrid';
import { RefreshCw, ShieldCheck } from 'lucide-react';

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboard() {
      try {
        setLoading(true);
        const data = await apiService.getDashboard();
        if (isMounted) {
          setDashboardData(data || null);
        }
      } catch (err) {
        console.error('Failed to load /api/dashboard telemetry:', err);
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

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      const data = await apiService.getDashboard();
      if (data) {
        setDashboardData(data);
      }
    } catch (err) {
      console.error('Failed to refresh dashboard data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const conjunctionCount = dashboardData?.conjunction_count ?? 0;
  const severityCounts = dashboardData?.severity_counts || {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  };

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Fixed Aerospace Navbar */}
      <MissionNavigation activeTab="DASHBOARD" />

      {/* Main Content Area */}
      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">
        {/* Top Minimal Action Bar */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all border ${
              isRefreshing
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
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Telemetry'}</span>
          </button>
        </div>

        {loading && !dashboardData ? (
          <div className="flex flex-col items-center justify-center min-h-[350px] space-y-4 font-mono text-cyan-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Fetching Dashboard Telemetry (/api/dashboard)...</p>
          </div>
        ) : (
          <>
            {/* 1. CORE TELEMETRY METRIC CARDS (Monitored Satellites & Active Conjunctions) */}
            <KPIGrid dashboardData={dashboardData} />

            {/* 2. SEVERITY LEVEL BREAKDOWN STATUS PANEL */}
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
                    ? 'All catalog orbits nominal • Zero active collision alerts'
                    : `${conjunctionCount} conjunction encounters screened`}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                {/* Critical */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">CRITICAL</span>
                  <span
                    className={`text-base font-mono font-bold ${
                      severityCounts.critical > 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {severityCounts.critical ?? 0}
                  </span>
                </div>

                {/* High */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">HIGH</span>
                  <span
                    className={`text-base font-mono font-bold ${
                      severityCounts.high > 0 ? 'text-amber-400' : 'text-slate-300'
                    }`}
                  >
                    {severityCounts.high ?? 0}
                  </span>
                </div>

                {/* Medium */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">MEDIUM</span>
                  <span className="text-base font-mono font-bold text-slate-300">
                    {severityCounts.medium ?? 0}
                  </span>
                </div>

                {/* Low */}
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">LOW</span>
                  <span className="text-base font-mono font-bold text-slate-300">
                    {severityCounts.low ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
