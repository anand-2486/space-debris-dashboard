import React, { useEffect, useRef } from 'react';
import Plotly from 'plotly.js-dist-min';

export default function Orbit2D({ event }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !event) return;

    const trajA = event.trajectory_a || event.trajectories?.object_a || [];
    const trajB = event.trajectory_b || event.trajectories?.object_b || [];

    const nameA = typeof event.object_a === 'object' ? (event.object_a?.name || 'Primary Asset') : (event.object_a || 'Primary Asset');
    const nameB = typeof event.object_b === 'object' ? (event.object_b?.name || 'Threat Object') : (event.object_b || 'Threat Object');

    // 2D Projection: X vs Y in orbital plane
    const traceA = {
      x: trajA.map((p) => p.x_km ?? p.x),
      y: trajA.map((p) => p.y_km ?? p.y),
      mode: 'lines+markers',
      name: `${nameA} (Asset)`,
      line: { color: '#38bdf8', width: 3 },
      marker: { size: 6, color: '#38bdf8' },
      type: 'scatter',
    };

    const traceB = {
      x: trajB.map((p) => p.x_km ?? p.x),
      y: trajB.map((p) => p.y_km ?? p.y),
      mode: 'lines+markers',
      name: `${nameB} (Threat)`,
      line: { color: '#f43f5e', width: 3, dash: 'dot' },
      marker: { size: 6, color: '#f43f5e' },
      type: 'scatter',
    };

    // TCA intersection marker
    const tcaPointA = trajA[Math.floor(trajA.length / 2)] || { x: 0, y: 0 };
    const tcaX = tcaPointA.x_km ?? tcaPointA.x ?? 0;
    const tcaY = tcaPointA.y_km ?? tcaPointA.y ?? 0;
    const traceTCA = {
      x: [tcaX],
      y: [tcaY],
      mode: 'markers+text',
      name: 'Projected TCA',
      marker: { size: 14, color: '#f59e0b', symbol: 'cross' },
      text: ['TCA'],
      textposition: 'top right',
      textfont: { family: 'JetBrains Mono', color: '#f59e0b', size: 11 },
      type: 'scatter',
    };

    const layout = {
      title: {
        text: `Planar Orbital Projection (ECI Coordinates): ${nameA} vs ${nameB}`,
        font: { family: 'Inter, sans-serif', size: 13, color: '#94a3b8' },
      },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.6)',
      margin: { t: 40, r: 20, l: 50, b: 40 },
      xaxis: {
        title: { text: 'ECI X (km)', font: { family: 'JetBrains Mono', size: 11, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        zerolinecolor: 'rgba(56, 189, 248, 0.2)',
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 10 },
      },
      yaxis: {
        title: { text: 'ECI Y (km)', font: { family: 'JetBrains Mono', size: 11, color: '#64748b' } },
        gridcolor: 'rgba(56, 189, 248, 0.1)',
        zerolinecolor: 'rgba(56, 189, 248, 0.2)',
        tickfont: { family: 'JetBrains Mono', color: '#94a3b8', size: 10 },
      },
      legend: {
        orientation: 'h',
        y: 1.15,
        font: { family: 'JetBrains Mono', color: '#cbd5e1', size: 10 },
      },
      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
    };

    const container = containerRef.current;
    Plotly.newPlot(container, [traceA, traceB, traceTCA], layout, config);

    const handleResize = () => {
      if (container) {
        Plotly.Plots.resize(container);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) {
        Plotly.purge(container);
      }
    };
  }, [event]);

  return (
    <div style={{ width: '100%', height: '100%', minHeight: '600px' }} className="w-full h-full flex flex-col">
      <div ref={containerRef} className="w-full flex-1 min-h-[520px]" />
      <div className="text-[11px] font-mono text-slate-400 p-2 bg-slate-900/60 border-t border-slate-800 flex justify-between">
        <span>Coordinate System: Earth-Centered Inertial (J2000 ECI)</span>
        <span>Sampling: SGP4 Ephemeris Propagation</span>
      </div>
    </div>
  );
}
