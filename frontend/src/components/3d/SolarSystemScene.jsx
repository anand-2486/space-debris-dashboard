import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import {
  getSunTexture,
  getSaturnRingsTexture,
  getPlanetTexture,
} from './TextureUtils';

/**
 * 3D Sun with dynamic corona and solar flares
 */
function CentralSun() {
  const sunRef = useRef();
  const coronaRef = useRef();
  const sunTexture = useMemo(() => getSunTexture(), []);

  useFrame((state, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.05;
    }
    if (coronaRef.current) {
      coronaRef.current.rotation.z += delta * 0.02;
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      coronaRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Radiant Sun Sphere */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[2.0, 36, 36]} />
        <meshBasicMaterial map={sunTexture} />
      </mesh>

      {/* Internal Solar Core Light */}
      <pointLight position={[0, 0, 0]} intensity={15} color="#fff4e0" distance={120} decay={1.2} />

      {/* Fiery Solar Corona Halo */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[2.35, 32, 32]} />
        <meshBasicMaterial
          color="#ff7a00"
          transparent={true}
          opacity={0.35}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer Atmospheric Solar Flare Glow */}
      <mesh>
        <sphereGeometry args={[2.8, 24, 24]} />
        <meshBasicMaterial
          color="#ff4500"
          transparent={true}
          opacity={0.15}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/**
 * 3D Planet Mesh with continuous orbital revolution & axial rotation
 */
function OrbitingPlanet({
  name,
  radius,
  orbitalRadius,
  orbitalSpeed,
  rotationSpeed,
  textureType,
  hasRings = false,
  hasMoon = false,
  onSelect,
  isHovered,
  setHovered,
}) {
  const pivotRef = useRef();
  const planetBodyRef = useRef();
  const texture = useMemo(() => getPlanetTexture(textureType), [textureType]);
  const ringsTexture = useMemo(() => (hasRings ? getSaturnRingsTexture() : null), [hasRings]);

  // Continuous real-time Keplerian orbit & spin
  useFrame((state, delta) => {
    if (pivotRef.current) {
      pivotRef.current.rotation.y += delta * orbitalSpeed * 0.4;
    }
    if (planetBodyRef.current) {
      planetBodyRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  return (
    <group ref={pivotRef}>
      <group position={[orbitalRadius, 0, 0]}>
        {/* Planet sphere */}
        <mesh
          ref={planetBodyRef}
          castShadow
          receiveShadow
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(name);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHovered(name);
          }}
          onPointerOut={(e) => {
            e.stopPropagation();
            setHovered(null);
          }}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshStandardMaterial
            map={texture}
            roughness={0.7}
            metalness={0.1}
            emissive={isHovered ? '#38bdf8' : '#000000'}
            emissiveIntensity={isHovered ? 0.4 : 0}
          />
        </mesh>

        {/* 3D Saturn Rings Geometry */}
        {hasRings && (
          <mesh rotation={[Math.PI / 2.5, 0, 0]}>
            <ringGeometry args={[radius * 1.35, radius * 2.4, 48]} />
            <meshStandardMaterial
              map={ringsTexture}
              side={THREE.DoubleSide}
              transparent={true}
              opacity={0.88}
              roughness={0.6}
            />
          </mesh>
        )}

        {/* Earth Moon */}
        {hasMoon && (
          <group rotation={[0.2, 0, 0]}>
            <mesh position={[radius * 2.2, 0, 0]}>
              <sphereGeometry args={[radius * 0.27, 16, 16]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.9} />
            </mesh>
          </group>
        )}

        {/* Hover / Active Planet Name Tag */}
        {isHovered && (
          <Html position={[0, radius + 0.5, 0]} center distanceFactor={25}>
            <div className="bg-slate-950/90 border border-cyan-500/60 backdrop-blur-md px-2.5 py-1 rounded-md text-[11px] font-mono text-cyan-300 shadow-glow-cyan pointer-events-none whitespace-nowrap flex items-center gap-1.5 animate-fadeIn">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
              <span className="font-bold tracking-wider">{name.toUpperCase()}</span>
            </div>
          </Html>
        )}
      </group>
    </group>
  );
}

/**
 * Procedural circular orbital guide line for each planet
 */
function OrbitTrajectoryLine({ orbitalRadius }) {
  const points = useMemo(() => {
    const pts = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const theta = (i / segments) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(theta) * orbitalRadius, 0, Math.sin(theta) * orbitalRadius));
    }
    return pts;
  }, [orbitalRadius]);

  const lineGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, [points]);

  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial color="#38bdf8" transparent opacity={0.16} />
    </line>
  );
}

/**
 * Main Solar System Scene Component with 8 revolving planets
 */
export default function SolarSystemScene({ onSelectPlanet }) {
  const [hoveredPlanet, setHoveredPlanet] = useState(null);

  const planetsData = useMemo(() => [
    {
      name: 'Mercury',
      radius: 0.32,
      orbitalRadius: 4.6,
      orbitalSpeed: 1.2,
      rotationSpeed: 0.08,
      textureType: 'mercury',
    },
    {
      name: 'Venus',
      radius: 0.58,
      orbitalRadius: 7.2,
      orbitalSpeed: 0.85,
      rotationSpeed: 0.05,
      textureType: 'venus',
    },
    {
      name: 'Earth',
      radius: 0.68,
      orbitalRadius: 10.4,
      orbitalSpeed: 0.6,
      rotationSpeed: 0.12,
      textureType: 'earth',
      hasMoon: true,
    },
    {
      name: 'Mars',
      radius: 0.42,
      orbitalRadius: 13.8,
      orbitalSpeed: 0.48,
      rotationSpeed: 0.1,
      textureType: 'mars',
    },
    {
      name: 'Jupiter',
      radius: 1.45,
      orbitalRadius: 18.5,
      orbitalSpeed: 0.28,
      rotationSpeed: 0.25,
      textureType: 'jupiter',
    },
    {
      name: 'Saturn',
      radius: 1.15,
      orbitalRadius: 23.5,
      orbitalSpeed: 0.2,
      rotationSpeed: 0.22,
      textureType: 'saturn',
      hasRings: true,
    },
    {
      name: 'Uranus',
      radius: 0.82,
      orbitalRadius: 28.2,
      orbitalSpeed: 0.14,
      rotationSpeed: 0.15,
      textureType: 'uranus',
    },
    {
      name: 'Neptune',
      radius: 0.78,
      orbitalRadius: 32.8,
      orbitalSpeed: 0.1,
      rotationSpeed: 0.14,
      textureType: 'neptune',
    },
  ], []);

  return (
    <group position={[0, 0, 0]}>
      {/* Central Radiant Sun */}
      <CentralSun />

      {/* Orbital Path Guides */}
      {planetsData.map((p) => (
        <OrbitTrajectoryLine key={`path-${p.name}`} orbitalRadius={p.orbitalRadius} />
      ))}

      {/* 8 Continuously Revolving Planets */}
      {planetsData.map((p) => (
        <OrbitingPlanet
          key={p.name}
          {...p}
          isHovered={hoveredPlanet === p.name}
          setHovered={setHoveredPlanet}
          onSelect={onSelectPlanet}
        />
      ))}
    </group>
  );
}
