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
    let isMounted = true;

    async function loadEventData() {
      try {
        setLoading(true);
        setError(null);

        // First get the conjunction itself.
        const eventData = await apiService.getConjunctionById(id);

        if (!eventData) {
          throw new Error(`Conjunction ${id} was not returned by the backend.`);
        }

        /*
         * object_a and object_b are NORAD catalog IDs.
         * Fetch their actual satellite metadata from the satellite endpoint.
         */
        const [eventsList, trajectoryData, satelliteA, satelliteB] =
          await Promise.all([
            apiService.getConjunctions(),
            apiService.getConjunctionTrajectory(id),
            apiService.getSatelliteById(eventData.object_a),
            apiService.getSatelliteById(eventData.object_b),
          ]);

        if (!isMounted) return;

        /*
         * Keep only data that actually came from backend endpoints.
         *
         * The conjunction endpoint provides the conjunction information.
         * The satellite endpoints provide epoch/source/retrieval metadata
         * for Object A and Object B.
         * The trajectory endpoint provides the conjunction trajectories.
         */
        const completeEvent = {
          ...eventData,

          satellite_a: satelliteA,
          satellite_b: satelliteB,

          trajectories: trajectoryData,
        };

        setEvent(completeEvent);
        setAllEvents(sortDangerToLow(eventsList));
      } catch (err) {
        console.error('Failed to load conjunction event:', err);

        if (isMounted) {
          setError(
            err?.response?.data?.detail ||
              err?.message ||
              'Failed to load conjunction event.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (id) {
      loadEventData();
    }

    return () => {
      isMounted = false;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      <MissionNavigation activeTab="CONJUNCTIONS" />

      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4 font-mono text-cyan-400">
            <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>

            <p className="text-xs">
              Loading Conjunction Telemetry (GET /api/conjunctions/{id})...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="glass-panel rounded-xl p-8 border border-rose-800 text-center space-y-4 max-w-lg mx-auto mt-10 font-mono">
            <h2 className="text-lg font-bold text-rose-400">
              Conjunction Event Could Not Be Loaded
            </h2>

            <p className="text-xs text-slate-400">
              {error}
            </p>

            <button
              type="button"
              onClick={() => navigate('/conjunctions')}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono border border-slate-700"
            >
              Return to Conjunctions
            </button>
          </div>
        )}

        {/* Loaded Event */}
        {!loading && !error && event && (
          <>
            {/* Navigation Breadcrumb & Event Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">

                <button
                  type="button"
                  onClick={() => navigate('/conjunctions')}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 transition-colors p-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Conjunctions</span>
                </button>

                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

                <span className="text-slate-300">
                  Analysis
                </span>

                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

                <span className="text-white font-bold">
                  {event.id}
                </span>
              </div>

              {/* Quick Event Selector */}
              <div className="flex items-center gap-3">

                <label className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Switch Event:</span>
                </label>

                <select
                  value={event.id}
                  onChange={(e) =>
                    navigate(`/conjunctions/${e.target.value}`)
                  }
                  className="bg-slate-900 border border-slate-700 text-xs font-mono rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {allEvents.map((evt) => (
                    <option key={evt.id} value={evt.id}>
                      {evt.id} — {evt.object_a} vs {evt.object_b} ({evt.severity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Data Freshness */}
            <DataFreshness
              eventEpoch={event.satellite_a.epoch_utc}
              retrievedAt={event.satellite_a.retrieved_at}
              source={event.satellite_a.source_url}
            />

            {/* Risk / Operational Information */}
            <EventDetail event={event} />

            {/* Orbit Visualization */}
            <section className="mt-8">
              <OrbitViewer event={event} />
            </section>

            {/* Miss Distance Curve */}
            <section className="mt-8">
              <DistanceChart event={event} />
            </section>
          </>
        )}
      </main>
    </div>
  );
}