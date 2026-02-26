import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LotusGrowthState } from '../../utils/lotusGrowthModel';

interface LotusModelProps {
  growthState: LotusGrowthState;
  theme: string;
}

export function LotusModel({ growthState, theme }: LotusModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const petalRefs = useRef<THREE.Mesh[]>([]);
  const centerGlowRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);
  
  const isDark = theme === 'dark';
  
  // Colors based on theme
  const petalColor = useMemo(() => 
    new THREE.Color(isDark ? '#00ADB5' : '#008B94'), 
    [isDark]
  );
  const glowColor = useMemo(() => 
    new THREE.Color(isDark ? '#00D4DD' : '#00ADB5'), 
    [isDark]
  );
  
  // Create petal geometry
  const petalGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.3, 0.5, 0, 1);
    shape.quadraticCurveTo(-0.3, 0.5, 0, 0);
    
    const extrudeSettings = {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 3,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);
  
  // Fixed petal count (all petals always present)
  const PETAL_COUNT = 8;
  
  // Animation loop
  useFrame((state, delta) => {
    timeRef.current += delta;
    
    if (!groupRef.current) return;
    
    // Breathing animation
    const breathe = Math.sin(timeRef.current * 0.8) * growthState.breathingAmplitude + 1;
    groupRef.current.scale.setScalar(breathe);
    
    // Gentle rotation
    groupRef.current.rotation.y = Math.sin(timeRef.current * 0.1) * 0.05;
    
    // Animate petals - all use unified growth
    petalRefs.current.forEach((petal, i) => {
      if (!petal) return;
      
      // All petals use the same vividness for opacity
      const opacity = growthState.vividness * 0.85;
      
      // Fade in/out
      if (petal.material instanceof THREE.MeshStandardMaterial) {
        petal.material.opacity = opacity;
      }
      
      // Scale based on unified growth (all petals together)
      const scale = growthState.overallGrowth * growthState.petalSize;
      petal.scale.set(scale, scale, scale);
      
      // Opening animation: rotate petals outward as bloom opens
      const baseRotation = (i / PETAL_COUNT) * Math.PI * 2;
      const openingAngle = growthState.bloomOpenness * 0.4; // Max 0.4 radians outward
      petal.rotation.z = -openingAngle;
      petal.rotation.y = baseRotation;
      
      // Position petals in circle
      const radius = 0.3 + growthState.bloomOpenness * 0.2;
      petal.position.x = Math.cos(baseRotation) * radius;
      petal.position.z = Math.sin(baseRotation) * radius;
    });
    
    // Animate center glow
    if (centerGlowRef.current) {
      const pulseSpeed = growthState.capReached 
        ? 0.3 // Slow pulse at cap
        : 0.8;
      const pulse = Math.sin(timeRef.current * pulseSpeed * growthState.particlePulseRate) * 0.2 + 0.8;
      const glowScale = growthState.glowIntensity * pulse;
      centerGlowRef.current.scale.setScalar(glowScale);
      
      if (centerGlowRef.current.material instanceof THREE.MeshBasicMaterial) {
        centerGlowRef.current.material.opacity = growthState.glowIntensity * growthState.vividness * 0.6 * pulse;
      }
    }
  });
  
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Stem */}
      {growthState.petalSize > 0 && (
        <mesh position={[0, -0.8, 0]}>
          <cylinderGeometry args={[0.02, 0.03, 1.2, 8]} />
          <meshStandardMaterial 
            color={new THREE.Color('#2D5F3F')}
            opacity={(0.7 + growthState.petalSize * 0.3) * growthState.vividness}
            transparent
          />
        </mesh>
      )}
      
      {/* Petals - all present from start */}
      {Array.from({ length: PETAL_COUNT }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) petalRefs.current[i] = el;
          }}
          geometry={petalGeometry}
          position={[0, 0, 0]}
        >
          <meshStandardMaterial
            color={petalColor}
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
            emissive={glowColor}
            emissiveIntensity={growthState.glowIntensity * growthState.vividness * 0.3}
          />
        </mesh>
      ))}
      
      {/* Center glow */}
      <mesh ref={centerGlowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial
          color={glowColor}
          transparent
          opacity={0.6}
        />
      </mesh>
      
      {/* Soft light from center */}
      <pointLight
        position={[0, 0, 0]}
        color={glowColor}
        intensity={growthState.glowIntensity * growthState.vividness * 2}
        distance={3}
      />
    </group>
  );
}
