import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Pause, Play, Volume2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import MeditationWaveFillIndicator from '@/components/MeditationWaveFillIndicator';
import { useMeditationTimer } from '@/hooks/useMeditationTimer';
import { getAmbientSoundPath } from '@/utils/ambientSounds';
import StandardPageNav from '@/components/StandardPageNav';

export default function ActiveMeditationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as {
    type?: string;
    duration?: string;
    ambientSound?: string;
    ambientSoundVolume?: string;
  };

  const duration = search.duration ? parseInt(search.duration, 10) : 15;
  const ambientSound = search.ambientSound || 'temple';
  const initialVolume = search.ambientSoundVolume ? parseInt(search.ambientSoundVolume, 10) : 50;

  const [volume, setVolume] = useState(initialVolume);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    timeRemaining,
    totalTime,
    isPaused,
    progress,
    togglePause,
    seekTime,
    formatTime,
  } = useMeditationTimer({
    durationMinutes: duration,
    autoStart: true,
    onComplete: () => {
      // Fade out audio smoothly before stopping
      if (audioRef.current) {
        const fadeOutInterval = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
          } else {
            clearInterval(fadeOutInterval);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }
        }, 100);
      }
      // Navigate back to dashboard after completion
      navigate({ to: '/dashboard' });
    },
  });

  // Setup and cleanup audio
  useEffect(() => {
    const soundPath = getAmbientSoundPath(ambientSound);
    const audio = new Audio(soundPath);
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch((err) => console.error('Audio playback failed:', err));
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [ambientSound]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Sync audio playback with timer pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => console.error('Audio playback failed:', err));
      }
    }
  }, [isPaused]);

  const handleBack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    navigate({ to: '/dashboard' });
  };

  const handleTimeSeek = (value: number[]) => {
    const newTime = value[0];
    seekTime(newTime);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navigation - always visible on all screen sizes */}
      <StandardPageNav showBackButton={true} onBack={handleBack} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 pt-16">
        {/* Timer Display with Wave Fill */}
        <div className="relative mb-8">
          <MeditationWaveFillIndicator progress={progress} size={280} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-6xl font-light text-foreground">
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>

        {/* Play/Pause Button - Perfect circular shape */}
        <Button
          onClick={togglePause}
          size="lg"
          className="mb-8 h-16 w-16 rounded-full bg-accent-cyan/20 hover:bg-accent-cyan/30 border border-accent-cyan/40 shadow-lg hover:shadow-glow transition-all"
        >
          {isPaused ? (
            <Play className="h-8 w-8 text-accent-cyan ml-1" />
          ) : (
            <Pause className="h-8 w-8 text-accent-cyan" />
          )}
        </Button>

        {/* Volume and Time Controls */}
        <div className="w-full max-w-md space-y-4">
          {/* Volume Control - no vertical padding on outer wrapper */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6 py-3">
            <div className="flex items-center gap-4">
              <Volume2 className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Volume
                </label>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground w-12 text-right">
                {volume}%
              </span>
            </div>
          </div>

          {/* Time Seek Control - no vertical padding on outer wrapper */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-lg px-6 py-3">
            <div className="flex items-center gap-4">
              <Clock className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">
                  Seek Time
                </label>
                <Slider
                  value={[timeRemaining]}
                  onValueChange={handleTimeSeek}
                  min={0}
                  max={totalTime}
                  step={1}
                  className="w-full"
                />
              </div>
              <span className="text-sm text-muted-foreground w-16 text-right">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
