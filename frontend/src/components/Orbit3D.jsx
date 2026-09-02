import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import * as THREE from 'three';
import { getEarthTexture } from './3d/TextureUtils';

const EARTH_TEXTURE_URL =
  'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg';

// Earth
function Earth() {
  const earthRef = useRef();

  const earthTexture = useMemo(() => {
    try {
      const loader = new THREE.TextureLoader();

      return loader.load(
        EARTH_TEXTURE_URL,
        undefined,
        undefined,
        () => getEarthTexture()
      );
    } catch {
      return getEarthTexture();
    }
  }, []);

  useFrame((_, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
  });

  return (
    <group ref={earthRef}>
      <mesh>
        <sphereGeometry args={[2.0, 64, 64]} />

        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.05}
        />
      </mesh>

      <mesh scale={1.03}>
        <sphereGeometry args={[2.0, 48, 48]} />

        <meshBasicMaterial
          color="#38bdf8"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
        />
      </mesh>

      <mesh scale={1.06}>
        <sphereGeometry args={[2.0, 32, 32]} />

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


// Validate and convert backend trajectory points
function normalizeTrajectory(trajectory, label) {
  if (!Array.isArray(trajectory) || trajectory.length < 2) {
    throw new Error(
      `${label} trajectory is missing or contains fewer than 2 valid points.`
    );
  }

  const points = trajectory.map((point, index) => {
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

    return {
      ...point,
      x,
      y,
      z,
      timestamp: new Date(point.timestamp_utc),
    };
  });

  if (points.some((point) => Number.isNaN(point.timestamp.getTime()))) {
    throw new Error(
      `${label} trajectory contains an invalid timestamp.`
    );
  }

  return points;
}


// Convert backend ECI coordinates to Three.js coordinates.
//
// Backend:
//   x_km
//   y_km
//   z_km
//
// Three.js:
//   x
//   z <- backend y
//   y <- backend z
function toThreeVector(point, scale) {
  return new THREE.Vector3(
    point.x * scale,
    point.z * scale,
    point.y * scale
  );
}


// Find the actual backend trajectory point closest to TCA.
function findClosestToTCA(trajectory, tcaTimestamp) {
  if (!tcaTimestamp) {
    return Math.floor(trajectory.length / 2);
  }

  const tca = new Date(tcaTimestamp);

  if (Number.isNaN(tca.getTime())) {
    throw new Error('Conjunction response contains an invalid TCA timestamp.');
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


// Realistic satellite/debris model
function SpaceObjectMesh({ position, isDebris = false }) {
  const primaryColor = isDebris ? '#f43f5e' : '#38bdf8';
  const emissiveColor = isDebris ? '#e11d48' : '#0284c7';
  const solarPanelColor = isDebris ? '#2a0e28' : '#1e3a8a';
  const solarPanelEmissive = isDebris ? '#881337' : '#0369a1';

  return (
    <group
      position={position}
      rotation={isDebris ? [0.4, 0.8, 0.3] : [0.2, 0.5, 0]}
    >
      <mesh>
        <cylinderGeometry args={[0.045, 0.045, 0.16, 16]} />

        <meshStandardMaterial
          color={primaryColor}
          emissive={emissiveColor}
          emissiveIntensity={0.9}
          metalness={0.85}
          roughness={0.2}
        />
      </mesh>

      <mesh>
        <cylinderGeometry args={[0.048, 0.048, 0.07, 16]} />

        <meshStandardMaterial
          color="#f59e0b"
          emissive="#d97706"
          emissiveIntensity={0.6}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      <group position={[0, 0, 0.15]}>
        <mesh position={[0, 0, -0.04]}>
          <boxGeometry args={[0.015, 0.015, 0.04]} />

          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.9}
          />
        </mesh>

        <mesh>
          <boxGeometry args={[0.08, 0.015, 0.18]} />

          <meshStandardMaterial
            color={solarPanelColor}
            emissive={solarPanelEmissive}
            emissiveIntensity={0.7}
            metalness={0.6}
          />
        </mesh>
      </group>

      <group position={[0, 0, -0.15]}>
        <mesh position={[0, 0, 0.04]}>
          <boxGeometry args={[0.015, 0.015, 0.04]} />

          <meshStandardMaterial
            color="#94a3b8"
            metalness={0.9}
          />
        </mesh>

        <mesh>
          <boxGeometry args={[0.08, 0.015, 0.18]} />

          <meshStandardMaterial
            color={solarPanelColor}
            emissive={solarPanelEmissive}
            emissiveIntensity={0.7}
            metalness={0.6}
          />
        </mesh>
      </group>

      <mesh
        position={[0.06, 0.03, 0]}
        rotation={[0, 0, Math.PI / 2]}
      >
        <coneGeometry args={[0.042, 0.04, 16]} />

        <meshStandardMaterial
          color="#e2e8f0"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      <mesh
        position={[-0.05, -0.02, 0]}
        rotation={[0, 0, -Math.PI / 3]}
      >
        <cylinderGeometry args={[0.005, 0.005, 0.09, 8]} />

        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.9}
        />
      </mesh>
    </group>
  );
}


// Actual backend trajectory scene
function TrajectoryScene({ event }) {
  const [animationProgress, setAnimationProgress] = useState(0);

  /*
   * These are now the arrays exposed directly by our
   * ConjunctionDetail.jsx change.
   */
  const trajectoryA = event?.trajectory_a;
  const trajectoryB = event?.trajectory_b;

  const {
    pointsA,
    pointsB,
    tcaIndexA,
    tcaIndexB,
    tcaPosition,
  } = useMemo(() => {
    const normalizedA = normalizeTrajectory(
      trajectoryA,
      'Object A'
    );

    const normalizedB = normalizeTrajectory(
      trajectoryB,
      'Object B'
    );

    const scale = 2.4 / 6800;

    const pointsA = normalizedA.map((point) =>
      toThreeVector(point, scale)
    );

    const pointsB = normalizedB.map((point) =>
      toThreeVector(point, scale)
    );

    const tcaIndexA = findClosestToTCA(
      normalizedA,
      event?.tca_timestamp
    );

    const tcaIndexB = findClosestToTCA(
      normalizedB,
      event?.tca_timestamp
    );

    /*
     * TCA marker is positioned using the actual Object A
     * trajectory point closest to backend TCA.
     *
     * We do not invent an intersection point.
     */
    const tcaPosition =
      pointsA[tcaIndexA] || pointsA[Math.floor(pointsA.length / 2)];

    return {
      pointsA,
      pointsB,
      tcaIndexA,
      tcaIndexB,
      tcaPosition,
    };
  }, [trajectoryA, trajectoryB, event?.tca_timestamp]);

  /*
   * Animate the satellite models along the REAL backend
   * trajectory. The orbit lines themselves remain static.
   */
  useFrame((_, delta) => {
    setAnimationProgress(
      (previous) => (previous + delta * 0.08) % 1
    );
  });

  const animatedIndexA = Math.min(
    pointsA.length - 1,
    Math.floor(animationProgress * (pointsA.length - 1))
  );

  const animatedIndexB = Math.min(
    pointsB.length - 1,
    Math.floor(animationProgress * (pointsB.length - 1))
  );

  const satPosA =
    pointsA[animatedIndexA] ||
    pointsA[tcaIndexA];

  const satPosB =
    pointsB[animatedIndexB] ||
    pointsB[tcaIndexB];

  return (
    <group>

      {/* ACTUAL Object A trajectory */}
      {pointsA.length > 1 && (
        <Line
          points={pointsA}
          color="#38bdf8"
          lineWidth={2.5}
          transparent
          opacity={0.9}
        />
      )}

      {/* ACTUAL Object B trajectory */}
      {pointsB.length > 1 && (
        <Line
          points={pointsB}
          color="#f43f5e"
          lineWidth={2.5}
          transparent
          opacity={0.9}
        />
      )}

      {/* Actual TCA location */}
      {tcaPosition && (
        <group position={tcaPosition}>
          <mesh>
            <sphereGeometry args={[0.055, 20, 20]} />

            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={2.5}
            />
          </mesh>

          <mesh scale={1.8}>
            <ringGeometry args={[0.04, 0.07, 24]} />

            <meshBasicMaterial
              color="#f59e0b"
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>
      )}

      {/* Object A */}
      {satPosA && (
        <SpaceObjectMesh
          position={satPosA}
          isDebris={false}
        />
      )}

      {/* Object B */}
      {satPosB && (
        <SpaceObjectMesh
          position={satPosB}
          isDebris={true}
        />
      )}
    </group>
  );
}


export default function Orbit3D({
  event,
  isFullscreen,
  onToggleFullscreen,
}) {
  const [error, setError] = useState(null);

  const nameA =
    event?.satellite_a?.object_name ||
    event?.object_a?.object_name ||
    event?.object_a ||
    'Object A';

  const nameB =
    event?.satellite_b?.object_name ||
    event?.object_b?.object_name ||
    event?.object_b ||
    'Object B';

  const hasTrajectory =
    Array.isArray(event?.trajectory_a) &&
    event.trajectory_a.length >= 2 &&
    Array.isArray(event?.trajectory_b) &&
    event.trajectory_b.length >= 2;

  React.useEffect(() => {
    if (!hasTrajectory) {
      setError(
        'Backend trajectory data is missing or incomplete for this conjunction.'
      );
      return;
    }

    try {
      normalizeTrajectory(
        event.trajectory_a,
        'Object A'
      );

      normalizeTrajectory(
        event.trajectory_b,
        'Object B'
      );

      if (!event?.tca_timestamp) {
        throw new Error(
          'Backend conjunction response is missing tca_timestamp.'
        );
      }

      setError(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Invalid backend trajectory data.'
      );
    }
  }, [
    event?.trajectory_a,
    event?.trajectory_b,
    event?.tca_timestamp,
    hasTrajectory,
  ]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minHeight: '600px',
      }}
      className="w-full h-full relative bg-slate-950/90 rounded-xl overflow-hidden flex flex-col"
    >
      {!error ? (
        <Canvas
          camera={{
            position: [0, 0.8, 3.4],
            fov: 45,
          }}
          style={{
            width: '100%',
            height: '100%',
          }}
          className="w-full h-full"
        >
          <ambientLight intensity={0.8} />

          <directionalLight
            position={[10, 10, 5]}
            intensity={2.5}
          />

          <directionalLight
            position={[-10, -5, -5]}
            intensity={0.8}
            color="#0284c7"
          />

          <Stars
            radius={100}
            depth={50}
            count={3500}
            factor={4}
            saturation={0}
            fade
            speed={1}
          />

          <Earth />

          <TrajectoryScene event={event} />

          <OrbitControls
            enablePan
            enableZoom
            enableRotate
            minDistance={2.1}
            maxDistance={12}
          />
        </Canvas>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <div className="max-w-md rounded-xl border border-rose-800/70 bg-slate-900/95 p-6 text-center font-mono">
            <div className="text-xs font-bold text-rose-400 mb-2">
              BACKEND TRAJECTORY ERROR
            </div>

            <p className="text-xs leading-relaxed text-slate-400">
              {error}
            </p>
          </div>
        </div>
      )}

      {/* Telemetry Overlay */}
      {!error && (
        <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 text-xs font-mono max-w-xs pointer-events-none shadow-lg">

          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]" />

            <span className="text-white font-bold truncate">
              {nameA} (Backend Trajectory)
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.8)]" />

            <span className="text-slate-200 truncate">
              {nameB} (Backend Trajectory)
            </span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />

            <span className="text-amber-300 font-semibold truncate">
              TCA Encounter Point
            </span>
          </div>

          <div className="text-[10px] text-slate-400 border-t border-slate-800/80 pt-1.5">
            Drag to rotate • Scroll to zoom • Right-click to pan
          </div>
        </div>
      )}

      <div className="absolute bottom-3 right-3 bg-slate-900/85 px-3 py-1 rounded-lg text-[10px] font-mono text-slate-400 border border-slate-800">
        Three.js / Backend SGP4 Trajectory
      </div>
    </div>
  );
}