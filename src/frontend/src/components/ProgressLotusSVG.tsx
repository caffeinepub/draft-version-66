import { useEffect, useState } from 'react';
import { calculateLotusGrowth } from '../utils/lotusGrowthModel';

interface ProgressLotusSVGProps {
  totalMinutes: number;
  currentStreak: number;
  theme: string;
}

export default function ProgressLotusSVG({ totalMinutes, currentStreak, theme }: ProgressLotusSVGProps) {
  const [time, setTime] = useState(0);
  const growthState = calculateLotusGrowth(totalMinutes);
  
  // Animate time for subtle breathing/pulsing
  useEffect(() => {
    let animationFrame: number;
    let lastTime = Date.now();
    
    const animate = () => {
      const now = Date.now();
      const delta = (now - lastTime) / 1000;
      lastTime = now;
      
      setTime(t => t + delta);
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, []);
  
  // Calculate streak-based glow boost (bounded)
  const streakGlowBoost = Math.min(0.6, currentStreak * 0.04 + Math.sqrt(currentStreak) * 0.08);
  
  // Base glow from growth model
  const baseGlow = growthState.glowIntensity;
  const totalGlow = Math.min(1, baseGlow + streakGlowBoost);
  
  // Breathing animation (subtle, calmer near cap)
  const breathingSpeed = growthState.capReached ? 0.3 : 0.5;
  const breathingAmplitude = growthState.breathingAmplitude;
  const breathingScale = 1 + Math.sin(time * breathingSpeed) * breathingAmplitude;
  
  // Pulse animation for glow (very subtle)
  const pulseSpeed = growthState.capReached ? 0.2 : 0.4;
  const glowPulse = 1 + Math.sin(time * pulseSpeed) * 0.1;
  
  // Theme colors with vividness applied
  const isDark = theme === 'dark';
  
  // Base colors (at full vividness)
  const baseL = isDark ? 0.75 : 0.65;
  const baseC = isDark ? 0.15 : 0.18;
  
  // Apply vividness ramp: reduce lightness and chroma at low vividness
  const vividnessL = baseL * (0.4 + growthState.vividness * 0.6); // 40% to 100% of base lightness
  const vividnessC = baseC * (0.3 + growthState.vividness * 0.7); // 30% to 100% of base chroma
  
  const petalColor = `oklch(${vividnessL} ${vividnessC} 195)`;
  const petalStroke = isDark 
    ? `oklch(${vividnessL * 0.87} ${vividnessC * 0.8} 195)` 
    : `oklch(${vividnessL * 0.85} ${vividnessC * 0.83} 195)`;
  
  const centerColor = isDark 
    ? `oklch(${0.85 * (0.5 + growthState.vividness * 0.5)} ${0.08 * (0.4 + growthState.vividness * 0.6)} 80)` 
    : `oklch(${0.75 * (0.5 + growthState.vividness * 0.5)} ${0.12 * (0.4 + growthState.vividness * 0.6)} 80)`;
  
  const glowColor = isDark 
    ? `oklch(${0.65 * (0.5 + growthState.vividness * 0.5)} ${0.12 * (0.4 + growthState.vividness * 0.6)} 195)` 
    : `oklch(${0.60 * (0.5 + growthState.vividness * 0.5)} ${0.15 * (0.4 + growthState.vividness * 0.6)} 195)`;
  
  // Define 4 petal layers (all present from start)
  // Layer structure: innermost (4 petals), inner-mid (6 petals), outer-mid (8 petals), outermost (10 petals)
  const layers = [
    { count: 4, baseRadius: 8, name: 'innermost' },
    { count: 6, baseRadius: 18, name: 'inner-mid' },
    { count: 8, baseRadius: 30, name: 'outer-mid' },
    { count: 10, baseRadius: 44, name: 'outermost' },
  ];
  
  // Layer-specific opening rates (inner layers open faster/earlier)
  const getLayerOpenness = (layerIndex: number) => {
    // Inner layers start opening earlier and reach full openness sooner
    const opennessCurve = [
      growthState.layerOpenness[0], // innermost: opens first
      growthState.layerOpenness[1], // inner-mid: opens second
      growthState.layerOpenness[2], // outer-mid: opens third
      growthState.layerOpenness[3], // outermost: opens last
    ];
    return opennessCurve[layerIndex];
  };
  
  // Create all petals for all layers
  const allPetals: Array<{
    layerIndex: number;
    petalIndex: number;
    angle: number;
    x: number;
    y: number;
    length: number;
    width: number;
    rotation: number;
    openness: number;
  }> = [];
  
  layers.forEach((layer, layerIndex) => {
    const layerOpenness = getLayerOpenness(layerIndex);
    const openRadius = layer.baseRadius + layerOpenness * (22 + layerIndex * 8);
    
    // Petal size scales with unified growth and layer position
    const layerSizeMultiplier = 0.7 + layerIndex * 0.15; // Outer layers are larger
    const petalLength = (32 + layerIndex * 8) * growthState.petalSize * layerSizeMultiplier;
    const petalWidth = (14 + layerIndex * 4) * growthState.petalSize * layerSizeMultiplier;
    
    for (let i = 0; i < layer.count; i++) {
      const angle = (i / layer.count) * Math.PI * 2 - Math.PI / 2 + (layerIndex * 0.15); // Slight rotation offset per layer
      
      allPetals.push({
        layerIndex,
        petalIndex: i,
        angle,
        x: Math.cos(angle) * openRadius,
        y: Math.sin(angle) * openRadius,
        length: petalLength,
        width: petalWidth,
        rotation: (angle * 180) / Math.PI,
        openness: layerOpenness,
      });
    }
  });
  
  // Create lotus petal path with geometric maturity-driven refinement
  const createPetalPath = (width: number, length: number, maturity: number) => {
    const halfWidth = width / 2;
    const halfLength = length / 2;
    
    // Tip sharpness: becomes more pointed with maturity
    const tipSharpness = 0.5 + maturity * 0.5;
    const tipY = -halfLength;
    
    // Side concavity: becomes more pronounced with maturity
    const sideIndent = halfWidth * (0.05 + maturity * 0.15);
    
    // Base curvature: tighter at base with maturity
    const baseCurvature = 0.8 - maturity * 0.15;
    
    // Control point positions evolve with maturity
    const topControlX = halfWidth * (0.7 - maturity * 0.1);
    const topControlY = tipY + halfLength * (0.4 - maturity * 0.1);
    
    const midControlY = halfLength * (0.2 - maturity * 0.1);
    
    return `
      M 0,${tipY}
      Q ${topControlX},${topControlY} ${halfWidth - sideIndent},${midControlY}
      Q ${halfWidth},${halfLength * 0.5} ${halfWidth * baseCurvature},${halfLength}
      Q 0,${halfLength - halfLength * 0.15} ${-halfWidth * baseCurvature},${halfLength}
      Q ${-halfWidth},${halfLength * 0.5} ${-(halfWidth - sideIndent)},${midControlY}
      Q ${-topControlX},${topControlY} 0,${tipY}
      Z
    `;
  };
  
  // Apply vividness to overall opacity
  const baseOpacity = 0.3 + growthState.vividness * 0.7;
  
  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        viewBox="-150 -150 300 300"
        className="w-full h-full"
        style={{ maxWidth: '100%', maxHeight: '100%', overflow: 'visible' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Glow filter with expanded region */}
          <filter id="lotus-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation={3 * totalGlow * glowPulse * growthState.vividness} result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
          {/* Radial gradient for center */}
          <radialGradient id="center-gradient">
            <stop offset="0%" stopColor={centerColor} stopOpacity={0.9 * growthState.vividness} />
            <stop offset="70%" stopColor={centerColor} stopOpacity={0.6 * growthState.vividness} />
            <stop offset="100%" stopColor={centerColor} stopOpacity={0} />
          </radialGradient>
          
          {/* Petal gradient with vividness */}
          <linearGradient id="petal-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={petalColor} stopOpacity={0.95 * baseOpacity} />
            <stop offset="50%" stopColor={petalColor} stopOpacity={0.85 * baseOpacity} />
            <stop offset="100%" stopColor={petalColor} stopOpacity={0.7 * baseOpacity} />
          </linearGradient>
        </defs>
        
        {/* Main lotus group with breathing animation */}
        <g transform={`scale(${breathingScale})`}>
          {/* Petals - all layers present from start, open progressively by layer */}
          {allPetals.map((petal, i) => (
            <g
              key={i}
              transform={`translate(${petal.x}, ${petal.y}) rotate(${petal.rotation})`}
              opacity={baseOpacity}
            >
              {/* Lotus petal shape with maturity-driven geometric refinement */}
              <path
                d={createPetalPath(petal.width, petal.length, growthState.geometricMaturity)}
                fill="url(#petal-gradient)"
                stroke={petalStroke}
                strokeWidth={1.5 * growthState.petalThickness}
                filter="url(#lotus-glow)"
              />
              
              {/* Petal vein (subtle detail, more visible with maturity) */}
              <line
                x1={0}
                y1={-petal.length / 2}
                x2={0}
                y2={petal.length / 2}
                stroke={petalStroke}
                strokeWidth={0.5}
                opacity={0.2 + growthState.geometricMaturity * 0.2}
              />
            </g>
          ))}
          
          {/* Center circle with glow */}
          <circle
            cx={0}
            cy={0}
            r={15 + totalGlow * 5}
            fill="url(#center-gradient)"
            filter="url(#lotus-glow)"
            opacity={0.9 * growthState.vividness}
          />
          
          {/* Inner center detail */}
          <circle
            cx={0}
            cy={0}
            r={8}
            fill={centerColor}
            opacity={0.8 * growthState.vividness}
          />
          
          {/* Glow ring (visible when glow is high) */}
          {totalGlow > 0.3 && (
            <circle
              cx={0}
              cy={0}
              r={20 + totalGlow * 10}
              fill="none"
              stroke={glowColor}
              strokeWidth={2}
              opacity={totalGlow * 0.4 * glowPulse * growthState.vividness}
              filter="url(#lotus-glow)"
            />
          )}
          
          {/* Outer glow ring (visible at high growth) */}
          {totalGlow > 0.6 && (
            <circle
              cx={0}
              cy={0}
              r={35 + totalGlow * 15}
              fill="none"
              stroke={glowColor}
              strokeWidth={1.5}
              opacity={totalGlow * 0.25 * glowPulse * growthState.vividness}
              filter="url(#lotus-glow)"
            />
          )}
        </g>
        
        {/* Ambient particles (subtle dots that fade in/out) */}
        {growthState.particleIntensity > 0.2 && (
          <g opacity={growthState.particleIntensity * 0.6 * growthState.vividness}>
            {Array.from({ length: 12 }, (_, i) => {
              const angle = (i / 12) * Math.PI * 2 + time * 0.1;
              const radius = 70 + Math.sin(time * 0.3 + i) * 15;
              const x = Math.cos(angle) * radius;
              const y = Math.sin(angle) * radius;
              const opacity = 0.3 + Math.sin(time * 0.5 + i * 0.5) * 0.3;
              
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r={1.5}
                  fill={glowColor}
                  opacity={opacity * growthState.particleIntensity * growthState.vividness}
                />
              );
            })}
          </g>
        )}
      </svg>
    </div>
  );
}
