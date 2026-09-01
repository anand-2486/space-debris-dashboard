import React, { useMemo } from 'react';

function FieldError({ message }) {
  return (
    <div className="w-full min-h-[500px] flex items-center justify-center rounded-xl border border-rose-800/70 bg-slate-950/90 p-6">
      <div className="max-w-md rounded-xl border border-rose-800/70 bg-slate-900/95 p-6 text-center font-mono">
        <div className="text-xs font-bold text-rose-400 mb-2">
          BACKEND TRAJECTORY ERROR
        </div>

        <p className="text-xs leading-relaxed text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

function normalizeTrajectory(trajectory, label) {
  if (!Array.isArray(trajectory) || trajectory.length < 2) {
    throw new Error(
      `${label} trajectory is missing or contains fewer than 2 valid points.`
    );
  }

  return trajectory.map((point, index) => {
    const x = Number(point?.x_km);
    const y = Number(point?.y_km);
    const z = Number(point?.z_km);

    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(z)
    ) {
      throw new Error(
        `${label} trajectory contains invalid coordinates at point ${index}.`
      );
    }

    if (!point?.timestamp_utc) {
      throw new Error(
        `${label} trajectory is missing timestamp_utc at point ${index}.`
      );
    }

    const timestamp = new Date(point.timestamp_utc);

    if (Number.isNaN(timestamp.getTime())) {
      throw new Error(
        `${label} trajectory contains an invalid timestamp at point ${index}.`
      );
    }

    return {
      ...point,
      x,
      y,
      z,
      timestamp,
    };
  });
}

function findClosestToTCA(trajectory, tcaTimestamp) {
  if (!tcaTimestamp) {
    throw new Error(
      'Backend conjunction response is missing tca_timestamp.'
    );
  }

  const tca = new Date(tcaTimestamp);

  if (Number.isNaN(tca.getTime())) {
    throw new Error(
      'Backend conjunction response contains an invalid tca_timestamp.'
    );
  }

  let closestIndex = 0;
  let smallestDifference = Infinity;

  trajectory.forEach((point, index) => {
    const difference = Math.abs(
      point.timestamp.getTime() - tca.getTime()
    );

    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestIndex = index;
    }
  });

  return closestIndex;
}

