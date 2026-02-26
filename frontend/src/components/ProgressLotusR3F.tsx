import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { LotusModel } from './lotus-r3f/LotusModel';
import { LotusParticles } from './lotus-r3f/LotusParticles';
import { calculateLotusGrowth } from '../utils/lotusGrowthModel';

interface ProgressLotusR3FProps {
  totalMinutes: number;
  theme: string;
}

export default function ProgressLotusR3F({ totalMinutes, theme }: ProgressLotusR3FProps) {
  const growthState = calculateLotusGrowth(totalMinutes);
  
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
      >
        <color attach="background" args={['transparent']} />
        
        {/* Ambient light */}
        <ambientLight intensity={0.4} />
        
        {/* Main directional light */}
        <directionalLight
          position={[5, 5, 5]}
          intensity={0.8}
          castShadow
        />
        
        {/* Fill light */}
        <directionalLight
          position={[-3, 2, -3]}
          intensity={0.3}
        />
        
        {/* Lotus model */}
        <LotusModel growthState={growthState} theme={theme} />
        
        {/* Particles */}
        <LotusParticles growthState={growthState} theme={theme} />
        
        {/* Optional: Allow user to rotate view */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
