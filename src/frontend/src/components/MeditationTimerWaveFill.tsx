import { useEffect, useRef } from 'react';

interface MeditationTimerWaveFillProps {
  progress: number;
  timeText: string;
}

export default function MeditationTimerWaveFill({ progress, timeText }: MeditationTimerWaveFillProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;

    let waveOffset = 0;

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Get theme colors
      const isDark = document.documentElement.classList.contains('dark');
      const fillColor = isDark ? 'rgba(112, 224, 229, 0.3)' : 'rgba(0, 173, 181, 0.3)';
      const waveColor = isDark ? 'rgba(112, 224, 229, 0.6)' : 'rgba(0, 173, 181, 0.6)';

      // Calculate fill height (bottom to top)
      const fillHeight = height * progress;
      const fillY = height - fillHeight;

      // Draw filled area
      ctx.fillStyle = fillColor;
      ctx.fillRect(0, fillY, width, fillHeight);

      // Draw wave at the top edge of the fill
      if (progress > 0 && progress < 1) {
        ctx.beginPath();
        ctx.moveTo(0, fillY);

        const waveAmplitude = 8;
        const waveFrequency = 0.02;

        for (let x = 0; x <= width; x++) {
          const y = fillY + Math.sin((x + waveOffset) * waveFrequency) * waveAmplitude;
          ctx.lineTo(x, y);
        }

        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = waveColor;
        ctx.fill();

        waveOffset += 2;
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [progress]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%' }}
      />
      <div className="relative z-10 text-center">
        <p className="text-5xl sm:text-6xl font-bold text-accent-cyan drop-shadow-lg">
          {timeText}
        </p>
      </div>
    </div>
  );
}
