import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { ambientSounds } from '../utils/ambientSounds';
import { ambientAudioManager } from '../utils/ambientAudioManager';

interface AmbientMusicCarouselProps {
  selectedMusic: string;
  onSelectMusic: (musicId: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function AmbientMusicCarousel({
  selectedMusic,
  onSelectMusic,
  volume,
  onVolumeChange,
}: AmbientMusicCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Find initial index based on selectedMusic
  useEffect(() => {
    const index = ambientSounds.findIndex((sound) => sound.id === selectedMusic);
    if (index !== -1) {
      setCurrentIndex(index);
    }
  }, [selectedMusic]);

  // Cleanup preview audio on unmount
  useEffect(() => {
    return () => {
      ambientAudioManager.stop();
    };
  }, []);

  const handlePrev = () => {
    const newIndex = (currentIndex - 1 + ambientSounds.length) % ambientSounds.length;
    setCurrentIndex(newIndex);
    onSelectMusic(ambientSounds[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = (currentIndex + 1) % ambientSounds.length;
    setCurrentIndex(newIndex);
    onSelectMusic(ambientSounds[newIndex].id);
  };

  const handlePreview = () => {
    const currentSound = ambientSounds[currentIndex];
    
    // If already playing this sound, stop it
    if (ambientAudioManager.isPlaying() && ambientAudioManager.getCurrentSoundId() === currentSound.id) {
      ambientAudioManager.stop();
    } else {
      // Play the new sound
      ambientAudioManager.play(currentSound.audioPath, currentSound.id, volume / 100, true);
    }
  };

  const currentSound = ambientSounds[currentIndex];
  const isPlaying = ambientAudioManager.isPlaying() && ambientAudioManager.getCurrentSoundId() === currentSound.id;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          className="shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        <div className="flex flex-col items-center gap-3 flex-1">
          <button
            onClick={handlePreview}
            className="relative group"
          >
            <img
              src={currentSound.icon}
              alt={currentSound.name}
              className="w-24 h-24 rounded-xl object-cover border-2 border-border group-hover:border-accent-cyan transition-all shadow-lg"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                <Volume2 className="w-8 h-8 text-white animate-pulse" />
              </div>
            )}
          </button>
          <div className="text-center">
            <p className="font-medium">{currentSound.name}</p>
            <p className="text-xs text-muted-foreground">
              {isPlaying ? 'Playing preview' : 'Click to preview'}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="shrink-0"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-sm text-muted-foreground flex items-center gap-2">
          <Volume2 className="w-4 h-4" />
          Volume: {volume}%
        </Label>
        <Slider
          value={[volume]}
          onValueChange={(vals) => {
            onVolumeChange(vals[0]);
            // Update preview volume if playing
            if (ambientAudioManager.isPlaying()) {
              ambientAudioManager.setVolume(vals[0] / 100);
            }
          }}
          min={0}
          max={100}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
}
