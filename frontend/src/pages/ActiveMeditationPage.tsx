import { useRef, useEffect } from 'react';
import { Pause, Play, Volume2, Clock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import MeditationWaveFillIndicator from '@/components/MeditationWaveFillIndicator';
import PageBackgroundShell from '@/components/PageBackgroundShell';
import StandardPageNav from '@/components/StandardPageNav';

interface ActiveMeditationPageProps {
  timeRemaining: number;
  totalTime: number;
  isPaused: boolean;
  progress: number;
  volume: number;
  ambientSoundId: string;
  onTogglePause: () => void;
  onSeekTime: (value: number) => void;
  onVolumeChange: (value: number) => void;
  onBack: () => void;
  formatTime: (seconds: number) => string;
}

export default function ActiveMeditationPage({
  timeRemaining,
  totalTime,
  isPaused,
  progress,
  volume,
  onTogglePause,
  onSeekTime,
  onVolumeChange,
  onBack,
  formatTime,
}: ActiveMeditationPageProps) {
  return (
    <PageBackgroundShell variant="premed" intensity={0.5}>
      {/* StandardPageNav handles back button visibility on ALL screen sizes */}
      <StandardPageNav showBackButton={true} onBack={onBack} />

      {/* Main Content */}
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-8 pt-16">
        <div className="w-full max-w-md space-y-8">
          {/* Timer Display with Wave Fill */}
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <MeditationWaveFillIndicator progress={progress} size={280} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl font-bold text-foreground tabular-nums">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            </div>

            {/* Play/Pause Button - perfectly circular */}
            <button
              onClick={onTogglePause}
              className="premed-play-pause-btn"
              aria-label={isPaused ? 'Resume meditation' : 'Pause meditation'}
            >
              {isPaused ? (
                <Play className="h-8 w-8 text-accent-cyan" fill="currentColor" />
              ) : (
                <Pause className="h-8 w-8 text-accent-cyan" fill="currentColor" />
              )}
            </button>
          </div>

          {/* Volume Control Container — no extra outer padding, only CardContent padding */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 shadow-xl rounded-lg">
            <div className="px-6 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <Volume2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label className="text-sm font-medium text-foreground">Volume</label>
              </div>
              <Slider
                value={[volume]}
                onValueChange={(values) => onVolumeChange(values[0])}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span className="text-accent-cyan font-semibold">{volume}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          {/* Time Control Container — no extra outer padding, only CardContent padding */}
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 shadow-xl rounded-lg">
            <div className="px-6 py-3 space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <label className="text-sm font-medium text-foreground">Time</label>
              </div>
              <Slider
                value={[timeRemaining]}
                onValueChange={(values) => onSeekTime(values[0])}
                min={0}
                max={totalTime}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span className="text-accent-cyan font-semibold">{formatTime(timeRemaining)}</span>
                <span>{formatTime(totalTime)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageBackgroundShell>
  );
}
