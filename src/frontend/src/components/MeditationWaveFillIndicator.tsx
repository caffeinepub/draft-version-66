import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';

interface MeditationWaveFillIndicatorProps {
  progress: number; // 0 to 1 (0 = empty/start, 1 = full/complete)
  width?: number;
  height?: number;
}

export default function MeditationWaveFillIndicator({
  progress,
  width = 320,
  height = 480,
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
    targetProgressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      timeRef.current += 0.015;

      // Smooth ease-in-out interpolation toward target progress
      const diff = targetProgressRef.current - currentProgressRef.current;
      if (Math.abs(diff) > 0.001) {
        // Ease-in-out cubic function
        const easeInOutCubic = (t: number): number => {
          return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        };
        
        const step = diff * 0.08; // Smooth transition speed
        const easedStep = step * easeInOutCubic(Math.abs(step) * 10);
        currentProgressRef.current += easedStep;
      } else {
        currentProgressRef.current = targetProgressRef.current;
      }

      setDisplayedProgress(currentProgressRef.current);

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Get theme colors
      const isDark = theme === 'dark';
      const fillColor = isDark 
        ? 'rgba(112, 224, 224, 0.25)' // accent-cyan
        : 'rgba(0, 173, 181, 0.2)';
      const waveColor = isDark
        ? 'rgba(112, 224, 224, 0.4)'
        : 'rgba(0, 173, 181, 0.35)';
      const containerStroke = isDark
        ? 'rgba(112, 224, 224, 0.15)'
        : 'rgba(0, 173, 181, 0.12)';

      // Draw container outline
      ctx.strokeStyle = containerStroke;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, width - 2, height - 2);

      // Calculate fill height (bottom to top)
      const fillHeight = height * currentProgressRef.current;
      const fillY = height - fillHeight;

      if (fillHeight > 0) {
        // Draw filled area
        ctx.fillStyle = fillColor;
        ctx.fillRect(0, fillY, width, fillHeight);

        // Draw animated wave surface at the top of the fill
        const waveAmplitude = 8;
        const waveFrequency = 0.015;
        const waveSpeed = timeRef.current * 1.5;
        const numPoints = 200;

        ctx.beginPath();
        ctx.moveTo(0, fillY);

        // Draw wave line
        for (let i = 0; i <= numPoints; i++) {
          const x = (width * i) / numPoints;
          const wave1 = Math.sin(x * waveFrequency + waveSpeed) * waveAmplitude;
          const wave2 = Math.sin(x * waveFrequency * 1.5 - waveSpeed * 0.7) * (waveAmplitude * 0.5);
          const y = fillY + wave1 + wave2;
          ctx.lineTo(x, y);
        }

        // Complete the wave fill shape
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        // Fill wave area
        ctx.fillStyle = waveColor;
        ctx.fill();

        // Draw wave stroke for definition
        ctx.beginPath();
        for (let i = 0; i <= numPoints; i++) {
          const x = (width * i) / numPoints;
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

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [width, height, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="drop-shadow-lg rounded-lg"
    />
  );
}
