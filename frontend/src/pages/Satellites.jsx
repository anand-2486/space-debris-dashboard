import React, { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import {
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
} from "lucide-react";
import * as THREE from "three";
import MissionNavigation from "../components/hud/MissionNavigation";
import apiService from "../services/api";
import "../index.css";

const EARTH_TEXTURE =
  "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg";

// ---------------------------------------------------------
// EARTH
// ---------------------------------------------------------

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

      <mesh scale={1.03}>
        <sphereGeometry args={[2.15, 64, 64]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

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

// ---------------------------------------------------------
// MOVING SATELLITE
// ---------------------------------------------------------

function MovingSatellite({
  points,
  running,
  progress,
  setProgress,
}) {
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
      <mesh rotation={[0.3, 0.6, 0.2]}>
        <boxGeometry args={[0.18, 0.06, 0.1]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive="#38bdf8"
          emissiveIntensity={1.8}
        />
      </mesh>

      <mesh position={[0, 0, 0.12]}>
        <boxGeometry args={[0.07, 0.035, 0.32]} />
        <meshStandardMaterial
          color="#1e3a8a"
          emissive="#0284c7"
          emissiveIntensity={0.6}
        />
      </mesh>

      <mesh
        position={[0.1, 0, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[0.04, 0.06, 12]} />
        <meshStandardMaterial
          color="#94a3b8"
          metalness={0.8}
        />
      </mesh>
    </group>
  );
}

// ---------------------------------------------------------
// 3D SCENE
// ---------------------------------------------------------

function Scene({
  trajectory,
  showEarth,
  showGrid,
  running,
  progress,
  setProgress,
  follow,
}) {
  const scale = 2.15 / 6378;

  const points = useMemo(() => {
    if (!trajectory || trajectory.length === 0) return [];

    return trajectory.map(
      (point) =>
        new THREE.Vector3(
          point.x_km * scale,
          point.y_km * scale,
          point.z_km * scale
        )
    );
  }, [trajectory]);

  const currentSatPos = useMemo(() => {
    if (!points.length) return null;

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

      <directionalLight
        position={[7, 8, 9]}
        intensity={3.5}
      />

      <directionalLight
        position={[-6, -4, -5]}
        intensity={0.6}
        color="#0284c7"
      />

      <Stars
        radius={90}
        depth={40}
        count={2600}
        factor={1.4}
        fade
        speed={0.15}
      />

      {showGrid && (
        <gridHelper
          args={[18, 18, "#0284c7", "#0f172a"]}
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, -3.15, 0]}
        />
      )}

      <Earth visible={showEarth} />

      {/* ONLY backend-provided trajectory */}
      {points.length > 1 && (
        <Line
          points={points}
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
            ? [
                currentSatPos.x,
                currentSatPos.y,
                currentSatPos.z,
              ]
            : [0, 0, 0]
        }
      />
    </>
  );
}

// ---------------------------------------------------------
// METRIC ROW
// ---------------------------------------------------------

function MetricRow({ label, value, unit }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60 text-xs font-mono">
      <span className="text-slate-400">{label}</span>

      <span className="text-slate-100 font-semibold flex items-center gap-1">
        {value ?? "—"}

        {unit && (
          <span className="text-slate-400 text-[10px]">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------
// SATELLITES PAGE
// ---------------------------------------------------------

export default function Satellites() {
  const [satellites, setSatellites] = useState([]);
  const [selectedNoradId, setSelectedNoradId] = useState(null);

  const [selectedDetails, setSelectedDetails] = useState(null);
  const [trajectory, setTrajectory] = useState([]);

  const [search, setSearch] = useState("");

  const [showEarth, setShowEarth] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [follow, setFollow] = useState(false);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);

  const [visibleCount, setVisibleCount] = useState(8);

  const [expanded, setExpanded] = useState(false);
  const [fullTrajectory, setFullTrajectory] = useState(false);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);

  const [timeString, setTimeString] = useState(
    () =>
      new Date().toUTCString().slice(17, 25) +
      " UTC"
  );

  const viewerContainerRef = useRef(null);

  // -------------------------------------------------------
  // LIVE UTC CLOCK
  // -------------------------------------------------------

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(
        new Date().toUTCString().slice(17, 25) +
          " UTC"
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------
  // LOAD SATELLITE LIST
  // GET /api/satellites
  // -------------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    async function loadSatellites() {
      try {
        setLoadingList(true);

        const data = await apiService.getSatellites();

        if (!isMounted) return;

        setSatellites(data || []);

        if (data?.length > 0) {
          setSelectedNoradId(data[0].norad_cat_id);
        }
      } catch (error) {
        console.error(
          "Failed to load satellites:",
          error
        );
      } finally {
        if (isMounted) {
          setLoadingList(false);
        }
      }
    }

    loadSatellites();

    return () => {
      isMounted = false;
    };
  }, []);

  // -------------------------------------------------------
  // LOAD ALL SATELLITES
  // Fetch remaining pages from the backend.
  // -------------------------------------------------------

  const handleLoadAllSatellites = async () => {
    try {
      setLoadingAll(true);

      const pageSize = 500;
      let offset = satellites.length;
      let allSatellites = [...satellites];

      while (true) {
        const batch = await apiService.getSatellites(
          pageSize,
          offset
        );

        if (!batch || batch.length === 0) {
          break;
        }

        allSatellites = [
          ...allSatellites,
          ...batch,
        ];

        offset += batch.length;

        // Fewer than 500 means we reached the end.
        if (batch.length < pageSize) {
          break;
        }
      }

      setSatellites(allSatellites);
      setVisibleCount(allSatellites.length);
    } catch (error) {
      console.error(
        "Failed to load all satellites:",
        error
      );
    } finally {
      setLoadingAll(false);
    }
  };

  // -------------------------------------------------------
  // SEARCH
  // -------------------------------------------------------

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return satellites
      .filter((satellite) => {
        const name =
          satellite.object_name?.toLowerCase() || "";

        const norad =
          satellite.norad_cat_id?.toString() || "";

        return (
          name.includes(query) ||
          norad.includes(query)
        );
      })
      .slice(0, visibleCount);
  }, [satellites, search, visibleCount]);

  // -------------------------------------------------------
  // KEEP SELECTION VALID AFTER SEARCH
  // -------------------------------------------------------

  useEffect(() => {
    if (!filtered.length) return;

    const selectedStillVisible = filtered.some(
      (satellite) =>
        satellite.norad_cat_id === selectedNoradId
    );

    if (!selectedStillVisible) {
      setSelectedNoradId(
        filtered[0].norad_cat_id
      );
    }
  }, [filtered, selectedNoradId]);

  // -------------------------------------------------------
  // CURRENT SATELLITE
  // -------------------------------------------------------

  const currentSatelliteSummary = useMemo(() => {
    if (!selectedNoradId) return null;

    return (
      satellites.find(
        (satellite) =>
          satellite.norad_cat_id === selectedNoradId
      ) || null
    );
  }, [satellites, selectedNoradId]);

  // -------------------------------------------------------
  // LOAD SATELLITE DETAIL + TRAJECTORY
  // -------------------------------------------------------

  useEffect(() => {
    if (!selectedNoradId) return;

    let isMounted = true;

    async function loadSatelliteData() {
      try {
        setLoadingDetails(true);

        setSelectedDetails(null);
        setTrajectory([]);
        setProgress(0);

        const [detailsData, trajectoryData] =
          await Promise.all([
            apiService.getSatelliteById(
              selectedNoradId
            ),
            apiService.getSatelliteTrajectory(
              selectedNoradId
            ),
          ]);

        if (!isMounted) return;

        setSelectedDetails(detailsData || null);
        setTrajectory(trajectoryData || []);
      } catch (error) {
        console.error(
          `Failed to load satellite ${selectedNoradId}:`,
          error
        );
      } finally {
        if (isMounted) {
          setLoadingDetails(false);
        }
      }
    }

    loadSatelliteData();

    return () => {
      isMounted = false;
    };
  }, [selectedNoradId]);

  // -------------------------------------------------------
  // SELECTED SATELLITE
  // -------------------------------------------------------

  const satellite =
    selectedDetails ||
    currentSatelliteSummary ||
    null;

  // -------------------------------------------------------
  // CURRENT TRAJECTORY POINT
  // -------------------------------------------------------

  const currentPoint = useMemo(() => {
    if (!trajectory.length) return null;

    const index = Math.min(
      Math.floor(
        progress * (trajectory.length - 1)
      ),
      trajectory.length - 1
    );

    return trajectory[Math.max(0, index)];
  }, [trajectory, progress]);

  // -------------------------------------------------------
  // FULL TRAJECTORY TABLE
  // -------------------------------------------------------

  const displayedTrajectoryRows = useMemo(() => {
    if (!trajectory.length) return [];

    const step = fullTrajectory
      ? 4
      : Math.max(
          1,
          Math.floor(trajectory.length / 8)
        );

    const sampledRows = [];

    for (
      let i = 0;
      i < trajectory.length;
      i += step
    ) {
      sampledRows.push(trajectory[i]);
    }

    return sampledRows.map((point, index) => {
      let time = "—";

      if (point.timestamp_utc) {
        const date = new Date(
          point.timestamp_utc
        );

        if (!Number.isNaN(date.getTime())) {
          time =
            date
              .toISOString()
              .slice(11, 16) + " UTC";
        }
      }

      const formatValue = (value) => {
        if (
          typeof value === "number" &&
          Number.isFinite(value)
        ) {
          return value.toFixed(2);
        }

        return value ?? "—";
      };

      return {
        key:
          point.timestamp_utc || index,

        time,

        x: formatValue(point.x_km),
        y: formatValue(point.y_km),
        z: formatValue(point.z_km),

        vx: formatValue(point.vx_km_s),
        vy: formatValue(point.vy_km_s),
        vz: formatValue(point.vz_km_s),
      };
    });
  }, [trajectory, fullTrajectory]);

  // -------------------------------------------------------
  // CURRENT TIMELINE TIME
  // -------------------------------------------------------

  const currentTimelineTimestamp = useMemo(() => {
    if (currentPoint?.timestamp_utc) {
      const date = new Date(
        currentPoint.timestamp_utc
      );

      if (!Number.isNaN(date.getTime())) {
        return (
          date
            .toISOString()
            .slice(11, 19) + " UTC"
        );
      }
    }

    return "—";
  }, [currentPoint]);

  // -------------------------------------------------------
  // FULLSCREEN
  // -------------------------------------------------------

  useEffect(() => {
    if (!expanded) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
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

  // -------------------------------------------------------
  // RENDER
  // -------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#04060d] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">

      <MissionNavigation activeTab="SATELLITES" />

      <main className="pt-20 pb-16 px-3 sm:px-4 lg:px-6 w-full max-w-[96%] xl:max-w-[95%] 2xl:max-w-[1850px] mx-auto space-y-6">

        {/* PAGE HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800/80">

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Satellites
          </h1>

          <div className="flex items-center gap-3">

            <div className="flex items-center gap-2 text-xs font-mono text-slate-300 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800">

              <Clock3 className="w-3.5 h-3.5 text-cyan-400" />

              <span>{timeString}</span>

            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-cyan-300 bg-cyan-950/60 px-3 py-1.5 rounded-lg border border-cyan-800/60">

              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />

              <span>SGP4 ENGINE ACTIVE</span>

            </div>

          </div>
        </div>

        {/* =================================================
            TOP GRID
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* SATELLITE LIST */}

          <div className="lg:col-span-3 glass-panel rounded-xl p-3.5 border border-slate-800 flex flex-col h-[590px] overflow-hidden">

            <div className="relative mb-3">

              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />

              <input
                type="text"
                placeholder="Search satellite, NORAD..."
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                className="w-full bg-slate-900/90 border border-slate-700/80 text-xs font-mono rounded-lg pl-8 pr-3 py-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />

            </div>

            <div className="flex items-center justify-between px-1 pb-2 border-b border-slate-800/80 text-[10px] font-mono text-slate-400">

              <span className="font-semibold text-slate-300">
                MONITORED ASSETS
              </span>

              <span>
                {satellites.length} objects
              </span>

            </div>

            <div className="flex-1 overflow-y-auto space-y-1 py-2 pr-1">

              {filtered.map((satelliteItem) => {

                const isChosen =
                  satelliteItem.norad_cat_id ===
                  selectedNoradId;

                return (
                  <button
                    key={satelliteItem.norad_cat_id}
                    type="button"
                    onClick={() => {
                      setSelectedNoradId(
                        satelliteItem.norad_cat_id
                      );

                      setProgress(0);
                    }}
                    className={`w-full text-left p-2.5 rounded-lg border transition-all flex items-start gap-2.5 ${
                      isChosen
                        ? "bg-cyan-950/70 border-cyan-500/60 shadow-[0_0_14px_rgba(56,189,248,0.22)]"
                        : "bg-slate-900/40 border-slate-800/60 hover:bg-slate-900/80 hover:border-slate-700/80"
                    }`}
                  >

                    <span className="w-2 h-2 rounded-full mt-1 bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />

                    <div className="min-w-0 flex-1">

                      <div className="text-xs font-mono font-bold text-white truncate">
                        {satelliteItem.object_name}
                      </div>

                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        NORAD{" "}
                        {satelliteItem.norad_cat_id}
                      </div>

                    </div>

                  </button>
                );
              })}

              {filtered.length === 0 &&
                !loadingList && (
                  <div className="text-center py-8 text-xs font-mono text-slate-500">
                    No satellites matching query
                  </div>
                )}

            </div>

            {visibleCount < satellites.length && (
              <button
                type="button"
                onClick={handleLoadAllSatellites}
                disabled={loadingAll}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-800 text-slate-300 hover:text-cyan-300 font-mono text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>
                  {loadingAll
                    ? "Loading All Satellites..."
                    : "Load All Satellites"}
                </span>

                <RotateCcw
                  className={`w-3.5 h-3.5 ${
                    loadingAll ? "animate-spin" : ""
                  }`}
                />
              </button>
            )}

          </div>

          {/* 3D VIEWER */}

          <div className="lg:col-span-6 flex flex-col gap-3">

            <div
              ref={viewerContainerRef}
              className="relative w-full h-[530px] rounded-xl border border-slate-800 glass-panel overflow-hidden viewer-fullscreen-container shadow-2xl bg-[#030712]"
            >

              {/* TOOLBAR */}

              <div className="absolute z-10 top-3.5 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-950/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 shadow-xl">

                <button
                  type="button"
                  onClick={() =>
                    setFollow((value) => !value)
                  }
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    follow
                      ? "bg-cyan-600 text-white font-bold"
                      : "text-slate-300 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <SatelliteIcon className="w-3.5 h-3.5" />
                  <span>
                    {follow ? "Following" : "Follow"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowEarth(
                      (value) => !value
                    )
                  }
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showEarth
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Globe2 className="w-3.5 h-3.5" />
                  <span>Earth</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setShowGrid(
                      (value) => !value
                    )
                  }
                  className={`px-2.5 py-1 rounded text-xs font-mono flex items-center gap-1.5 transition-all ${
                    showGrid
                      ? "bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Grid3X3 className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 rounded text-slate-300 hover:text-cyan-300 hover:bg-slate-900 transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

              </div>

              <Canvas
                camera={{
                  position: [0, 4.8, 7.3],
                  fov: 45,
                }}
              >
                <Scene
                  trajectory={trajectory}
                  showEarth={showEarth}
                  showGrid={showGrid}
                  running={running}
                  progress={progress}
                  setProgress={setProgress}
                  follow={follow}
                />
              </Canvas>

              {/* LEGEND */}

              <div className="absolute z-10 bottom-3 left-3 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-lg border border-slate-800 text-[10px] font-mono text-slate-300 flex flex-col gap-1">

                <span className="text-slate-400 font-bold tracking-wider text-[9px]">
                  3D TELEMETRY LEGEND
                </span>

                <span className="flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  Selected Satellite
                </span>

                <span className="flex items-center gap-1.5">
                  <i className="w-3 h-0.5 bg-cyan-400 inline-block" />
                  ECI Orbit Path
                </span>

                <span className="flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
                  Earth Globe
                </span>

              </div>

              {/* AXES */}

              <div className="absolute z-10 bottom-3 right-3 bg-slate-950/80 backdrop-blur-md px-2.5 py-1.5 rounded-lg border border-slate-800 font-mono text-[10px] flex items-center gap-2">

                <span className="text-rose-400 font-bold">
                  +X (Vernal)
                </span>

                <span className="text-emerald-400 font-bold">
                  +Y
                </span>

                <span className="text-cyan-400 font-bold">
                  +Z (North)
                </span>

              </div>

            </div>

            {/* TIMELINE */}

            <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center gap-3 font-mono text-xs">

              <button
                type="button"
                onClick={() =>
                  setRunning(
                    (value) => !value
                  )
                }
                disabled={!trajectory.length}
                className="w-8 h-8 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 flex items-center justify-center disabled:opacity-40"
              >
                {running ? (
                  <Pause className="w-4 h-4 fill-cyan-300" />
                ) : (
                  <Play className="w-4 h-4 fill-cyan-300 ml-0.5" />
                )}
              </button>

              <span className="text-[10px] text-slate-400">
                00:00
              </span>

              <input
                type="range"
                min="0"
                max="1"
                step="0.001"
                value={progress}
                onChange={(event) =>
                  setProgress(
                    Number(event.target.value)
                  )
                }
                disabled={!trajectory.length}
                className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 disabled:opacity-40"
              />

              <span className="text-cyan-300 font-bold text-xs bg-slate-900/90 px-2 py-0.5 rounded border border-slate-800">
                {currentTimelineTimestamp}
              </span>

              <span className="text-[10px] text-slate-400">
                24:00
              </span>

            </div>

          </div>

          {/* TELEMETRY */}

          <div className="lg:col-span-3 glass-panel rounded-xl p-4 border border-slate-800 flex flex-col h-[590px] overflow-y-auto space-y-4">

            <div>

              <span className="text-[10px] font-mono text-slate-400 tracking-wider block mb-1">
                SELECTED ASSET
              </span>

              <h2 className="text-lg font-bold font-mono text-white truncate">
                {satellite?.object_name || "—"}
              </h2>

            </div>

            {/* IDENTIFICATION */}

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">

              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                OBJECT IDENTIFICATION
              </span>

              <MetricRow
                label="NORAD ID"
                value={
                  satellite?.norad_cat_id
                }
              />

              <MetricRow
                label="Object Name"
                value={
                  satellite?.object_name
                }
              />

              <MetricRow
                label="Epoch UTC"
                value={
                  satellite?.epoch_utc
                }
              />

            </div>

            {/* CURRENT POSITION */}

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">

              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                CURRENT POSITION (ECI)
              </span>

              <MetricRow
                label="X Coordinate"
                value={currentPoint?.x_km?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km"
                    : ""
                }
              />

              <MetricRow
                label="Y Coordinate"
                value={currentPoint?.y_km?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km"
                    : ""
                }
              />

              <MetricRow
                label="Z Coordinate"
                value={currentPoint?.z_km?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km"
                    : ""
                }
              />

            </div>

            {/* CURRENT VELOCITY */}

            <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">

              <span className="text-[10px] font-mono text-cyan-400 font-bold tracking-wider block mb-1">
                CURRENT VELOCITY (ECI)
              </span>

              <MetricRow
                label="Velocity Vx"
                value={currentPoint?.vx_km_s?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km/s"
                    : ""
                }
              />

              <MetricRow
                label="Velocity Vy"
                value={currentPoint?.vy_km_s?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km/s"
                    : ""
                }
              />

              <MetricRow
                label="Velocity Vz"
                value={currentPoint?.vz_km_s?.toFixed(2)}
                unit={
                  currentPoint
                    ? "km/s"
                    : ""
                }
              />

            </div>

            {/* PROPAGATION */}

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400 flex items-center justify-between">

              <span>LAST PROPAGATION</span>

              <span className="text-slate-200 text-right ml-3">
                {satellite?.retrieved_at || "—"}
              </span>

            </div>

          </div>

        </div>

        {/* =================================================
            LOWER SECTION
        ================================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* ORBITAL PARAMETERS */}

          <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">

            <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">

              <Orbit className="w-4 h-4 text-cyan-400" />

              <span>
                SATELLITE ORBITAL SPECIFICATIONS
              </span>

            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">

                <h3 className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mb-2">
                  ORBITAL PARAMETERS
                </h3>

                <MetricRow
                  label="Inclination"
                  value={
                    satellite?.inclination !==
                    null &&
                    satellite?.inclination !==
                    undefined
                      ? satellite.inclination.toFixed(3)
                      : "—"
                  }
                  unit={
                    satellite?.inclination != null
                      ? "°"
                      : ""
                  }
                />

                <MetricRow
                  label="RAAN"
                  value={
                    satellite?.ra_of_asc_node !=
                    null
                      ? satellite.ra_of_asc_node.toFixed(
                          3
                        )
                      : "—"
                  }
                  unit={
                    satellite?.ra_of_asc_node != null
                      ? "°"
                      : ""
                  }
                />

                <MetricRow
                  label="Eccentricity"
                  value={
                    satellite?.eccentricity !=
                    null
                      ? satellite.eccentricity
                      : "—"
                  }
                />

                <MetricRow
                  label="Arg of Perigee"
                  value={
                    satellite?.arg_of_pericenter !=
                    null
                      ? satellite.arg_of_pericenter.toFixed(
                          3
                        )
                      : "—"
                  }
                  unit={
                    satellite?.arg_of_pericenter != null
                      ? "°"
                      : ""
                  }
                />

                <MetricRow
                  label="Mean Anomaly"
                  value={
                    satellite?.mean_anomaly !=
                    null
                      ? satellite.mean_anomaly.toFixed(
                          3
                        )
                      : "—"
                  }
                  unit={
                    satellite?.mean_anomaly != null
                      ? "°"
                      : ""
                  }
                />

                <MetricRow
                  label="Mean Motion"
                  value={
                    satellite?.mean_motion !=
                    null
                      ? satellite.mean_motion
                      : "—"
                  }
                  unit={
                    satellite?.mean_motion != null
                      ? "rev/day"
                      : ""
                  }
                />

              </div>

              {/* TLE / SOURCE DATA */}

              <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-800/80">

                <h3 className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider mb-2">
                  TLE / SOURCE DATA
                </h3>

                <MetricRow
                  label="B* Drag Term"
                  value={
                    satellite?.bstar != null
                      ? satellite.bstar
                      : "—"
                  }
                />

                <MetricRow
                  label="Epoch UTC"
                  value={
                    satellite?.epoch_utc || "—"
                  }
                />

                <MetricRow
                  label="Retrieved At"
                  value={
                    satellite?.retrieved_at || "—"
                  }
                />

                <MetricRow
                  label="Source"
                  value={
                    satellite?.source_url
                      ? "CelesTrak"
                      : "—"
                  }
                />

              </div>

            </div>

          </div>

          {/* TRAJECTORY */}

          <div className="lg:col-span-6 glass-panel rounded-xl p-5 border border-slate-800 space-y-3">

            <div className="flex items-center justify-between">

              <h2 className="text-sm font-bold font-mono text-white flex items-center gap-2">

                <Layers className="w-4 h-4 text-cyan-400" />

                <span>
                  TRAJECTORY EPHEMERIS (24 HOURS)
                </span>

              </h2>

              <span className="text-[10px] font-mono bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                COORDINATES: ECI (J2000)
              </span>

            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800">

              <table className="w-full border-collapse font-mono text-xs text-left">

                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800 text-slate-400 text-[10px]">

                    <th className="py-2.5 px-3">
                      Time
                    </th>

                    <th className="py-2.5 px-2">
                      X (km)
                    </th>

                    <th className="py-2.5 px-2">
                      Y (km)
                    </th>

                    <th className="py-2.5 px-2">
                      Z (km)
                    </th>

                    <th className="py-2.5 px-2">
                      Vx (km/s)
                    </th>

                    <th className="py-2.5 px-2">
                      Vy (km/s)
                    </th>

                    <th className="py-2.5 px-2">
                      Vz (km/s)
                    </th>

                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60">

                  {displayedTrajectoryRows.map(
                    (row, index) => (
                      <tr
                        key={
                          row.key || index
                        }
                        className="hover:bg-slate-900/50 transition-colors text-slate-300"
                      >

                        <td className="py-2 px-3 text-cyan-300 font-semibold">
                          {row.time}
                        </td>

                        <td className="py-2 px-2">
                          {row.x}
                        </td>

                        <td className="py-2 px-2">
                          {row.y}
                        </td>

                        <td className="py-2 px-2">
                          {row.z}
                        </td>

                        <td className="py-2 px-2">
                          {row.vx}
                        </td>

                        <td className="py-2 px-2">
                          {row.vy}
                        </td>

                        <td className="py-2 px-2">
                          {row.vz}
                        </td>

                      </tr>
                    )
                  )}

                  {displayedTrajectoryRows.length ===
                    0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-6 text-slate-500 text-xs"
                      >
                        {loadingDetails
                          ? "Loading trajectory ephemeris..."
                          : "No trajectory data available"}
                      </td>
                    </tr>
                  )}

                </tbody>

              </table>

            </div>

            {trajectory.length > 4 && (
              <button
                type="button"
                onClick={() =>
                  setFullTrajectory(
                    (value) => !value
                  )
                }
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