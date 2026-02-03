import { useEffect, useRef } from 'react';
import { useTheme } from 'next-themes';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  hue: number;
}

interface LotusCanvasProps {
  variant?: 'default' | 'enhanced';
}

export default function LotusCanvas({ variant = 'default' }: LotusCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const particleCount = 50;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 60 + 180 // Blues to purples
      });
    }

    // Enhanced visibility multipliers based on variant and theme
    const getVisibilityMultiplier = () => {
      if (variant === 'enhanced') {
        return theme === 'dark' ? 1.3 : 2.0; // Slightly higher for dark, much higher for light
      }
      return 1.0; // Default visibility
    };

    // Lotus petals animation - slightly smaller with faster pulse timing
    let time = 0;
    const getLotusPosition = () => ({
      x: canvas.width / 2,
      y: canvas.height / 2
    });

    const drawLotus = () => {
      const { x: lotusX, y: lotusY } = getLotusPosition();
      const petalCount = 7;
      const baseRadius = 42; // Slightly smaller overall
      const visibilityMultiplier = getVisibilityMultiplier();
      // Faster pulse timing with increased amplitude
      const breathe = Math.sin(time * 0.0005) * 12; // Faster timing (0.0005 vs 0.0003) and bigger amplitude

      ctx.save();
      ctx.translate(lotusX, lotusY);

      // Enhanced center glow with bigger circular wave pulsation
      const glowRadius = baseRadius + breathe + 45; // Bigger diffuse radius
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
      gradient.addColorStop(0, `rgba(0, 173, 181, ${0.35 * visibilityMultiplier})`); // Higher opacity at center
      gradient.addColorStop(0.5, `rgba(0, 173, 181, ${0.15 * visibilityMultiplier})`); // Enhanced mid-range glow
      gradient.addColorStop(1, 'rgba(0, 173, 181, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Consistent serene color #00ADB5
      const petalR = 0;
      const petalG = 140;
      const petalB = 147;

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2;
        const radius = baseRadius + breathe;

        ctx.save();
        ctx.rotate(angle);

        // Subtle transparency for elegance with enhanced visibility
        ctx.fillStyle = `rgba(${petalR}, ${petalG}, ${petalB}, ${0.15 * visibilityMultiplier})`;
        ctx.beginPath();
        ctx.ellipse(0, -radius / 2, radius / 2.5, radius, 0, 0, Math.PI * 2);
        ctx.fill();

        // Sharpened petal edges with enhanced visibility
        ctx.strokeStyle = `rgba(${petalR}, ${petalG - 20}, ${petalB - 20}, ${0.75 * visibilityMultiplier})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.ellipse(0, -radius / 2, radius / 2.5, radius, 0, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
      }

      // Simplified center geometry - single circle with enhanced visibility
      const centerRadius = 12;
      ctx.fillStyle = `rgba(${petalR}, ${petalG}, ${petalB}, ${0.12 * visibilityMultiplier})`;
      ctx.beginPath();
      ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
      ctx.fill();

      // Center outline with sharper definition and enhanced visibility
      ctx.strokeStyle = `rgba(${petalR}, ${petalG - 20}, ${petalB - 20}, ${0.75 * visibilityMultiplier})`;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.arc(0, 0, centerRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    };

    const drawParticles = () => {
      const visibilityMultiplier = getVisibilityMultiplier();
      particles.forEach((particle) => {
        ctx.fillStyle = `hsla(${particle.hue}, 70%, 70%, ${particle.opacity * visibilityMultiplier})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();

        // Update position with slower movement
        particle.x += particle.vx * 0.8;
        particle.y += particle.vy * 0.8;

        // Wrap around screen
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Gentle opacity pulse
        particle.opacity = 0.2 + Math.sin(time * 0.0002 + particle.x * 0.01) * 0.3;
      });
    };

    const drawRipples = () => {
      const { x: lotusX, y: lotusY } = getLotusPosition();
      const rippleCount = 4; // More ripples for bigger wave effect
      const maxRadius = 120; // Bigger circular wave pulsation
      const visibilityMultiplier = getVisibilityMultiplier();

      for (let i = 0; i < rippleCount; i++) {
        const phase = (time * 0.0003 + i * 0.25) % 1; // Faster timing
        const radius = phase * maxRadius;
        const opacity = (1 - phase) * 0.08 * visibilityMultiplier; // Enhanced visibility

        ctx.strokeStyle = `hsla(195, 70%, 70%, ${opacity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(lotusX, lotusY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      drawRipples();
      drawLotus();
      drawParticles();

      time += 8; // Faster overall animation
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, variant]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none opacity-50 z-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}
