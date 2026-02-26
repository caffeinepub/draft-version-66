import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { LotusGrowthState } from '../../utils/lotusGrowthModel';

interface LotusParticlesProps {
  growthState: LotusGrowthState;
  theme: string;
}

export function LotusParticles({ growthState, theme }: LotusParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  
  const isDark = theme === 'dark';
  const particleColor = useMemo(() => 
    new THREE.Color(isDark ? '#00D4DD' : '#00ADB5'), 
    [isDark]
  );
  
  // Particle count based on intensity
  const particleCount = Math.floor(50 + growthState.particleIntensity * 150);
  
  // Create particle geometry and initial positions
  const { geometry, velocities } = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random position in sphere around lotus
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const radius = 0.5 + Math.random() * 1.5;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta) - 0.5;
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random velocity
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    return { geometry, velocities };
  }, [particleCount]);
  
  // Animation loop
  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    
    timeRef.current += delta;
    
    const positionAttribute = pointsRef.current.geometry.attributes.position;
    const positions = positionAttribute.array as Float32Array;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Current position
      let x = positions[i3];
      let y = positions[i3 + 1];
      let z = positions[i3 + 2];
      
      if (growthState.capReached || growthState.particleCoherence > 0.7) {
        // Coherent mode: particles orbit in organized patterns
        const angle = timeRef.current * 0.3 + i * 0.1;
        const radius = 1 + Math.sin(timeRef.current * 0.5 + i * 0.2) * 0.3;
        const height = Math.sin(timeRef.current * 0.4 + i * 0.15) * 0.8;
        
        const targetX = Math.cos(angle) * radius;
        const targetY = height;
        const targetZ = Math.sin(angle) * radius;
        
        // Smooth interpolation to target
        const lerpFactor = 0.02 * growthState.particleCoherence;
        x += (targetX - x) * lerpFactor;
        y += (targetY - y) * lerpFactor;
        z += (targetZ - z) * lerpFactor;
      } else {
        // Chaotic mode: random brownian motion
        const chaosFactor = 1 - growthState.particleCoherence;
        x += velocities[i3] * chaosFactor;
        y += velocities[i3 + 1] * chaosFactor;
        z += velocities[i3 + 2] * chaosFactor;
        
        // Update velocities with some randomness
        velocities[i3] += (Math.random() - 0.5) * 0.001 * chaosFactor;
        velocities[i3 + 1] += (Math.random() - 0.5) * 0.001 * chaosFactor;
        velocities[i3 + 2] += (Math.random() - 0.5) * 0.001 * chaosFactor;
        
        // Damping
        velocities[i3] *= 0.99;
        velocities[i3 + 1] *= 0.99;
        velocities[i3 + 2] *= 0.99;
        
        // Keep particles in bounds
        const distance = Math.sqrt(x * x + y * y + z * z);
        if (distance > 2.5) {
          x *= 0.95;
          y *= 0.95;
          z *= 0.95;
        }
      }
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
    }
    
    positionAttribute.needsUpdate = true;
    
    // Pulsating opacity
    const material = pointsRef.current.material as THREE.PointsMaterial;
    const pulse = Math.sin(timeRef.current * growthState.particlePulseRate) * 0.2 + 0.8;
    material.opacity = growthState.particleIntensity * 0.6 * pulse;
  });
  
  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.03}
        color={particleColor}
        transparent
        opacity={0.6}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
