import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import {
  Bell,
  Clock3,
  Grid3X3,
  Maximize2,
  Play,
  Pause,
  Search,
  Satellite as SatelliteIcon,
  Globe2,
  RotateCcw,
  Orbit,
  Layers,
  Sparkles,
  Radio,
} from "lucide-react";
import * as THREE from "three";
import MissionNavigation from "../components/hud/MissionNavigation";
import apiService, { generate24HourEphemeris } from "../services/api";
import "../index.css";

const EARTH_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

function Earth({ visible }) {
  const texture = useMemo(
    () => new THREE.TextureLoader().load(EARTH_TEXTURE),
    []
  );

  if (!visible) return null;

  return (
    <group>
      <mesh>
        <sphereGeometry args={[2.15, 96, 96]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      {/* Atmospheric blue aura */}
      <mesh scale={1.03}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer faint glow */}
      <mesh scale={1.06}>
        <sphereGeometry args={[2.15, 48, 48]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

function MovingSatellite({ points, running, progress, setProgress }) {
  useFrame((_, delta) => {
    if (!running || !points || points.length < 2) return;
    setProgress((prev) => {
      const next = prev + delta * 0.04;
      return next >= 1 ? 0 : next;
    });
  });

  if (!points || points.length === 0) return null;
  const index = Math.min(
    Math.floor(progress * (points.length - 1)),
    points.length - 1
  );
  const position = points[Math.max(0, index)] || points[0];

  return (
    <group position={position}>
      {/* Satellite Central Bus */}
      <mesh rotation={[0.3, 0.6, 0.2]}>
        <boxGeometry args={[0.18, 0.06, 0.1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.8}
        />
      </mesh>
      {/* Solar Panel Wings */}
      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[0.07, 0.035, 0.32]} />
        <meshStandardMaterial
          color="#1e3a8a"
          emissive="#0284c7"
          emissiveIntensity={0.6}
        />
      </mesh>
      {/* Sensor / Antenna dish */}
      <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[0.04, 0.06, 12]} />
        <meshStandardMaterial color="#94a3b8" metalness={0.8} />
      </mesh>
    </group>
  );
}

function Scene({
  trajectory,
  showEarth,
  showGrid,
  running,
  progress,
  setProgress,
  follow,
  satellite,
}) {
  const scale = 2.15 / 6378;

  // Complete closed 3D orbit ring around Earth
  const orbitRingPoints = useMemo(() => {
    const numNorad = parseInt(satellite?.norad_cat_id ?? satellite?.norad_id ?? 43111, 10) || 43111;
    const incDeg = satellite?.inclination_deg ?? satellite?.inclination ?? (50 + (numNorad % 45));
    const incRad = (incDeg * Math.PI) / 180;
    const altKm = satellite?.perigee_km ?? satellite?.altitude_km ?? (480 + (numNorad % 250));
    const a = 6378.137 + altKm;
    const rScaled = a * scale;
    const raanRad = (((numNorad * 137.5) % 360) * Math.PI) / 180;

    const ring = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      const xOrb = rScaled * Math.cos(theta);
      const yOrb = rScaled * Math.sin(theta);

      const cosRaan = Math.cos(raanRad);
      const sinRaan = Math.sin(raanRad);
      const cosInc = Math.cos(incRad);
      const sinInc = Math.sin(incRad);

      const xEci = xOrb * cosRaan - yOrb * cosInc * sinRaan;
      const yEci = xOrb * sinRaan + yOrb * cosInc * cosRaan;
      const zEci = yOrb * sinInc;

      ring.push(new THREE.Vector3(xEci, yEci, zEci));
    }
    return ring;
  }, [satellite, scale]);

  const points = useMemo(() => {
    if (trajectory && trajectory.length > 0) {
      return trajectory.map(
        (p) =>
          new THREE.Vector3(
            (p.x_km ?? p.x ?? 0) * scale,
            (p.y_km ?? p.y ?? 0) * scale,
            (p.z_km ?? p.z ?? 0) * scale
          )
      );
    }
    return orbitRingPoints;
  }, [trajectory, scale, orbitRingPoints]);

  const currentSatPos = useMemo(() => {
    if (!points || points.length === 0) return null;
    const index = Math.min(
      Math.floor(progress * (points.length - 1)),
      points.length - 1
    );
    return points[Math.max(0, index)];
  }, [points, progress]);

  return (
    <>
      <color attach="background" args={["#030712"]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[7, 8, 9]} intensity={3.5} />
      <directionalLight position={[-6, -4, -5]} intensity={0.6} color="#0284c7" />
      <Stars radius={90} depth={40} count={2600} factor={1.4} fade speed={0.15} />

      {showGrid && (
        <gridHelper
          args={[18, 18, "#0284c7", "#0f172a"]}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -3.15, 0]}
        />
      )}

      <Earth visible={showEarth} />

      {/* Complete Closed 3D Orbital Trajectory Ring */}
      {orbitRingPoints.length > 1 && (
        <Line
          points={orbitRingPoints}
          color="#38bdf8"
          lineWidth={2.2}
          transparent
          opacity={0.9}
        />
      )}

      <MovingSatellite
        points={points}
        running={running}
        progress={progress}
        setProgress={setProgress}
      />

      <OrbitControls
        makeDefault
        enablePan={false}
        minDistance={3.2}
        maxDistance={14}
        autoRotate={false}
        target={
          follow && currentSatPos
            ? [currentSatPos.x, currentSatPos.y, currentSatPos.z]
            : [0, 0, 0]
        }
      />
    </>
  );
}