export default function Orbit2D({ event }) {
  const result = useMemo(() => {
    try {
      /*
       * These are the REAL arrays exposed by ConjunctionDetail.jsx.
       *
       * They ultimately come from:
       * GET /api/conjunctions/{id}/trajectory
       */
      const trajectoryA = normalizeTrajectory(
        event?.trajectory_a,
        'Object A'
      );

      const trajectoryB = normalizeTrajectory(
        event?.trajectory_b,
        'Object B'
      );

      const tcaIndexA = findClosestToTCA(
        trajectoryA,
        event?.tca_timestamp
      );

      const tcaIndexB = findClosestToTCA(
        trajectoryB,
        event?.tca_timestamp
      );

      /*
       * Use the backend ECI X/Y coordinates directly for the
       * top-down orbital view.
       */
      const allPoints = [
        ...trajectoryA,
        ...trajectoryB,
      ];

      const minX = Math.min(...allPoints.map((p) => p.x));
      const maxX = Math.max(...allPoints.map((p) => p.x));
      const minY = Math.min(...allPoints.map((p) => p.y));
      const maxY = Math.max(...allPoints.map((p) => p.y));

      const padding = 250;

      const widthRange =
        Math.max(maxX - minX, 1) + padding * 2;

      const heightRange =
        Math.max(maxY - minY, 1) + padding * 2;

      const viewSize = 1000;

      const scale = Math.min(
        viewSize / widthRange,
        viewSize / heightRange
      );

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const project = (point) => ({
        x: viewSize / 2 + (point.x - centerX) * scale,
        y: viewSize / 2 - (point.y - centerY) * scale,
      });

      const pointsA = trajectoryA.map(project);
      const pointsB = trajectoryB.map(project);

      const tcaA = pointsA[tcaIndexA];
      const tcaB = pointsB[tcaIndexB];

      if (!tcaA || !tcaB) {
        throw new Error(
          'Unable to locate the backend TCA point in the trajectories.'
        );
      }

      return {
        pointsA,
        pointsB,
        tcaA,
        tcaB,
        error: null,
      };
    } catch (error) {
      return {
        pointsA: [],
        pointsB: [],
        tcaA: null,
        tcaB: null,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid backend trajectory data.',
      };
    }
  }, [
    event?.trajectory_a,
    event?.trajectory_b,
    event?.tca_timestamp,
  ]);

  if (result.error) {
    return <FieldError message={result.error} />;
  }

  const nameA =
    event?.satellite_a?.object_name ||
    event?.object_a ||
    'Object A';

  const nameB =
    event?.satellite_b?.object_name ||
    event?.object_b ||
    'Object B';

  const pointsToString = (points) =>
    points
      .map((point) => `${point.x},${point.y}`)
      .join(' ');

  return (
    <div className="w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950/90">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 border-b border-slate-800 bg-slate-900/80">

        <div>
          <h3 className="text-sm font-bold text-white font-mono">
            2D ORBITAL PROJECTION
          </h3>

          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Backend SGP4 trajectory • ECI X/Y projection
          </p>
        </div>

        <div className="flex items-center gap-4 text-[10px] font-mono">

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-slate-300">
              {nameA}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-300">
              {nameB}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-amber-300">
              TCA
            </span>
          </div>

        </div>
      </div>

      {/* Visualization */}
      <div className="relative w-full aspect-square min-h-[500px] max-h-[800px] bg-[#020617]">

        <svg
          viewBox="0 0 1000 1000"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >

          {/* Grid */}
          <defs>
            <pattern
              id="orbitGrid"
              width="50"
              height="50"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 50"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                opacity="0.12"
              />
            </pattern>
          </defs>

          <rect
            width="1000"
            height="1000"
            fill="url(#orbitGrid)"
            className="text-slate-500"
          />

          {/* Crosshair */}
          <line
            x1="500"
            y1="0"
            x2="500"
            y2="1000"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
            className="text-slate-400"
          />

          <line
            x1="0"
            y1="500"
            x2="1000"
            y2="500"
            stroke="currentColor"
            strokeWidth="1"
            opacity="0.15"
            className="text-slate-400"
          />

          {/* Earth */}
          <circle
            cx="500"
            cy="500"
            r="65"
            fill="currentColor"
            className="text-sky-900"
            opacity="0.65"
          />

          <circle
            cx="500"
            cy="500"
            r="65"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-sky-500"
            opacity="0.7"
          />

          {/* Earth glow */}
          <circle
            cx="500"
            cy="500"
            r="80"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-sky-400"
            opacity="0.12"
          />

          {/* Object A trajectory */}
          <polyline
            points={pointsToString(result.pointsA)}
            fill="none"
            stroke="#22d3ee"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Object B trajectory */}
          <polyline
            points={pointsToString(result.pointsB)}
            fill="none"
            stroke="#fb7185"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />

          {/* Object A TCA point */}
          <circle
            cx={result.tcaA.x}
            cy={result.tcaA.y}
            r="8"
            fill="#22d3ee"
            stroke="#020617"
            strokeWidth="3"
          />

          {/* Object B TCA point */}
          <circle
            cx={result.tcaB.x}
            cy={result.tcaB.y}
            r="8"
            fill="#fb7185"
            stroke="#020617"
            strokeWidth="3"
          />

          {/* TCA connection */}
          <line
            x1={result.tcaA.x}
            y1={result.tcaA.y}
            x2={result.tcaB.x}
            y2={result.tcaB.y}
            stroke="#fbbf24"
            strokeWidth="3"
            strokeDasharray="8 6"
            opacity="0.9"
          />

          {/* TCA center */}
          <circle
            cx={(result.tcaA.x + result.tcaB.x) / 2}
            cy={(result.tcaA.y + result.tcaB.y) / 2}
            r="10"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="2"
            opacity="0.9"
          />

          <circle
            cx={(result.tcaA.x + result.tcaB.x) / 2}
            cy={(result.tcaA.y + result.tcaB.y) / 2}
            r="3"
            fill="#fbbf24"
          />

        </svg>

        {/* Axis labels */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600">
          +Y
        </div>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-600">
          -Y
        </div>

        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-600">
          -X
        </div>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-600">
          +X
        </div>

        {/* TCA telemetry */}
        <div className="absolute bottom-4 left-4 rounded-lg border border-amber-800/60 bg-slate-950/90 px-3 py-2 font-mono">

          <div className="text-[9px] text-amber-400 font-bold mb-1">
            CLOSEST APPROACH
          </div>

          <div className="text-[10px] text-slate-300">
            Backend TCA:{' '}
            <span className="text-white">
              {event.tca_timestamp}
            </span>
          </div>

          <div className="text-[10px] text-slate-500 mt-1">
            Separation:{' '}
            <span className="text-amber-400">
              {Number(event.minimum_separation_km).toFixed(3)} km
            </span>
          </div>

        </div>

        {/* Data source indicator */}
        <div className="absolute bottom-4 right-4 rounded-lg border border-slate-800 bg-slate-950/90 px-3 py-2 font-mono">
          <div className="text-[9px] text-slate-500">
            DATA SOURCE
          </div>

          <div className="text-[10px] text-cyan-400 font-semibold">
            SGP4 / BACKEND API
          </div>
        </div>

      </div>
    </div>
  );
}