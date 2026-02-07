import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface MeditationWaveFillIndicatorProps {
  progress: number; // 0 to 1 (0 = empty/start, 1 = full/complete)
  size?: number;
}

export default function MeditationWaveFillIndicator({
  progress,
  size = 280,
}: MeditationWaveFillIndicatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);
  
  // Smoothly interpolate displayed fill level with ease-in-out
  const [displayedProgress, setDisplayedProgress] = useState(progress);
  const targetProgressRef = useRef(progress);
  const currentProgressRef = useRef(progress);

  useEffect(() => {
    // Clamp incoming progress to [0, 1]
    targetProgressRef.current = Math.max(0, Math.min(1, progress));
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 6; // Leave room for border

    const animate = () => {
      timeRef.current += 0.015;

      // Smooth ease-in-out interpolation toward target progress
      const diff = targetProgressRef.current - currentProgressRef.current;
      const epsilon = 0.001;
      
      if (Math.abs(diff) > epsilon) {
        // Ease-in-out cubic function
        const easeInOutCubic = (t: number): number => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const step = diff * 0.08; // Smooth transition speed
        const easedStep = step * easeInOutCubic(Math.abs(step) * 10);
        currentProgressRef.current += easedStep;
      } else {
        // Snap to exact target when close enough
        currentProgressRef.current = targetProgressRef.current;
      }

      // Clamp current progress to [0, 1] to prevent overshoot/undershoot
      currentProgressRef.current = Math.max(0, Math.min(1, currentProgressRef.current));

      setDisplayedProgress(currentProgressRef.current);

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Get theme colors
      const isDark = theme === 'dark';
      const fillColor = isDark 
        ? 'rgba(112, 224, 224, 0.25)' // accent-cyan
        : 'rgba(0, 173, 181, 0.2)';
      const waveColor = isDark
        ? 'rgba(112, 224, 224, 0.4)'
        : 'rgba(0, 173, 181, 0.35)';
      const borderColor = isDark
        ? 'rgba(112, 224, 224, 0.3)'
        : 'rgba(0, 173, 181, 0.25)';

      // Create circular clipping region
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.clip();

      // Calculate fill height (bottom to top)
      const fillHeight = radius * 2 * currentProgressRef.current;
      const fillY = centerY + radius - fillHeight;

      if (fillHeight > 0) {
        // Draw filled area (bottom to top within circle)
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, fillY, size, fillHeight);

        // Draw animated wave surface at the top of the fill
        const waveAmplitude = 6;
        const waveFrequency = 0.02;
        const waveSpeed = timeRef.current * 1.5;
        const numPoints = 200;

        ctx.beginPath();
        ctx.moveTo(0, fillY);

        // Draw wave line
        for (let i = 0; i <= numPoints; i++) {
          const x = (size * i) / numPoints;
          const wave1 = Math.sin(x * waveFrequency + waveSpeed) * waveAmplitude;
          const wave2 = Math.sin(x * waveFrequency * 1.5 - waveSpeed * 0.7) * (waveAmplitude * 0.5);
          const y = fillY + wave1 + wave2;
          ctx.lineTo(x, y);
        }

        // Complete the wave fill shape
        ctx.lineTo(size, size);
        ctx.lineTo(0, size);
        ctx.closePath();

        // Fill wave area
        ctx.fillStyle = waveColor;
        ctx.fill();

        // Draw wave stroke for definition
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const x = (size * i) / numPoints;
          const wave1 = Math.sin(x * waveFrequency + waveSpeed) * waveAmplitude;
          const wave2 = Math.sin(x * waveFrequency * 1.5 - waveSpeed * 0.7) * (waveAmplitude * 0.5);
          const y = fillY + wave1 + wave2;
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = isDark 
          ? 'rgba(112, 224, 224, 0.6)'
          : 'rgba(0, 173, 181, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();

      // Draw circular border (medium thickness)
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [size, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="drop-shadow-lg"
      style={{ borderRadius: '50%' }}
    />
  );
}