function MetricRow({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-xs font-mono">
      <span className="text-slate-400">{label}</span>
      <span className="text-slate-100 font-semibold flex items-center gap-1">
        {value ?? "—"}
        {unit && <span className="text-slate-400 text-[10px]">{unit}</span>}
      </span>
    </div>
  );
}

export default function Satellites() {
  const [satellites, setSatellites] = useState([]);
  const [selected, setSelected] = useState(0);
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [trajectory, setTrajectory] = useState([]);
  const [search, setSearch] = useState("");
  const [showEarth, setShowEarth] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [follow, setFollow] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0.38);
  const [visibleCount, setVisibleCount] = useState(8);
  const [expanded, setExpanded] = useState(false);
  const [fullTrajectory, setFullTrajectory] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [timeString, setTimeString] = useState(
    () => new Date().toUTCString().slice(17, 25) + " UTC"
  );
  const viewerContainerRef = useRef(null);

  // Live UTC Clock
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(new Date().toUTCString().slice(17, 25) + " UTC");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial satellites from GET /api/satellites
  useEffect(() => {
    let isMounted = true;
    async function loadSatellites() {
      try {
        setLoadingList(true);
        const data = await apiService.getSatellites();
        if (isMounted && data) {
          setSatellites(data);
          if (data.length > 0) {
            setSelected(0);
          }
        }
      } catch (err) {
        console.error("Failed to load satellites:", err);
      } finally {
        if (isMounted) setLoadingList(false);
      }
    }
    loadSatellites();
    return () => {
      isMounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return satellites
      .filter((s) => {
        const idStr = (s.id || s.name || s.object_name || "").toLowerCase();
        const operatorStr = (s.operator || "").toLowerCase();
        const noradStr = (s.norad_cat_id ?? s.norad_id ?? "").toString();
        const query = search.toLowerCase();
        return (
          idStr.includes(query) ||
          operatorStr.includes(query) ||
          noradStr.includes(query)
        );
      })
      .slice(0, visibleCount);
  }, [satellites, search, visibleCount]);

  const currentSatelliteSummary =
    filtered[selected] || satellites[selected] || null;
  const noradId =
    currentSatelliteSummary?.norad_cat_id ??
    currentSatelliteSummary?.norad_id ??
    currentSatelliteSummary?.id;

  // Fetch satellite details (GET /api/satellites/{norad_cat_id}) & trajectory (GET /api/satellites/{norad_cat_id}/trajectory)
  useEffect(() => {
    if (!noradId) return;
    let isMounted = true;

    async function loadSatelliteData() {
      try {
        setLoadingDetails(true);
        const [detailsData, trajData] = await Promise.all([
          apiService.getSatelliteById(noradId),
          apiService.getSatelliteTrajectory(noradId, currentSatelliteSummary || {}),
        ]);
        if (isMounted) {
          const fullData = detailsData || currentSatelliteSummary;
          setSelectedDetails(fullData);
          const finalTraj =
            trajData && trajData.length >= 20
              ? trajData
              : generate24HourEphemeris(fullData, noradId);
          setTrajectory(finalTraj);
        }
      } catch (err) {
        console.error(`Failed to load data for NORAD ${noradId}:`, err);
      } finally {
        if (isMounted) setLoadingDetails(false);
      }
    }

    loadSatelliteData();
    return () => {
      isMounted = false;
    };
  }, [noradId, currentSatelliteSummary]);

  const satellite = selectedDetails || currentSatelliteSummary || {};

  // Current position & velocity from trajectory at current progress across 24h
  const currentPoint = useMemo(() => {
    if (trajectory && trajectory.length > 0) {
      const idx = Math.min(
        Math.floor(progress * (trajectory.length - 1)),
        trajectory.length - 1
      );
      return trajectory[Math.max(0, idx)];
    }
    return null;
  }, [trajectory, progress]);

  const currX = currentPoint?.x_km ?? currentPoint?.x ?? satellite.x;
  const currY = currentPoint?.y_km ?? currentPoint?.y ?? satellite.y;
  const currZ = currentPoint?.z_km ?? currentPoint?.z ?? satellite.z;
  const currVx = currentPoint?.vx_km_s ?? currentPoint?.vx ?? satellite.vx;
  const currVy = currentPoint?.vy_km_s ?? currentPoint?.vy ?? satellite.vy;
  const currVz = currentPoint?.vz_km_s ?? currentPoint?.vz ?? satellite.vz;

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  const toggleFullscreen = async () => {
    const viewer = viewerContainerRef.current;
    if (!document.fullscreenElement) {
      await viewer?.requestFullscreen?.();
      setExpanded(true);
    } else {
      await document.exitFullscreen?.();
      setExpanded(false);
    }
  };

  const handleProgress = (event) => {
    setProgress(Number(event.target.value));
  };

  // Trajectory table rows spanning the full 24 hours
  const displayedTrajectoryRows = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return [];
    const step = fullTrajectory ? 4 : Math.max(1, Math.floor(trajectory.length / 8));
    const sampledRows = [];
    for (let i = 0; i < trajectory.length; i += step) {
      sampledRows.push(trajectory[i]);
    }
    return sampledRows.map((p, idx) => {
      let timeStr = "";
      if (p.timestamp_utc) {
        try {
          timeStr = new Date(p.timestamp_utc).toISOString().slice(11, 16) + " UTC";
        } catch {
          timeStr = String(p.timestamp_utc);
        }
      } else {
        const totalSecs = Math.floor((idx / sampledRows.length) * 86400);
        const h = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
        const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
        timeStr = `${h}:${m} UTC`;
      }

      const formatVal = (val) => {
        if (typeof val === "number") return val.toFixed(2);
        if (val !== undefined && val !== null && val !== "") return String(val);
        return "—";
      };

      return {
        key: p.timestamp_utc || idx,
        time: timeStr,
        x: formatVal(p.x_km ?? p.x),
        y: formatVal(p.y_km ?? p.y),
        z: formatVal(p.z_km ?? p.z),
        vx: formatVal(p.vx_km_s ?? p.vx),
        vy: formatVal(p.vy_km_s ?? p.vy),
        vz: formatVal(p.vz_km_s ?? p.vz),
      };
    });
  }, [trajectory, fullTrajectory]);

  // Timeline current timestamp string across 24 hours
  const currentTimelineTimestamp = useMemo(() => {
    if (currentPoint?.timestamp_utc) {
      try {
        const d = new Date(currentPoint.timestamp_utc);
        const hours = d.getUTCHours().toString().padStart(2, "0");
        const mins = d.getUTCMinutes().toString().padStart(2, "0");
        const secs = d.getUTCSeconds().toString().padStart(2, "0");
        return `${hours}:${mins}:${secs} UTC`;
      } catch {
        // fallback
      }
    }
    const totalSecs = Math.min(86400, Math.max(0, Math.floor(progress * 86400)));
    const h = Math.floor(totalSecs / 3600).toString().padStart(2, "0");
    const m = Math.floor((totalSecs % 3600) / 60).toString().padStart(2, "0");
    const s = Math.floor(totalSecs % 60).toString().padStart(2, "0");
    return `${h}:${m}:${s} UTC`;
  }, [currentPoint, progress]);

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Fixed Aerospace Navbar matching Astra-Track */}
      <MissionNavigation activeTab="SATELLITES" />

      {/* Main Content Area */}
      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-sans">
              Satellites
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 shadow-sm">
              <Clock3 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{timeString}</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/60 shadow-[0_0_10px_rgba(56,189,248,0.15)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>SGP4 ENGINE ACTIVE</span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            TOP GRID: (1) SATELLITE LIST | (2) 3D VIEWER | (3) LIVE METRICS
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Satellite Catalog List */}
          <div className="lg:col-span-3 glass-panel rounded-xl p-3.5 border border-slate-800 flex flex-col h-[590px] overflow-hidden">
            <div className="relative mb-3">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search satellite, NORAD..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">
              <span className="font-semibold text-slate-300">MONITORED ASSETS</span>
              <span>{satellites.length} objects</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 py-2 pr-1">
              {filtered.map((item, index) => {
                const isChosen = index === selected;
                const displayName =
                  item.object_name ||
                  item.name ||
                  item.id ||
                  `SAT-${item.norad_cat_id || item.norad_id}`;
                const displayNorad =
                  item.norad_cat_id ?? item.norad_id ?? item.id ?? "—";
                const dotColor =
                  index % 3 === 0
                    ? "bg-cyan-400 shadow-[0_0_8px_#38bdf8]"
                    : index % 3 === 1
                    ? "bg-amber-400 shadow-[0_0_8px_#fbbf24]"
                    : "bg-emerald-400 shadow-[0_0_8px_#34d399]";

                return (
                  <button
                    key={item.norad_cat_id || item.norad_id || item.id || index}
                    type="button"
                    onClick={() => {
                      setSelected(index);
                      setProgress(0);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                      isChosen
                        ? "bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_14px_rgba(56,189,248,0.22)]"
                        : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700/80"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${dotColor}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-mono font-bold text-white truncate">
                        {displayName}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-0.5">
                        <span>NORAD {displayNorad}</span>
                        {item.operator && (
                          <span className="text-slate-400 truncate max-w-[80px]">
                            {item.operator}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}

              {filtered.length === 0 && !loadingList && (
                <div className="text-center py-8 text-xs font-mono text-slate-500">
                  No satellites matching query
                </div>
              )}
            </div>

            {visibleCount < satellites.length && (
              <button
                type="button"
                onClick={() => setVisibleCount(satellites.length)}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-800 text-slate-300 hover:text-cyan-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <span>Load All Satellites</span>
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Middle Column: 3D Tracking Orbit Viewer & Scrubber */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            <div
              ref={viewerContainerRef}
              className="relative w-full h-[530px] rounded-xl border border-slate-800 glass-panel overflow-hidden viewer-fullscreen-container shadow-2xl bg-[#030712]"
            >
              {/* Floating Toolbar Buttons */}
              <div className="absolute z-10 top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl">
                <button
                  type="button"
                  onClick={() => setFollow((v) => !v)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    follow
                      ? "bg-cyan-600 text-white font-bold shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Center camera on moving satellite"
                >
                  <SatelliteIcon className="w-3.5 h-3.5" />
                  <span>{follow ? "Following" : "Follow"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEarth((v) => !v)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showEarth
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Toggle Earth Sphere"
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Earth</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrid((v) => !v)}
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showGrid
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                  title="Toggle ECI Grid"
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
                  title="Toggle Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Three.js Canvas */}
              <Canvas camera={{ position: [0, 4.8, 7.3], fov: 45 }}>
                <Scene
                  trajectory={trajectory}
                  showEarth={showEarth}
                  showGrid={showGrid}
                  running={running}
                  progress={progress}
                  setProgress={setProgress}
                  follow={follow}
                  satellite={satellite}
                />
              </Canvas>

              {/* Legend Box */}
              <div className="absolute z-10 bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex flex-col gap-1 shadow-lg">
                <span className="text-slate-400 font-bold tracking-wider text-[9px]">
                  3D TELEMETRY LEGEND
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-full bg-cyan-400 inline-block shadow-[0_0_6px_#38bdf8]" />
                  <span>Selected Satellite</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="w-3 h-0.5 bg-cyan-400 inline-block" />
                  <span>ECI Orbit Path</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  <span>Earth Globe</span>
                </span>
              </div>

              {/* ECI Coordinate Axes Indicator */}
              <div className="absolute z-10 bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 flex items-center gap-2">
                <span className="text-rose-400 font-bold">+X (Vernal)</span>
                <span className="text-emerald-400 font-bold">+Y</span>
                <span className="text-cyan-400 font-bold">+Z (North)</span>
              </div>
            </div>

            {/* Timeline Scrubber Bar */}
            <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center gap-3 font-mono text-xs">
              <button
                type="button"
                onClick={() => setRunning((v) => !v)}
                className="w-8 h-8 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 flex items-center justify-center transition-all shadow-[0_0_10px_rgba(56,189,248,0.2)] flex-shrink-0"
                title={running ? "Pause Orbital Propagation" : "Play Orbital Propagation"}
              >
                {running ? (
                  <Pause className="w-4 h-4 fill-cyan-300" />
                ) : (
                  <Play className="w-4 h-4 fill-cyan-300 ml-0.5" />
                )}
              </button>

              <span className="text-[10px] text-slate-400">00:00</span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={handleProgress}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                aria-label="Orbit propagation time scrubber"
              />

              <span className="text-cyan-300 font-bold text-xs bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                {currentTimelineTimestamp}
              </span>
              <span className="text-[10px] text-slate-400">24:00</span>
            </div>
          </div>

          {/* Right Column: Live Selected Telemetry Panel */}
          <div className="lg:col-span-3 glass-panel rounded-xl p-4 border border-slate-800 flex flex-col h-[590px] overflow-y-auto space-y-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider block mb-1">
                SELECTED ASSET
              </span>
              <h2 className="text-lg font-bold font-mono text-white truncate">
                {satellite?.object_name ||
                  satellite?.name ||
                  satellite?.id ||
                  "—"}
              </h2>
              <span className="inline-block mt-1 px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono font-semibold">
                {satellite?.type || "Primary Monitored Asset"}
              </span>
            </div>

            {/* General Identification */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                OBJECT STATUS
              </span>
              <MetricRow
                label="NORAD ID"
                value={satellite?.norad_cat_id ?? satellite?.norad_id ?? "—"}
              />
              <MetricRow
                label="Object Type"
                value={satellite?.type || "Satellite"}
              />
              <MetricRow
                label="Status"
                value={
                  satellite?.status ||
                  (satellite?.active_threat_level ? "Threat Alert" : "Operational")
                }
              />
              <MetricRow
                label="Operator"
                value={satellite?.operator || "—"}
              />
            </div>

            {/* ECI Position Vector */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                CURRENT POSITION (ECI)
              </span>
              <MetricRow
                label="X Coordinate"
                value={
                  currX !== undefined && typeof currX === "number"
                    ? currX.toFixed(2)
                    : currX ?? "—"
                }
                unit={currX !== undefined ? "km" : ""}
              />
              <MetricRow
                label="Y Coordinate"
                value={
                  currY !== undefined && typeof currY === "number"
                    ? currY.toFixed(2)
                    : currY ?? "—"
                }
                unit={currY !== undefined ? "km" : ""}
              />
              <MetricRow
                label="Z Coordinate"
                value={
                  currZ !== undefined && typeof currZ === "number"
                    ? currZ.toFixed(2)
                    : currZ ?? "—"
                }
                unit={currZ !== undefined ? "km" : ""}
              />
            </div>

            {/* ECI Velocity Vector */}
            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                CURRENT VELOCITY (ECI)
              </span>
              <MetricRow
                label="Velocity Vx"
                value={
                  currVx !== undefined && typeof currVx === "number"
                    ? currVx.toFixed(2)
                    : currVx ?? "—"
                }
                unit={currVx !== undefined ? "km/s" : ""}
              />
              <MetricRow
                label="Velocity Vy"
                value={
                  currVy !== undefined && typeof currVy === "number"
                    ? currVy.toFixed(2)
                    : currVy ?? "—"
                }
                unit={currVy !== undefined ? "km/s" : ""}
              />
              <MetricRow
                label="Velocity Vz"
                value={
                  currVz !== undefined && typeof currVz === "number"
                    ? currVz.toFixed(2)
                    : currVz ?? "—"
                }
                unit={currVz !== undefined ? "km/s" : ""}
              />
            </div>

            {/* Last Ephemeris Update */}
            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">
              <span>LAST PROPAGATION</span>
              <span className="text-slate-200">
                {satellite?.epoch_utc ||
                  satellite?.epoch ||
                  satellite?.last_updated ||
                  "30 May 2026 14:32:18 UTC"}
              </span>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            LOWER SECTION: ORBITAL PARAMETERS & 24H TRAJECTORY TABLE
            ───────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Orbital Parameters & Object Details */}
          <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
              <Orbit className="w-4 h-4 text-cyan-400" />
              <span>SATELLITE ORBITAL & PHYSICAL SPECIFICATIONS</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Keplerian Elements */}
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                <h3 className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mb-2">
                  ORBITAL PARAMETERS
                </h3>
                <MetricRow
                  label="Inclination"
                  value={
                    satellite?.inclination_deg !== undefined
                      ? `${satellite.inclination_deg}°`
                      : satellite?.inclination !== undefined
                      ? typeof satellite.inclination === "number"
                        ? `${satellite.inclination}°`
                        : satellite.inclination
                      : "—"
                  }
                />
                <MetricRow
                  label="RAAN"
                  value={
                    satellite?.raan_deg !== undefined
                      ? `${satellite.raan_deg}°`
                      : satellite?.raan !== undefined
                      ? typeof satellite.raan === "number"
                        ? `${satellite.raan}°`
                        : satellite.raan
                      : "—"
                  }
                />
                <MetricRow
                  label="Eccentricity"
                  value={
                    satellite?.eccentricity !== undefined
                      ? satellite.eccentricity
                      : "—"
                  }
                />
                <MetricRow
                  label="Arg of Perigee"
                  value={
                    satellite?.argument_of_perigee ??
                    satellite?.arg_of_perigee ??
                    satellite?.argumentOfPerigee ??
                    "—"
                  }
                />
                <MetricRow
                  label="Mean Anomaly"
                  value={
                    satellite?.mean_anomaly ??
                    satellite?.meanAnomaly ??
                    satellite?.mean_anomaly_deg ??
                    "—"
                  }
                />
                <MetricRow
                  label="Altitude"
                  value={
                    satellite?.altitude ??
                    (satellite?.apogee_km
                      ? `${satellite.apogee_km} km`
                      : "—")
                  }
                />
              </div>

              {/* Spacecraft Details */}
              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">
                <h3 className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mb-2">
                  OBJECT DETAILS
                </h3>
                <MetricRow
                  label="Spacecraft Mass"
                  value={
                    satellite?.mass ??
                    (satellite?.mass_kg ? `${satellite.mass_kg} kg` : "—")
                  }
                />
                <MetricRow
                  label="Dimensions"
                  value={satellite?.dimensions ?? "—"}
                />
                <MetricRow
                  label="Operating Body"
                  value={satellite?.operator ?? "—"}
                />
                <MetricRow
                  label="Launch Date"
                  value={
                    satellite?.launchDate ??
                    satellite?.launch_date ??
                    (satellite?.epoch_utc
                      ? satellite.epoch_utc.slice(0, 10)
                      : "—")
                  }
                />
                <MetricRow
                  label="Primary Mission"
                  value={satellite?.mission ?? satellite?.type ?? "—"}
                />
                <MetricRow
                  label="Orbital Period"
                  value={
                    satellite?.period_min
                      ? `${satellite.period_min} min`
                      : "—"
                  }
                />
              </div>
            </div>
          </div>

          {/* Right Column: 24-Hour Ephemeris Table */}
          <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>TRAJECTORY EPHEMERIS (24 HOURS)</span>
              </h2>
              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                COORDINATES: ECI (J2000)
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">
              <table className="w-full border-collapse font-mono text-xs text-left">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[10px]">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-2">X (km)</th>
                    <th className="py-2.5 px-2">Y (km)</th>
                    <th className="py-2.5 px-2">Z (km)</th>
                    <th className="py-2.5 px-2">Vx (km/s)</th>
                    <th className="py-2.5 px-2">Vy (km/s)</th>
                    <th className="py-2.5 px-2">Vz (km/s)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedTrajectoryRows.map((row, idx) => (
                    <tr
                      key={row.key || idx}
                      className="hover:bg-slate-900/50 transition-colors text-slate-300"
                    >
                      <td className="py-2 px-3 text-cyan-300 font-semibold">
                        {row.time}
                      </td>
                      <td className="py-2 px-2">{row.x}</td>
                      <td className="py-2 px-2">{row.y}</td>
                      <td className="py-2 px-2">{row.z}</td>
                      <td className="py-2 px-2">{row.vx}</td>
                      <td className="py-2 px-2">{row.vy}</td>
                      <td className="py-2 px-2">{row.vz}</td>
                    </tr>
                  ))}
                  {displayedTrajectoryRows.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-6 text-slate-500 text-xs"
                      >
                        {loadingDetails
                          ? "Loading trajectory ephemeris..."
                          : "No trajectory data points available"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {trajectory.length > 4 && (
              <button
                type="button"
                onClick={() => setFullTrajectory((v) => !v)}
                className="w-full py-1.5 text-center text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                {fullTrajectory
                  ? "Hide Full Trajectory ↑"
                  : `View Full Trajectory (${trajectory.length} points) →`}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
