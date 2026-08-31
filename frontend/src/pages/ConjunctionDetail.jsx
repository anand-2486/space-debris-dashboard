import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import MissionNavigation from '../components/hud/MissionNavigation';
import EventDetail from '../components/EventDetail';
import OrbitViewer from '../components/OrbitViewer';
import DistanceChart from '../components/DistanceChart';
import DataFreshness from '../components/DataFreshness';
import { ArrowLeft, ChevronRight, Compass } from 'lucide-react';

import { sortDangerToLow } from './Conjunctions';

export default function ConjunctionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadEventData() {
      try {
        setLoading(true);
        setError(null);
        const [eventData, eventsList, trajData] = await Promise.all([
          apiService.getConjunctionById(id),
          apiService.getConjunctions(),
          apiService.getConjunctionTrajectory(id),
        ]);
        if (eventData) {
          if (trajData && !eventData.trajectories) {
            eventData.trajectories = trajData;
          }
          setEvent(eventData);
        }
        setAllEvents(sortDangerToLow(eventsList || []));
      } catch (err) {
        console.error('Failed to load conjunction event:', err);
        setError(err.message || 'Event not found in catalog');
      } finally {
        setLoading(false);
      }
    }
    if (id) {
      loadEventData();
    }
  }, [id]);

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Fixed Aerospace Navbar */}
      <MissionNavigation activeTab="CONJUNCTIONS" />

      {/* Main Content */}
      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 font-mono text-cyan-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs">Propagating SGP4 Orbital Conjunction Telemetry (GET /api/conjunctions/{id})...</p>
          </div>
        ) : error || !event ? (
          <div className="glass-panel rounded-xl p-8 border border-rose-800 text-center space-y-4 max-w-lg mx-auto mt-10 font-mono">
            <h2 className="text-lg font-bold text-rose-400">Conjunction Event Not Found</h2>
            <p className="text-xs text-slate-400">{error || `Identifier ${id} does not exist in the active catalog.`}</p>
            <button
              onClick={() => navigate('/conjunctions')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono border border-slate-700"
            >
              Return to Conjunctions
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Breadcrumb & Quick Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <button
                  onClick={() => navigate('/conjunctions')}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Conjunctions</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-slate-300">Analysis</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="text-white font-bold">{event.id || event.catalog_id}</span>
              </div>

              {/* Quick event selector dropdown */}
              <div className="flex items-center gap-3">
                <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Event:</span>
                </label>
                <select
                  value={event.id || event.catalog_id}
                  onChange={(e) => navigate(`/conjunctions/${e.target.value}`)}
                  className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {allEvents.map((evt) => {
                    const evtId = evt.id || evt.catalog_id;
                    const nameA = evt.object_a?.name || evt.object_a || 'Asset';
                    const nameB = evt.object_b?.name || evt.object_b || 'Debris';
                    return (
                      <option key={evtId} value={evtId}>
                        {evtId} — {nameA} vs {nameB} ({evt.severity})
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Telemetry Data Freshness Ribbon */}
            <DataFreshness
              eventEpoch={event.epoch}
              retrievedAt={event.retrieved_at}
              source={event.source}
            />

            {/* 1. Risk Information & 4 Operational Answers */}
            <EventDetail event={event} />

            {/* 2. 3D / 2D Scientific Orbit Visualization */}
            <section className="mt-8">
              <OrbitViewer event={event} />
            </section>

            {/* 3. Miss Distance Convergence Curve */}
            <section className="mt-8">
              <DistanceChart event={event} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}
