import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getEarthTexture, getEarthNightTexture, getEarthCloudsTexture } from './TextureUtils';

/**
 * Realistic 3D Earth Globe with day/night materials, clouds, atmosphere glow, and axial tilt
 */
export default function EarthGlobe({ radius = 2.4, opacity = 1.0, showNightLights = true }) {
  const earthGroupRef = useRef();
  const cloudsRef = useRef();

  const dayTexture = useMemo(() => getEarthTexture(), []);
  const nightTexture = useMemo(() => getEarthNightTexture(), []);
  const cloudsTexture = useMemo(() => getEarthCloudsTexture(), []);

  // Subtle continuous orbital spin
  useFrame((state, delta) => {
    if (earthGroupRef.current) {
      earthGroupRef.current.rotation.y += delta * 0.04;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055;
    }
  });

  return (
    <group ref={earthGroupRef} rotation={[0.41, 0, 0]}>
      {/* ─────────────────────────────────────────────────────────────
          1. CORE EARTH SURFACE (DAYTIME OCEANS & CONTINENTS)
          ───────────────────────────────────────────────────────────── */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={dayTexture}
          roughness={0.7}
          metalness={0.15}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────
          2. NIGHT-SIDE GLOWING CITY LIGHTS (EMISSIVE BLEND)
          ───────────────────────────────────────────────────────────── */}
      {showNightLights && (
        <mesh>
          <sphereGeometry args={[radius * 1.002, 48, 48]} />
          <meshBasicMaterial
            map={nightTexture}
            blending={THREE.AdditiveBlending}
            transparent={true}
            opacity={0.75 * opacity}
          />
        </mesh>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. ROTATING CLOUD CANOPY
          ───────────────────────────────────────────────────────────── */}
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[radius * 1.012, 48, 48]} />
        <meshStandardMaterial
          map={cloudsTexture}
          transparent={true}
          opacity={0.45 * opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ─────────────────────────────────────────────────────────────
          4. ATMOSPHERIC SCATTERING / CYAN FRESNEL HALO
          ───────────────────────────────────────────────────────────── */}
      <mesh>
        <sphereGeometry args={[radius * 1.035, 36, 36]} />
        <meshBasicMaterial
          color="#38bdf8"
          transparent={true}
          opacity={0.16 * opacity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer faint stratosphere aura */}
      <mesh>
        <sphereGeometry args={[radius * 1.06, 32, 32]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent={true}
          opacity={0.08 * opacity}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}
