import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  Clock, 
  Satellite, 
  Zap, 
  CheckCircle2, 
  Crosshair, 
  Radio, 
  Flame 
} from 'lucide-react';

export default function EventDetail({ event }) {
  if (!event) return null;

  const isCritical = event.severity === 'CRITICAL';
  const isHigh = event.severity === 'HIGH';

  const nameA = typeof event.object_a === 'object' ? (event.object_a?.name || 'Primary Asset') : (event.object_a || 'Primary Asset');
  const nameB = typeof event.object_b === 'object' ? (event.object_b?.name || 'Threat Object') : (event.object_b || 'Threat Object');

  const objA = typeof event.object_a === 'object' ? event.object_a : {
    name: nameA,
    operator: 'Active Asset',
    norad_id: '—',
    intl_designator: '—',
    type: 'Operational Payload',
    apogee_km: 520,
    perigee_km: 498,
    inclination_deg: 97.5,
  };

  const objB = typeof event.object_b === 'object' ? event.object_b : {
    name: nameB,
    operator: 'Uncontrolled',
    norad_id: '—',
    intl_designator: '—',
    type: 'Debris Fragment',
    source_parent: 'Orbital Debris Catalog',
    apogee_km: 525,
    perigee_km: 495,
    inclination_deg: 97.6,
  };

  const tcaRaw = event.tca_timestamp || event.tca;
  const tcaDate = tcaRaw ? new Date(tcaRaw) : new Date();

  let reasonsList = [];
  if (Array.isArray(event.reasons)) {
    reasonsList = event.reasons;
  } else if (typeof event.reasons === 'string') {
    try {
      reasonsList = JSON.parse(event.reasons);
    } catch {
      reasonsList = [event.reasons];
    }
  }
  if (!reasonsList || reasonsList.length === 0) {
    reasonsList = ['Nominal SGP4 orbital screening and miss distance evaluation'];
  }

  const epochDate = event.epoch || event.epoch_utc || '2026-08-26T12:00:00Z';

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────
          1. WHAT IS HAPPENING?
          ───────────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-5 border border-slate-800 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            QUESTION 1
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            What is happening?
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-white tracking-tight font-mono">
                {nameA} <span className="text-rose-400">⚡</span> {nameB}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase flex items-center gap-1.5 ${
                isCritical 
                  ? 'bg-rose-950/80 text-rose-300 border-rose-600/50 shadow-glow-rose' 
                  : isHigh 
                  ? 'bg-amber-950/80 text-amber-300 border-amber-600/50 shadow-glow-amber' 
                  : 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40'
              }`}>
                {isCritical ? <ShieldAlert className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                {event.severity} SEVERITY
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Orbital Conjunction Event Identifier: <span className="text-cyan-400 font-semibold">{event.id || event.catalog_id}</span>
            </p>
          </div>

          {/* Strict formatting: "Risk Score: XX/100" and "Confidence: XX/100" */}
          <div className="flex items-center gap-4">
            <div className="text-right px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block">Assessment</span>
              <span className="text-lg font-mono font-extrabold text-white">
                Risk Score: <span className={event.risk_score >= 80 ? 'text-rose-400' : 'text-amber-400'}>{event.risk_score}/100</span>
              </span>
            </div>
            <div className="text-right px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block">Data Integrity</span>
              <span className="text-lg font-mono font-extrabold text-white">
                Confidence: <span className="text-emerald-400">{event.confidence}/100</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. WHAT EXACTLY IS HAPPENING?
          ───────────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            QUESTION 2
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            What exactly is happening?
          </h2>
        </div>

        {/* Kinematic metrics ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
              <Crosshair className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-mono block">Minimum Separation</span>
              <span className="text-xl font-bold font-mono text-rose-400">
                {(event.minimum_separation_km * 1000).toFixed(0)} meters
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">({event.minimum_separation_km} km)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-mono block">Relative Encounter Velocity</span>
              <span className="text-xl font-bold font-mono text-amber-400">
                {event.relative_velocity_kms} km/s
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">({(event.relative_velocity_kms * 3600).toFixed(0)} km/h closing)</span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-slate-400 font-mono block">Time of Closest Approach (TCA)</span>
              <span className="text-sm font-bold font-mono text-white">
                {tcaDate.toUTCString().slice(17, 25)} UTC
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">{tcaDate.toISOString().slice(0, 10)}</span>
            </div>
          </div>
        </div>

        {/* Side-by-side Object Specification */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Object A: Primary Asset */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-bold text-white font-mono">OBJECT A (Primary Asset)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                {objA.operator || 'Active Asset'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Common Name:</span>
                <span className="text-white font-semibold">{objA.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">NORAD Catalog ID:</span>
                <span className="text-cyan-400">{objA.norad_id || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">International Designator:</span>
                <span className="text-slate-200">{objA.intl_designator || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Object Classification:</span>
                <span className="text-slate-200">{objA.type || 'Payload'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Orbit (Apogee / Perigee):</span>
                <span className="text-slate-200">{objA.apogee_km || 520} km / {objA.perigee_km || 498} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Inclination:</span>
                <span className="text-slate-200">{objA.inclination_deg || objA.inclination || 97.5}°</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Maneuver Capability:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Active Thrusters Enabled
                </span>
              </div>
            </div>
          </div>

          {/* Object B: Secondary Threat Debris */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-rose-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />
                <h4 className="text-sm font-bold text-white font-mono">OBJECT B (Threat Debris)</h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                {objB.operator || 'UNCONTROLLED'}
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Common Name:</span>
                <span className="text-white font-semibold">{objB.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">NORAD Catalog ID:</span>
                <span className="text-rose-400">{objB.norad_id || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">International Designator:</span>
                <span className="text-slate-200">{objB.intl_designator || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Fragment Parent Origin:</span>
                <span className="text-slate-200">{objB.source_parent || 'Orbital Debris Catalog'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Orbit (Apogee / Perigee):</span>
                <span className="text-slate-200">{objB.apogee_km || 525} km / {objB.perigee_km || 495} km</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">Inclination:</span>
                <span className="text-slate-200">{objB.inclination_deg || objB.inclination || 97.6}°</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Maneuver Capability:</span>
                <span className="text-slate-400 font-semibold">
                  None (Passive Ballistic Drift)
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. WHY IS IT IMPORTANT?
          ───────────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            QUESTION 3
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            Why is it important?
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-rose-400 uppercase mb-1">
              Catastrophic Disruption Risk
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              At a closing velocity of <span className="font-bold text-white">{event.relative_velocity_kms} km/s</span>, kinetic energy transfer exceeds 100 MJ even for sub-kilogram fragments, ensuring total payload destruction and thousands of secondary fragments.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase mb-1">
              Orbital Shell Vulnerability
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Encounter occurs in the <span className="font-bold text-white">{event.orbital_regime || 'LEO Shell'}</span> at <span className="font-bold text-white">{event.altitude_km || 510} km</span> altitude. Fragment dispersal could trigger a localized Kessler cascade affecting neighboring operational satellites.
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase mb-1">
              Action Decision Window
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ground telecommand uplink window closes prior to TCA. If collision avoidance maneuver (CAM) is determined necessary, thruster burn sequence must execute at least one orbital revolution in advance.
            </p>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. WHAT IS THE EVIDENCE?
          ───────────────────────────────────────────────────────────── */}
      <section className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center gap-2 mb-3">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            QUESTION 4
          </span>
          <h2 className="text-base font-bold text-white tracking-wide">
            What is the evidence?
          </h2>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-slate-200 uppercase mb-2 flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              SGP4 Propagated Conjunction Factors:
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              {reasonsList.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0"></span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-500">Propagation Epoch:</span>{' '}
              <span className="text-slate-300">{new Date(epochDate).toUTCString()}</span>
            </div>
            <div>
              <span className="text-slate-500">Sensor Source:</span>{' '}
              <span className="text-cyan-400 font-semibold">{event.source || 'CelesTrak SGP4 Ephemeris'}</span>
            </div>
            <div>
              <span className="text-slate-500">Confidence Metric:</span>{' '}
              <span className="text-emerald-400 font-bold">{event.confidence}/100</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
