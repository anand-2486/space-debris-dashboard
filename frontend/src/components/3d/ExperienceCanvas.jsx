import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import RocketLaunchScene from './RocketLaunchScene';
import EarthGlobe from './EarthGlobe';
import SolarSystemScene from './SolarSystemScene';
import OrbitalEnvironment from './OrbitalEnvironment';
import ConjunctionCloseApproach from './ConjunctionCloseApproach';

/**
 * Camera Choreographer that smoothly interpolates position and target based on scroll progress
 */
function CameraController({ scrollProgress = 0, interactiveTarget = null }) {
  const currentPos = useRef(new THREE.Vector3(0, 2.5, 9.5));
  const currentLookAt = useRef(new THREE.Vector3(0, 3.5, 0));

  useFrame((state) => {
    // Determine desired camera position and lookAt target based on scroll journey stages
    const desiredPos = new THREE.Vector3();
    const desiredLookAt = new THREE.Vector3();

    if (interactiveTarget) {
      // Focus on user-clicked planet/object
      desiredPos.copy(interactiveTarget.position).add(new THREE.Vector3(0, 1.5, 4.0));
      desiredLookAt.copy(interactiveTarget.position);
    } else if (scrollProgress < 0.08) {
      // ─────────────────────────────────────────────
      // STAGE 1: LAUNCH PAD
      // ─────────────────────────────────────────────
      desiredPos.set(0, 2.2, 9.2);
      desiredLookAt.set(0, 3.6, 0);
    } else if (scrollProgress < 0.22) {
      // ─────────────────────────────────────────────
      // STAGE 2: LAUNCH & LIFTOFF
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.08) / 0.14;
      const rocketAltitude = t * t * 6.0;
      desiredPos.set(0.8 * t, 2.2 + rocketAltitude * 0.9, 9.2 + t * 2.0);
      desiredLookAt.set(0, 3.6 + rocketAltitude, 0);
    } else if (scrollProgress < 0.40) {
      // ─────────────────────────────────────────────
      // STAGE 3: ASCENT THROUGH ATMOSPHERE
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.22) / 0.18;
      desiredPos.set(1.5, 10.0 + t * 20.0, 12.0 + t * 6.0);
      desiredLookAt.set(0, 12.0 + t * 20.0, 0);
    } else if (scrollProgress < 0.55) {
      // ─────────────────────────────────────────────
      // STAGE 4: LEAVING EARTH
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.40) / 0.15;
      desiredPos.set(0, 6.0 + t * 4.0, 14.0 + t * 6.0);
      desiredLookAt.set(0, -1.0, 0);
    } else if (scrollProgress < 0.76) {
      // ─────────────────────────────────────────────
      // STAGE 5: SOLAR SYSTEM REVEAL
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.55) / 0.21;
      // High-angle view of the Sun and all revolving planetary orbits
      desiredPos.set(0, 28.0 - t * 4.0, 36.0 - t * 4.0);
      desiredLookAt.set(0, 0, 0);
    } else if (scrollProgress < 0.86) {
      // ─────────────────────────────────────────────
      // STAGE 6: APPROACHING EARTH
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.76) / 0.10;
      desiredPos.set(0, 12.0 - t * 8.0, 24.0 - t * 15.0);
      desiredLookAt.set(0, 0, 0);
    } else if (scrollProgress < 0.94) {
      // ─────────────────────────────────────────────
      // STAGE 7: EARTH ORBITAL ENVIRONMENT
      // ─────────────────────────────────────────────
      const t = (scrollProgress - 0.86) / 0.08;
      desiredPos.set(2.0 * Math.sin(t * Math.PI), 2.8, 8.5);
      desiredLookAt.set(0, 0, 0);
    } else {
      // ─────────────────────────────────────────────
      // STAGE 8 & 9: CONJUNCTION & RISK ANALYSIS
      // ─────────────────────────────────────────────
      const t = Math.min(1.0, (scrollProgress - 0.94) / 0.06);
      desiredPos.set(-0.2 + t * 0.4, 0.6 + t * 0.4, 4.2 - t * 0.8);
      desiredLookAt.set(0, 0, 0);
    }

    // Smooth lerp camera movement
    currentPos.current.lerp(desiredPos, 0.08);
    currentLookAt.current.lerp(desiredLookAt, 0.08);

    state.camera.position.copy(currentPos.current);
    state.camera.lookAt(currentLookAt.current);
  });

  return null;
}

