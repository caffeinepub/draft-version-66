/**
 * Lotus Growth Model with Layered Opening
 * 
 * Maps totalMinutes (0-20,000) to visual parameters with 4 petal layers present from start.
 * Layers open progressively (inner layers first) with geometric refinement and smooth vividness ramp.
 */

export interface LotusGrowthState {
  // Phase information
  phase: number;
  phaseProgress: number; // 0-1 within current phase
  capReached: boolean;
  
  // Unified growth parameters
  overallGrowth: number; // 0-1, drives all petals equally
  geometricMaturity: number; // 0-1, drives petal shape refinement
  vividness: number; // 0-1, drives opacity/brightness ramp
  
  // Visual parameters
  petalSize: number; // Overall petal scale (0-1)
  petalThickness: number; // Petal thickness (0-1)
  bloomOpenness: number; // How open the petals are (0-1)
  glowIntensity: number; // Center glow (0-1)
  
  // Layer-specific opening (4 layers)
  layerOpenness: [number, number, number, number]; // 0-1 for each layer
  
  // Particle parameters
  particleIntensity: number; // Particle count/brightness (0-1)
  particleCoherence: number; // Motion organization (0=chaotic, 1=organized)
  particlePulseRate: number; // Pulse frequency multiplier
  
  // Presence mode (at cap)
  breathingAmplitude: number; // Subtle breathing scale
  pulseLongInterval: number; // Seconds between pulses
}

// Define exponential phase thresholds (in minutes)
const PHASE_THRESHOLDS = [
  0,      // Phase 0: Seed (0-15 min)
  15,     // Phase 1: First emergence
  30,     // Phase 2: Initial growth
  50,     // Phase 3: Early bloom
  75,     // Phase 4: Developing
  100,    // Phase 5: Expanding
  150,    // Phase 6: Maturing
  200,    // Phase 7: Deepening
  300,    // Phase 8: Refining
  400,    // Phase 9: Harmonizing
  600,    // Phase 10: Integrating
  800,    // Phase 11: Mastering
  1200,   // Phase 12: Perfecting
  1600,   // Phase 13: Transcending
  2200,   // Phase 14: Radiating
  3000,   // Phase 15: Illuminating
  4000,   // Phase 16: Crystallizing
  5500,   // Phase 17: Resonating
  7000,   // Phase 18: Unifying
  9000,   // Phase 19: Embodying
  11000,  // Phase 20: Emanating
  13500,  // Phase 21: Transcendent
  16000,  // Phase 22: Luminous
  18500,  // Phase 23: Approaching full bloom
  20000,  // Phase 24: Full bloom (cap)
];

const MAX_MINUTES = 20000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function calculateLotusGrowth(totalMinutes: number): LotusGrowthState {
  const clampedMinutes = clamp(totalMinutes, 0, MAX_MINUTES);
  const capReached = clampedMinutes >= MAX_MINUTES;
  
  // Find current phase
  let phase = 0;
  for (let i = PHASE_THRESHOLDS.length - 1; i >= 0; i--) {
    if (clampedMinutes >= PHASE_THRESHOLDS[i]) {
      phase = i;
      break;
    }
  }
  
  // Calculate progress within current phase
  const phaseStart = PHASE_THRESHOLDS[phase];
  const phaseEnd = phase < PHASE_THRESHOLDS.length - 1 
    ? PHASE_THRESHOLDS[phase + 1] 
    : MAX_MINUTES;
  const phaseProgress = phaseEnd > phaseStart 
    ? (clampedMinutes - phaseStart) / (phaseEnd - phaseStart)
    : 1;
  
  // Overall progress (0-1)
  const overallProgress = clampedMinutes / MAX_MINUTES;
  
  // Unified growth: starts visible (0.2 at 0 minutes), grows to 1.0
  const overallGrowth = 0.2 + smoothstep(0, 1, overallProgress) * 0.8;
  
  // Geometric maturity: drives petal shape refinement
  const geometricMaturity = smoothstep(0, 1, Math.pow(overallProgress, 0.85));
  
  // Vividness ramp: smooth opacity/brightness from subdued to vivid
  const vividness = smoothstep(0, 1, Math.pow(overallProgress, 0.7));
  
  // Petal size: scales with overall growth
  const petalSize = overallGrowth;
  
  // Petal thickness: increases gradually with maturity
  const petalThickness = smoothstep(0, 1, geometricMaturity * 0.9);
  
  // Bloom openness: average of all layers
  const bloomOpenness = smoothstep(0, 1, geometricMaturity);
  
  // Layer-specific opening (inner layers open earlier and faster)
  // Layer 0 (innermost): opens first, starts at 0%, reaches 100% at ~40% progress
  // Layer 1 (inner-mid): opens second, starts at 0%, reaches 100% at ~60% progress
  // Layer 2 (outer-mid): opens third, starts at 0%, reaches 100% at ~80% progress
  // Layer 3 (outermost): opens last, starts at 0%, reaches 100% at 100% progress
  
  const layer0Openness = smoothstep(0, 0.4, overallProgress);
  const layer1Openness = smoothstep(0.1, 0.6, overallProgress);
  const layer2Openness = smoothstep(0.2, 0.8, overallProgress);
  const layer3Openness = smoothstep(0.3, 1.0, overallProgress);
  
  const layerOpenness: [number, number, number, number] = [
    layer0Openness,
    layer1Openness,
    layer2Openness,
    layer3Openness,
  ];
  
  // Glow intensity: increases throughout, peaks at full bloom
  const glowIntensity = smoothstep(0, 1, overallProgress);
  
  // Particle intensity: increases with overall progress
  const particleIntensity = smoothstep(0, 1, overallProgress);
  
  // Particle coherence: starts chaotic (0), becomes organized (1) at later stages
  const particleCoherence = smoothstep(0, 1, Math.pow(overallProgress, 1.5));
  
  // Particle pulse rate: increases with progress, then stabilizes
  const particlePulseRate = 0.5 + overallProgress * 1.5;
  
  // Presence mode parameters (active when cap reached)
  const breathingAmplitude = capReached ? 0.03 : 0.05; // Subtle at cap
  const pulseLongInterval = capReached ? 8 : 4; // Longer intervals at cap
  
  return {
    phase,
    phaseProgress,
    capReached,
    overallGrowth,
    geometricMaturity,
    vividness,
    petalSize,
    petalThickness,
    bloomOpenness,
    glowIntensity,
    layerOpenness,
    particleIntensity,
    particleCoherence,
    particlePulseRate,
    breathingAmplitude,
    pulseLongInterval,
  };
}
