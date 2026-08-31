import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';
import { Activity } from 'lucide-react';

export default function DistanceChart({ event }) {
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !event || !event.distance_curve) return;

    let curve = event.distance_curve;
    if (typeof curve === 'string') {
      try {
        curve = JSON.parse(curve);
      } catch {
        curve = [];
      }
    }
    if (!curve || !Array.isArray(curve) || curve.length === 0) return;

    const xValues = curve.map((c, i) => c.time_offset_sec !== undefined ? c.time_offset_sec : (c.offset_sec ?? i));
    const yValues = curve.map((c) => c.distance_km ?? c.separation_km ?? 0);

    const mainTrace = {
      x: xValues,
      y: yValues,
      mode: 'lines+markers',
      name: 'Separation Distance (km)',
      line: {
        color: '#38bdf8',
        width: 3,
        shape: 'spline',
      },
      marker: {
        size: 5,
        color: '#0284c7',
      },
      hovertemplate: '<b>Offset: %{x}s</b><br>Distance: %{y:.3f} km<extra></extra>',
      type: 'scatter',
    };

    // Minimum Point Marker at TCA
    const minPoint = curve.find((c) => c.time_offset_sec === 0 || c.offset_sec === 0) || {
      time_offset_sec: 0,
      distance_km: event.minimum_separation_km || 0.184,
    };
    const minX = minPoint.time_offset_sec ?? minPoint.offset_sec ?? 0;
    const minY = minPoint.distance_km ?? minPoint.separation_km ?? (event.minimum_separation_km || 0.184);

    const minTrace = {
      x: [minX],
      y: [minY],
      mode: 'markers+text',
      name: `Min Separation (${(minY * 1000).toFixed(0)}m)`,
      marker: {
        size: 12,
        color: '#f43f5e',
        symbol: 'diamond',
      },
      text: [`TCA: ${(minY * 1000).toFixed(0)}m`],
      textposition: 'top center',
      textfont: {
        family: 'JetBrains Mono',
        color: '#f43f5e',
        size: 11,
      },
      hovertemplate: '<b>Closest Approach (TCA)</b><br>Min Miss: %{y:.3f} km<extra></extra>',
      type: 'scatter',
    };

    const layout = {
      title: {
        text: `Miss Distance Profile Relative to TCA (Δt = 0s)`,
        font: { family: 'Inter, sans-serif', size: 13, color: '#94a3b8' },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.6)',
      margin: { t: 40, r: 25, l: 55, b: 45 },
      xaxis: {
        title: { text: 'Time Offset Relative to TCA (seconds)', font: { family: 'JetBrains Mono', size: 11, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        zerolinecolor: 'rgba(244, 63, 94, 0.4)',
        zerolinewidth: 2,
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 10 },
      },
      yaxis: {
        title: { text: 'Relative Separation (km)', font: { family: 'JetBrains Mono', size: 11, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        zerolinecolor: 'rgba(56, 189, 248, 0.2)',
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 10 },
        type: 'log', // Log scale handles wide separation swings down to hundreds of meters cleanly
      },
      legend: {
        orientation: 'h',
        y: 1.15,
        font: { family: 'JetBrains Mono', color: '#cbd5e1', size: 10 },
      },
      shapes: [
        // 1 km Safety screening threshold dashed line
        {
          type: 'line',
          xref: 'paper',
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
          y: Math.log10(1.0),
          text: '1.0 km Threshold',
          showarrow: false,
          font: { family: 'JetBrains Mono', color: '#f59e0b', size: 10 },
          xanchor: 'right',
        },
      ],
      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    };

    const chartEl = chartRef.current;
    Plotly.newPlot(chartEl, [mainTrace, minTrace], layout, config);

    const handleResize = () => {
      if (chartEl) {
        Plotly.Plots.resize(chartEl);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartEl) {
        Plotly.purge(chartEl);
      }
    };
  }, [event]);

  return (
    <div className="glass-panel rounded-xl border border-slate-800 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white tracking-wide uppercase font-mono">
            Scientific Evidence: Miss Distance Convergence Curve
          </h3>
        </div>
        <div className="text-xs font-mono text-slate-400">
          Relative Velocity: <span className="text-amber-400 font-bold">{event?.relative_velocity_kms} km/s</span>
        </div>
      </div>

      <div className="w-full min-h-[320px] flex-1">
        <div ref={chartRef} className="w-full h-full min-h-[320px]" />
      </div>

      <div className="mt-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs font-mono text-slate-400 flex flex-wrap justify-between gap-2">
        <span>Logarithmic radial distance profile modeled through SGP4 ephemeris propagation</span>
        <span className="text-rose-400 font-medium">TCA Miss Distance: {(event?.minimum_separation_km * 1000).toFixed(0)} meters</span>
      </div>
    </div>
  );
}
