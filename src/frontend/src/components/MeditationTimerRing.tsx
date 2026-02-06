import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface MeditationTimerRingProps {
  progress: number; // 0 to 1
  size?: number;
  strokeWidth?: number;
}

export default function MeditationTimerRing({
  progress,
  size = 280,
  strokeWidth = 12,
}: MeditationTimerRingProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const animationFrameRef = useRef<number | undefined>(undefined);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = (size - strokeWidth) / 2;

    const animate = () => {
      timeRef.current += 0.02;
      
      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Get theme colors
      const isDark = theme === 'dark';
      const fillColor = isDark 
        ? 'rgba(112, 224, 224, 0.15)' // accent-cyan with opacity
        : 'rgba(0, 173, 181, 0.12)';
      const glowColor = isDark
        ? 'rgba(112, 224, 224, 0.4)'
        : 'rgba(0, 173, 181, 0.35)';
      const strokeColor = isDark
        ? 'rgba(112, 224, 224, 0.25)'
        : 'rgba(0, 173, 181, 0.2)';

      // Draw background circle (unfilled portion)
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.stroke();

      if (progress > 0) {
        // Calculate end angle for progress
        const startAngle = -Math.PI / 2; // Start at top
        const endAngle = startAngle + (Math.PI * 2 * progress);

        // Create wave points along the arc
        const waveAmplitude = 3;
        const waveFrequency = 8;
        const numPoints = 100;
        
        // Draw filled area with wave edge
        ctx.save();
        ctx.beginPath();
        
        // Create clipping path for the filled area
        for (let i = 0; i <= numPoints * progress; i++) {
          const angle = startAngle + (Math.PI * 2 * progress * i / numPoints);
          const wave = Math.sin(angle * waveFrequency + timeRef.current * 2) * waveAmplitude;
          const r = radius + wave;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        // Complete the path to center and back
        ctx.lineTo(centerX, centerY);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        
        ctx.restore();

        // Draw glowing edge at the progress boundary
        ctx.save();
        const glowAngle = endAngle;
        const glowWave = Math.sin(glowAngle * waveFrequency + timeRef.current * 2) * waveAmplitude;
        const glowRadius = radius + glowWave;
        
        // Create radial gradient for glow
        const glowX = centerX + glowRadius * Math.cos(glowAngle);
        const glowY = centerY + glowRadius * Math.sin(glowAngle);
        const gradient = ctx.createRadialGradient(glowX, glowY, 0, glowX, glowY, 20);
        gradient.addColorStop(0, glowColor);
        gradient.addColorStop(1, 'rgba(112, 224, 224, 0)');
        
        ctx.beginPath();
        ctx.arc(glowX, glowY, 20, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        ctx.restore();

        // Draw progress arc stroke with wave
        ctx.beginPath();
        for (let i = 0; i <= numPoints * progress; i++) {
          const angle = startAngle + (Math.PI * 2 * progress * i / numPoints);
          const wave = Math.sin(angle * waveFrequency + timeRef.current * 2) * waveAmplitude;
          const r = radius + wave;
          const x = centerX + r * Math.cos(angle);
          const y = centerY + r * Math.sin(angle);
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = isDark 
          ? 'rgba(112, 224, 224, 0.6)'
          : 'rgba(0, 173, 181, 0.5)';
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
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
  }, [progress, size, strokeWidth, theme]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className="drop-shadow-lg"
    />
  );
}
