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
  Flame,
} from 'lucide-react';

function FieldError({ message }) {
  return (
    <div className="rounded-lg border border-rose-800/70 bg-rose-950/30 p-4 text-xs font-mono text-rose-300">
      <div className="font-bold mb-1">BACKEND DATA ERROR</div>
      <div>{message}</div>
    </div>
  );
}

function parseReasons(value) {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      throw new Error('Conjunction returned an empty reasons array.');
    }
    return value;
  }

  if (typeof value === 'string') {
    let parsed;

    try {
      parsed = JSON.parse(value);
    } catch {
      throw new Error('Conjunction returned an invalid reasons payload.');
    }

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error(
        'Conjunction returned an invalid or empty reasons payload.'
      );
    }

    return parsed;
  }

  throw new Error('Conjunction response is missing the reasons field.');
}

function requireFiniteNumber(value, fieldName) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    throw new Error(
      `Conjunction response is missing or has an invalid ${fieldName}.`
    );
  }

  return number;
}

function requireString(value, fieldName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Conjunction response is missing ${fieldName}.`);
  }

  return value;
}

function formatUTC(timestamp, fieldName) {
  const value = requireString(timestamp, fieldName);
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      `Conjunction response contains an invalid ${fieldName}.`
    );
  }

  return date.toUTCString();
}

function formatTCA(timestamp) {
  const value = requireString(timestamp, 'tca_timestamp');
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(
      'Conjunction response contains an invalid tca_timestamp.'
    );
  }

  const hours = date.getUTCHours().toString().padStart(2, '0');
  const minutes = date.getUTCMinutes().toString().padStart(2, '0');

  const month = date.toLocaleString('en-US', {
    month: 'short',
    timeZone: 'UTC',
  });

  const day = date.getUTCDate();

  return `${hours}:${minutes} UTC (${month} ${day})`;
}

function getObjectName(value, fieldName) {
  if (typeof value === 'string' && value.trim()) {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof value.object_name === 'string' &&
    value.object_name.trim()
  ) {
    return value.object_name;
  }

  if (
    value &&
    typeof value === 'object' &&
    typeof value.name === 'string' &&
    value.name.trim()
  ) {
    return value.name;
  }

  throw new Error(`Conjunction response is missing ${fieldName}.`);
}

function getObjectDetails(value) {
  return value && typeof value === 'object' ? value : null;
}

export default function EventDetail({ event }) {
  if (!event) {
    return (
      <FieldError message="No conjunction event was supplied to EventDetail." />
    );
  }

  let data;

  try {
    const id = requireFiniteNumber(event.id, 'id');

    /*
     * IMPORTANT:
     *
     * event.object_a / event.object_b are NORAD IDs.
     *
     * ConjunctionDetail now fetches the actual satellite records and
     * exposes them as:
     *
     *   event.satellite_a
     *   event.satellite_b
     *
     * Therefore object names/specifications must come from those objects.
     */
    const satelliteA = getObjectDetails(event.satellite_a);
    const satelliteB = getObjectDetails(event.satellite_b);

    const nameA = getObjectName(
      satelliteA || event.object_a,
      'object_a'
    );

    const nameB = getObjectName(
      satelliteB || event.object_b,
      'object_b'
    );

    const tca = formatTCA(event.tca_timestamp);
    const tcaFull = formatUTC(event.tca_timestamp, 'tca_timestamp');

    const minimumSeparationKm = requireFiniteNumber(
      event.minimum_separation_km,
      'minimum_separation_km'
    );

    const relativeVelocityKms = requireFiniteNumber(
      event.relative_velocity_kms,
      'relative_velocity_kms'
    );

    const riskScore = requireFiniteNumber(
      event.risk_score,
      'risk_score'
    );

    const confidence = requireFiniteNumber(
      event.confidence,
      'confidence'
    );

    const reasons = parseReasons(event.reasons);

    /*
     * Satellite metadata comes directly from:
     * /api/satellites/{norad_cat_id}
     */
    const objectADetails = satelliteA;
    const objectBDetails = satelliteB;

    data = {
      id,
      nameA,
      nameB,
      tca,
      tcaFull,
      minimumSeparationKm,
      relativeVelocityKms,
      riskScore,
      confidence,
      reasons,
      objectADetails,
      objectBDetails,

      /*
       * The conjunction endpoint itself does not currently return
       * epoch/source. They are available from the satellite records.
       */
      epoch:
        event.epoch ||
        event.epoch_utc ||
        satelliteA?.epoch_utc ||
        null,

      source:
        event.source ||
        satelliteA?.source_url ||
        null,
    };
  } catch (error) {
    return (
      <FieldError
        message={
          error instanceof Error
            ? error.message
            : 'Invalid conjunction response.'
        }
      />
    );
  }

  const {
    id,
    nameA,
    nameB,
    tca,
    tcaFull,
    minimumSeparationKm,
    relativeVelocityKms,
    riskScore,
    confidence,
    reasons,
    objectADetails,
    objectBDetails,
    epoch,
    source,
  } = data;

  const isCritical = event.severity === 'CRITICAL';
  const isHigh = event.severity === 'HIGH';

  const riskColor =
    riskScore >= 80
      ? 'text-rose-400'
      : riskScore >= 60
      ? 'text-amber-400'
      : 'text-slate-200';

  const epochDisplay = epoch
    ? formatUTC(epoch, 'epoch')
    : null;

  return (
    <div className="space-y-6">

      {/* QUESTION 1 */}
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
                {nameA}{' '}
                <span className="text-rose-400">⚡</span>{' '}
                {nameB}
              </h3>

              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold border uppercase flex items-center gap-1.5 ${
                  isCritical
                    ? 'bg-rose-950/80 text-rose-300 border-rose-600/50 shadow-glow-rose'
                    : isHigh
                    ? 'bg-amber-950/80 text-amber-300 border-amber-600/50 shadow-glow-amber'
                    : 'bg-cyan-950/80 text-cyan-300 border-cyan-600/40'
                }`}
              >
                {isCritical ? (
                  <ShieldAlert className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}

                {event.severity}
                {' SEVERITY'}
              </span>
            </div>

            <p className="text-xs text-slate-400 font-mono">
              Orbital Conjunction Event Identifier:{' '}
              <span className="text-cyan-400 font-semibold">
                {id}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block">
                Assessment
              </span>

              <span className="text-lg font-mono font-extrabold text-white">
                Risk Score:{' '}
                <span className={riskColor}>
                  {riskScore}/100
                </span>
              </span>
            </div>

            <div className="text-right px-4 py-2 rounded-lg bg-slate-950/80 border border-slate-800">
              <span className="text-[11px] text-slate-400 font-mono block">
                Data Integrity
              </span>

              <span className="text-lg font-mono font-extrabold text-white">
                Confidence:{' '}
                <span className="text-emerald-400">
                  {confidence}/100
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* QUESTION 2 */}
      <section className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
            QUESTION 2
          </span>

          <h2 className="text-base font-bold text-white tracking-wide">
            What exactly is happening?
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
              <Crosshair className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-mono block">
                Minimum Separation
              </span>

              <span className="text-xl font-bold font-mono text-rose-400">
                {(minimumSeparationKm * 1000).toFixed(0)} meters
              </span>

              <span className="text-[10px] text-slate-400 font-mono block">
                ({minimumSeparationKm} km)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400">
              <Zap className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-mono block">
                Relative Encounter Velocity
              </span>

              <span className="text-xl font-bold font-mono text-amber-400">
                {relativeVelocityKms} km/s
              </span>

              <span className="text-[10px] text-slate-400 font-mono block">
                ({(relativeVelocityKms * 3600).toFixed(0)} km/h closing)
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/40 text-cyan-400">
              <Clock className="w-5 h-5" />
            </div>

            <div>
              <span className="text-[11px] text-slate-400 font-mono block">
                Time of Closest Approach (TCA)
              </span>

              <span className="text-sm font-bold font-mono text-white">
                {tca}
              </span>

              <span className="text-[10px] text-slate-400 font-mono block">
                {tcaFull.slice(0, 16)}
              </span>
            </div>
          </div>
        </div>

        {/* Object specifications */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* OBJECT A */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-cyan-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-cyan-400" />

                <h4 className="text-sm font-bold text-white font-mono">
                  OBJECT A
                </h4>
              </div>

              {objectADetails?.operator && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {objectADetails.operator}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">

              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">
                  Common Name:
                </span>

                <span className="text-white font-semibold">
                  {nameA}
                </span>
              </div>

              {objectADetails?.norad_cat_id != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    NORAD Catalog ID:
                  </span>

                  <span className="text-cyan-400">
                    {objectADetails.norad_cat_id}
                  </span>
                </div>
              )}

              {objectADetails?.norad_id != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    NORAD Catalog ID:
                  </span>

                  <span className="text-cyan-400">
                    {objectADetails.norad_id}
                  </span>
                </div>
              )}

              {objectADetails?.intl_designator && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    International Designator:
                  </span>

                  <span className="text-slate-200">
                    {objectADetails.intl_designator}
                  </span>
                </div>
              )}

              {objectADetails?.type && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    Object Classification:
                  </span>

                  <span className="text-slate-200">
                    {objectADetails.type}
                  </span>
                </div>
              )}

              {objectADetails?.inclination != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    Inclination:
                  </span>

                  <span className="text-slate-200">
                    {objectADetails.inclination}°
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* OBJECT B */}
          <div className="p-4 rounded-lg bg-slate-900/60 border border-rose-500/30">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-400" />

                <h4 className="text-sm font-bold text-white font-mono">
                  OBJECT B
                </h4>
              </div>

              {objectBDetails?.operator && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                  {objectBDetails.operator}
                </span>
              )}
            </div>

            <div className="space-y-2 text-xs font-mono">

              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-400">
                  Common Name:
                </span>

                <span className="text-white font-semibold">
                  {nameB}
                </span>
              </div>

              {objectBDetails?.norad_cat_id != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    NORAD Catalog ID:
                  </span>

                  <span className="text-rose-400">
                    {objectBDetails.norad_cat_id}
                  </span>
                </div>
              )}

              {objectBDetails?.norad_id != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    NORAD Catalog ID:
                  </span>

                  <span className="text-rose-400">
                    {objectBDetails.norad_id}
                  </span>
                </div>
              )}

              {objectBDetails?.intl_designator && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    International Designator:
                  </span>

                  <span className="text-slate-200">
                    {objectBDetails.intl_designator}
                  </span>
                </div>
              )}

              {objectBDetails?.type && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    Object Classification:
                  </span>

                  <span className="text-slate-200">
                    {objectBDetails.type}
                  </span>
                </div>
              )}

              {objectBDetails?.inclination != null && (
                <div className="flex justify-between py-1 border-b border-slate-800/50">
                  <span className="text-slate-400">
                    Inclination:
                  </span>

                  <span className="text-slate-200">
                    {objectBDetails.inclination}°
                  </span>
                </div>
              )}

            </div>
          </div>

        </div>
      </section>

      {/* QUESTION 3 */}
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
              Collision Risk
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              The conjunction has a minimum separation of{' '}
              <span className="font-bold text-white">
                {minimumSeparationKm} km
              </span>{' '}
              and a relative encounter velocity of{' '}
              <span className="font-bold text-white">
                {relativeVelocityKms} km/s
              </span>
              .
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-amber-400 uppercase mb-1">
              Risk Assessment
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              The backend risk engine classified this event as{' '}
              <span className="font-bold text-white">
                {event.severity}
              </span>{' '}
              with a risk score of{' '}
              <span className="font-bold text-white">
                {riskScore}/100
              </span>
              .
            </p>
          </div>

          <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase mb-1">
              Decision Window
            </h4>

            <p className="text-xs text-slate-300 leading-relaxed">
              Time of closest approach is{' '}
              <span className="font-bold text-white">
                {tca}
              </span>
              . Any operational decision must therefore be evaluated
              against the actual TCA supplied by the conjunction
              calculation.
            </p>
          </div>

        </div>
      </section>

      {/* QUESTION 4 */}
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
              Backend Risk Factors:
            </h4>

            <ul className="space-y-2 text-xs text-slate-300 font-mono">
              {reasons.map((reason, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />

                  <span>
                    {String(reason)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-3">

            <div>
              <span className="text-slate-500">
                Propagation Epoch:
              </span>{' '}

              {epochDisplay ? (
                <span className="text-slate-300">
                  {epochDisplay}
                </span>
              ) : (
                <span className="text-amber-400">
                  Not supplied by conjunction endpoint
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500">
                Sensor Source:
              </span>{' '}

              {source ? (
                <span className="text-cyan-400 font-semibold">
                  {source}
                </span>
              ) : (
                <span className="text-amber-400">
                  Not supplied by conjunction endpoint
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-500">
                Confidence Metric:
              </span>{' '}

              <span className="text-emerald-400 font-bold">
                {confidence}/100
              </span>
            </div>

          </div>

        </div>
      </section>

    </div>
  );
}