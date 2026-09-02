import React, { useEffect, useRef, useMemo } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Activity } from 'lucide-react';

function FieldError({ message }) {
  return (
    <div className="glass-panel rounded-xl border border-rose-800/70 p-5">
      <div className="text-xs font-mono">
        <div className="font-bold text-rose-400 mb-2">
          BACKEND DISTANCE CURVE ERROR
        </div>

        <div className="text-slate-400">
          {message}
        </div>
      </div>
    </div>
  );
}

function parseDistanceCurve(value) {
  let curve = value;

  if (typeof curve === 'string') {
    try {
      curve = JSON.parse(curve);
    } catch {
      throw new Error(
        'distance_curve returned by the backend is not valid JSON.'
      );
    }
  }

  if (!Array.isArray(curve) || curve.length === 0) {
    throw new Error(
      'Conjunction response is missing a valid distance_curve.'
    );
  }

  const distances = curve.map((value, index) => {
    const distance = Number(value);

    if (!Number.isFinite(distance) || distance <= 0) {
      throw new Error(
        `distance_curve contains an invalid distance at point ${index}.`
      );
    }

    return distance;
  });

  return distances;
}

export default function DistanceChart({ event }) {
  const chartRef = useRef(null);

  const chartData = useMemo(() => {
    try {
      const distances = parseDistanceCurve(event?.distance_curve);

      const minimumSeparation = Number(
        event?.minimum_separation_km
      );

      if (
        !Number.isFinite(minimumSeparation) ||
        minimumSeparation <= 0
      ) {
        throw new Error(
          'Conjunction response is missing a valid minimum_separation_km.'
        );
      }

      /*
       * Backend conjunction refinement samples:
       *
       * TCA - 10 min
       * ...
       * TCA
       * ...
       * TCA + 10 min
       *
       * at 1-minute intervals.
       *
       * Therefore the curve is represented relative to TCA
       * using a 60-second sampling interval.
       */
      const midpoint = Math.floor(distances.length / 2);

      const xValues = distances.map(
        (_, index) => (index - midpoint) * 60
      );

      /*
       * Find the actual minimum contained in the backend curve.
       * Do NOT substitute a fabricated value.
       */
      let minimumCurveIndex = 0;

      for (let i = 1; i < distances.length; i += 1) {
        if (distances[i] < distances[minimumCurveIndex]) {
          minimumCurveIndex = i;
        }
      }

      return {
        distances,
        xValues,
        minimumCurveIndex,
        minimumCurveDistance: distances[minimumCurveIndex],
        minimumSeparation,
        error: null,
      };
    } catch (error) {
      return {
        distances: [],
        xValues: [],
        minimumCurveIndex: -1,
        minimumCurveDistance: null,
        minimumSeparation: null,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid backend distance curve.',
      };
    }
  }, [event?.distance_curve, event?.minimum_separation_km]);

  useEffect(() => {
    if (
      !chartRef.current ||
      chartData.error ||
      chartData.distances.length === 0
    ) {
      return;
    }

    const chartEl = chartRef.current;

    const mainTrace = {
      x: chartData.xValues,
      y: chartData.distances,
      mode: 'lines+markers',
      name: 'Separation Distance',
      line: {
        color: '#38bdf8',
        width: 3,
        shape: 'linear',
      },
      marker: {
        size: 5,
        color: '#0284c7',
      },
      hovertemplate:
        '<b>Δt: %{x}s</b><br>' +
        'Distance: %{y:.3f} km' +
        '<extra></extra>',
      type: 'scatter',
    };

    const tcaX =
      chartData.xValues[chartData.minimumCurveIndex];

    const tcaY =
      chartData.distances[chartData.minimumCurveIndex];

    const minTrace = {
      x: [tcaX],
      y: [tcaY],
      mode: 'markers+text',
      name: 'Minimum Distance',
      marker: {
        size: 12,
        color: '#f43f5e',
        symbol: 'diamond',
      },
      text: [
        `TCA: ${tcaY.toFixed(3)} km`,
      ],
      textposition: 'top center',
      textfont: {
        family: 'JetBrains Mono',
        color: '#f43f5e',
        size: 11,
      },
      hovertemplate:
        '<b>Closest Approach (TCA)</b><br>' +
        'Distance: %{y:.3f} km' +
        '<extra></extra>',
      type: 'scatter',
    };

    const layout = {
      title: {
        text: 'Miss Distance Profile Relative to TCA',
        font: {
          family: 'Inter, sans-serif',
          size: 13,
          color: '#94a3b8',
        },
      },

      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.6)',

      margin: {
        t: 40,
        r: 25,
        l: 55,
        b: 50,
      },

      xaxis: {
        title: {
          text: 'Time Offset Relative to TCA (seconds)',
          font: {
            family: 'JetBrains Mono',
            size: 11,
            color: '#64748b',
          },
        },

        gridcolor: 'rgba(56, 189, 248, 0.1)',

        zeroline: true,
        zerolinecolor: 'rgba(244, 63, 94, 0.4)',
        zerolinewidth: 2,

        tickfont: {
          family: 'JetBrains Mono',
          color: '#94a3b8',
          size: 10,
        },
      },

      yaxis: {
        title: {
          text: 'Relative Separation (km)',
          font: {
            family: 'JetBrains Mono',
            size: 11,
            color: '#64748b',
          },
        },

        gridcolor: 'rgba(56, 189, 248, 0.1)',

        tickfont: {
          family: 'JetBrains Mono',
          color: '#94a3b8',
          size: 10,
        },

        type: 'log',
      },

      legend: {
        orientation: 'h',
        y: 1.15,

        font: {
          family: 'JetBrains Mono',
          color: '#cbd5e1',
          size: 10,
        },
      },

      shapes: [
        {
          type: 'line',
          xref: 'x',
          yref: 'paper',

          x0: 0,
          x1: 0,

          y0: 0,
          y1: 1,

          line: {
            color: '#f43f5e',
            width: 1.5,
            dash: 'dash',
          },
        },

        {
          type: 'line',
          xref: 'paper',
          yref: 'y',

          x0: 0,
          x1: 1,

          y0: 1.0,
          y1: 1.0,

          line: {
            color: '#f59e0b',
            width: 1.5,
            dash: 'dashdot',
          },
        },
      ],

      annotations: [
        {
          xref: 'paper',
          yref: 'y',

          x: 0.98,
          y: 1.0,

          text: '1.0 km Threshold',

          showarrow: false,

          font: {
            family: 'JetBrains Mono',
            color: '#f59e0b',
            size: 10,
          },

          xanchor: 'right',
        },
      ],

      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,

      modeBarButtonsToRemove: [
        'lasso2d',
        'select2d',
      ],
    };

    Plotly.newPlot(
      chartEl,
      [mainTrace, minTrace],
      layout,
      config
    );

    const handleResize = () => {
      if (chartEl) {
        Plotly.Plots.resize(chartEl);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener(
        'resize',
        handleResize
      );

      if (chartEl) {
        Plotly.purge(chartEl);
      }
    };
  }, [chartData]);

  if (chartData.error) {
    return <FieldError message={chartData.error} />;
  }

  return (
    <div className="glass-panel rounded-xl border border-slate-800 p-4 flex flex-col">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-800 pb-3">

        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />

          <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
            Scientific Evidence: Miss Distance Convergence Curve
          </h3>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Relative Velocity:{' '}
          <span className="text-amber-400 font-bold">
            {Number(event.relative_velocity_kms).toFixed(3)} km/s
          </span>
        </div>

      </div>

      {/* Chart */}
      <div className="w-full min-h-[320px] flex-1">
        <div
          ref={chartRef}
          className="w-full h-full min-h-[320px]"
        />
      </div>

      {/* Evidence footer */}
      <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap justify-between gap-2">

        <span>
          Distance curve from backend conjunction refinement
        </span>

        <span className="text-rose-400 font-medium">
          TCA Minimum:{' '}
          {chartData.minimumCurveDistance.toFixed(3)} km
        </span>

      </div>

    </div>
  );
}