/**
 * Master Continuous 3D Space Experience Canvas
 */
export default function ExperienceCanvas({
  scrollProgress = 0,
  layers = {
    leo: true,
    sso: true,
    meo: true,
    geo: true,
    satellites: true,
    debris: true,
    orbitLines: true,
    labels: true,
  },
  onSelectPlanet,
  onSelectSatellite,
}) {
  // Determine visibility and opacity cross-fades between continuous stages
  const showLaunchScene = scrollProgress < 0.52;
  const showEarthGlobe = scrollProgress >= 0.35;
  const showSolarSystem = scrollProgress >= 0.50 && scrollProgress <= 0.84;
  const showOrbitalEnv = scrollProgress >= 0.82;
  const showConjunction = scrollProgress >= 0.92;

  // Earth scale and position choreography
  const earthProps = useMemo(() => {
    if (scrollProgress < 0.55) {
      // Earth below rocket as it leaves
      const t = Math.max(0, (scrollProgress - 0.35) / 0.20);
      return {
        position: [0, -3.8 - t * 2.0, -1.0],
        radius: 3.2,
        opacity: Math.min(1.0, t * 1.5),
      };
    }
    if (scrollProgress < 0.78) {
      // In solar system, Earth is one of the orbiting planets (radius ~0.68)
      return {
        position: [0, -999, 0], // Hidden (handled inside SolarSystemScene)
        radius: 0.68,
        opacity: 0,
      };
    }
    // Approaching Earth & Orbital Environment
    const t = Math.min(1.0, (scrollProgress - 0.78) / 0.12);
    return {
      position: [0, 0, 0],
      radius: 2.4,
      opacity: Math.min(1.0, t * 1.5),
    };
  }, [scrollProgress]);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-auto bg-[#04060d]">
      <Canvas
        camera={{ position: [0, 2.5, 9.5], fov: 45 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        className="w-full h-full"
      >
        {/* Dynamic Space Background & Starfield */}
        <color attach="background" args={['#04060d']} />
        <Stars radius={180} depth={80} count={6000} factor={5} saturation={0.5} fade speed={1.2} />

        {/* Global Cinematic Lighting */}
        <ambientLight intensity={0.45} />
        <directionalLight position={[12, 10, 8]} intensity={1.4} castShadow />
        <pointLight position={[-10, -8, -5]} intensity={0.4} color="#38bdf8" />

        {/* Smooth Camera Controller */}
        <CameraController scrollProgress={scrollProgress} />

        {/* ─────────────────────────────────────────────────────────────
            SCENE 1, 2, 3: ROCKET LAUNCH & ASCENT
            ───────────────────────────────────────────────────────────── */}
        {showLaunchScene && (
          <RocketLaunchScene scrollProgress={scrollProgress} />
        )}

        {/* ─────────────────────────────────────────────────────────────
            SCENE 4, 6, 7: 3D EARTH GLOBE
            ───────────────────────────────────────────────────────────── */}
        {showEarthGlobe && earthProps.opacity > 0.01 && (
          <group position={earthProps.position}>
            <EarthGlobe radius={earthProps.radius} opacity={earthProps.opacity} />
          </group>
        )}

        {/* ─────────────────────────────────────────────────────────────
            SCENE 5: SOLAR SYSTEM (SUN + 8 REVOLVING PLANETS)
            ───────────────────────────────────────────────────────────── */}
        {showSolarSystem && (
          <SolarSystemScene onSelectPlanet={onSelectPlanet} />
        )}

        {/* ─────────────────────────────────────────────────────────────
            SCENE 7: EARTH ORBITAL ENVIRONMENT (LEO/SSO/MEO/GEO)
            ───────────────────────────────────────────────────────────── */}
        {showOrbitalEnv && !showConjunction && (
          <OrbitalEnvironment
            layers={layers}
            onSelectSatellite={onSelectSatellite}
          />
        )}

        {/* ─────────────────────────────────────────────────────────────
            SCENE 8 & 9: CONJUNCTION & RISK ANALYSIS (CARTOSAT vs FENGYUN)
            ───────────────────────────────────────────────────────────── */}
        {showConjunction && (
          <ConjunctionCloseApproach />
        )}

        {/* Interactive OrbitControls for free rotation on demand */}
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          enableRotate={scrollProgress >= 0.55 && scrollProgress <= 0.85}
          maxPolarAngle={Math.PI / 1.6}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>
    </div>
  );
}
