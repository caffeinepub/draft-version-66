import { useEffect, useRef } from 'react';

interface ProgressBowlProps {
  totalMinutes: number;
  theme: string;
}

export default function ProgressBowl({ totalMinutes, theme }: ProgressBowlProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    // Increase render size to accommodate glow/shadow overflow
    const displaySize = 300;
    const renderSize = 400; // Larger internal render size
    const scale = renderSize / displaySize;
    
    canvas.width = renderSize * dpr;
    canvas.height = renderSize * dpr;
    canvas.style.width = `${displaySize}px`;
    canvas.style.height = `${displaySize}px`;
    ctx.scale(dpr * scale, dpr * scale);

    const centerX = displaySize / 2;
    const centerY = displaySize / 2;
    const bowlWidth = 160;
    const bowlHeight = 100;
    // Shift bowl upward to remove top empty space
    const bowlTop = centerY - 50;

    // Calculate fill level (0-1, capped at 20000 minutes)
    const fillRatio = Math.min(totalMinutes / 20000, 1);

    // Colors based on theme
    const bowlColor = theme === 'dark' 
      ? 'oklch(0.70 0.15 195)' // accent-cyan for dark
      : 'oklch(0.65 0.12 195)'; // accent-cyan for light
    
    const liquidColor = theme === 'dark'
      ? 'oklch(0.70 0.15 195)' // accent-cyan
      : 'oklch(0.65 0.12 195)';

    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, displaySize, displaySize);
      time += 0.02;

      // Draw bowl outline with glow
      ctx.save();
      
      // Bowl glow effect - multiple layers
      const glowLayers = [
        { blur: 25, alpha: 0.3 },
        { blur: 15, alpha: 0.4 },
        { blur: 8, alpha: 0.5 },
      ];

      glowLayers.forEach(({ blur, alpha }) => {
        ctx.shadowBlur = blur;
        ctx.shadowColor = theme === 'dark' 
          ? `oklch(0.70 0.15 195 / ${alpha})`
          : `oklch(0.65 0.12 195 / ${alpha})`;
        ctx.strokeStyle = bowlColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        // Bowl shape - elliptical arc
        ctx.ellipse(
          centerX,
          bowlTop + bowlHeight,
          bowlWidth / 2,
          bowlHeight / 2,
          0,
          0,
          Math.PI,
          false
        );
        
        // Connect sides
        ctx.lineTo(centerX - bowlWidth / 2, bowlTop);
        ctx.lineTo(centerX + bowlWidth / 2, bowlTop);
        ctx.closePath();
        ctx.stroke();
      });

      // Final solid bowl outline
      ctx.shadowBlur = 0;
      ctx.strokeStyle = bowlColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        bowlTop + bowlHeight,
        bowlWidth / 2,
        bowlHeight / 2,
        0,
        0,
        Math.PI,
        false
      );
      ctx.lineTo(centerX - bowlWidth / 2, bowlTop);
      ctx.lineTo(centerX + bowlWidth / 2, bowlTop);
      ctx.closePath();
      ctx.stroke();

      ctx.restore();

      if (fillRatio > 0) {
        // Calculate liquid fill height
        const maxFillHeight = bowlHeight - 5;
        const currentFillHeight = maxFillHeight * fillRatio;
        const liquidTop = bowlTop + bowlHeight - currentFillHeight;

        // Create clipping path for liquid (inside bowl)
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(
          centerX,
          bowlTop + bowlHeight,
          bowlWidth / 2 - 3,
          bowlHeight / 2 - 3,
          0,
          0,
          Math.PI,
          false
        );
        ctx.lineTo(centerX - bowlWidth / 2 + 3, bowlTop + 3);
        ctx.lineTo(centerX + bowlWidth / 2 - 3, bowlTop + 3);
        ctx.closePath();
        ctx.clip();

        // Draw liquid with double-wave effect
        ctx.fillStyle = liquidColor;
        ctx.beginPath();
        
        // Start from left edge
        ctx.moveTo(centerX - bowlWidth / 2, liquidTop);
        
        // Create double-wave pattern across the top
        const waveAmplitude1 = 2 + fillRatio * 1.5; // Primary wave
        const waveAmplitude2 = 1.5 + fillRatio * 1; // Secondary wave
        const waveFrequency1 = 0.06;
        const waveFrequency2 = 0.11; // Different frequency for second wave
        const numPoints = 120;
        
        for (let i = 0; i <= numPoints; i++) {
          const x = centerX - bowlWidth / 2 + (bowlWidth * i) / numPoints;
          // Combine two sine waves with different frequencies and phases
          const wave1 = Math.sin(time + i * waveFrequency1) * waveAmplitude1;
          const wave2 = Math.sin(time * 1.3 + i * waveFrequency2 + Math.PI / 3) * waveAmplitude2;
          const waveOffset = wave1 + wave2;
          const y = liquidTop + waveOffset;
          ctx.lineTo(x, y);
        }
        
        // Complete the liquid shape to bottom of bowl
        ctx.lineTo(centerX + bowlWidth / 2, bowlTop + bowlHeight);
        ctx.ellipse(
          centerX,
          bowlTop + bowlHeight,
          bowlWidth / 2 - 3,
          bowlHeight / 2 - 3,
          0,
          0,
          Math.PI,
          false
        );
        ctx.closePath();
        ctx.fill();

        // Add glow effect that increases with fill
        const glowIntensity = fillRatio * 0.6;
        ctx.shadowBlur = 20 + fillRatio * 30;
        ctx.shadowColor = theme === 'dark'
          ? `oklch(0.70 0.15 195 / ${glowIntensity})`
          : `oklch(0.65 0.12 195 / ${glowIntensity})`;
        ctx.fill();

        ctx.restore();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [totalMinutes, theme]);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
      />
    </div>
  );
}
