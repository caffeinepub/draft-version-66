import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface MusicOption {
  id: string;
  name: string;
  icon: string;
  audio: string;
}

const musicOptions: MusicOption[] = [
  {
    id: 'temple',
    name: 'Temple Bells',
    icon: '/assets/temple.png',
    audio: '/assets/Temple.mp3',
  },
  {
    id: 'singing-bowl',
    name: 'Singing Bowl',
    icon: '/assets/singing-bowl.png',
    audio: '/assets/Singing bowl.mp3',
  },
  {
    id: 'rain',
    name: 'Gentle Rain',
    icon: '/assets/rainy.png',
    audio: '/assets/Rain.mp3',
  },
  {
    id: 'ocean',
    name: 'Ocean Waves',
    icon: '/assets/ocean wave.png',
    audio: '/assets/Ocean.mp3',
  },
  {
    id: 'soothing',
    name: 'Soothing Melody',
    icon: '/assets/soothing.png',
    audio: '/assets/Soothing.mp3',
  },
  {
    id: 'birds',
    name: 'Forest Birds',
    icon: '/assets/birds.png',
    audio: '/assets/Birds.mp3',
  },
  {
    id: 'crickets',
    name: 'Night Crickets',
    icon: '/assets/cricket.png',
    audio: '/assets/Crickets.mp3',
  },
];

interface AmbientMusicCarouselProps {
  selectedMusic: string;
  onSelectMusic: (id: string) => void;
  volume: number;
  onVolumeChange: (volume: number) => void;
}

export default function AmbientMusicCarousel({ selectedMusic, onSelectMusic, volume, onVolumeChange }: AmbientMusicCarouselProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = musicOptions.findIndex((m) => m.id === selectedMusic);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    // Stop and clean up any previous audio immediately
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }

    // Only start new audio if not muted
    const selectedOption = musicOptions.find((m) => m.id === selectedMusic);
    if (selectedOption && !isMuted) {
      const audio = new Audio(selectedOption.audio);
      audio.loop = true;
      audio.volume = volume / 100;
      
      audio.addEventListener('loadedmetadata', () => {
        // Start from middle of track
        audio.currentTime = audio.duration / 2;
        audio.play().catch((error) => {
          console.log('Audio autoplay prevented:', error);
        });
      });
      
      audioRef.current = audio;
    }

    // Cleanup function to stop audio when component unmounts or dependencies change
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, [selectedMusic, isMuted]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current && !isMuted) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume, isMuted]);

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? musicOptions.length - 1 : currentIndex - 1;
    onSelectMusic(musicOptions[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = currentIndex === musicOptions.length - 1 ? 0 : currentIndex + 1;
    onSelectMusic(musicOptions[newIndex].id);
  };

  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    
    if (audioRef.current) {
      if (newMutedState) {
        audioRef.current.pause();
      } else {
        audioRef.current.volume = volume / 100;
        audioRef.current.play().catch((error) => {
          console.log('Audio play prevented:', error);
        });
      }
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    onVolumeChange(newVolume);
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  const getCardStyle = (index: number) => {
    const totalItems = musicOptions.length;
    let diff = index - currentIndex;
    
    // Calculate shortest circular distance
    if (diff > totalItems / 2) {
      diff -= totalItems;
    } else if (diff < -totalItems / 2) {
      diff += totalItems;
    }

    const absDiff = Math.abs(diff);

    // Center item (position 0)
    if (absDiff === 0) {
      return {
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto' as const,
        visibility: 'visible' as const,
      };
    } 
    // Adjacent items (±1) - left and right visible items
    else if (absDiff === 1) {
      const offset = diff > 0 ? 200 : -200;
      return {
        transform: `translate(calc(-50% + ${offset}px), -50%) scale(0.8)`,
        opacity: 0.5,
        zIndex: 20,
        pointerEvents: 'none' as const,
        visibility: 'visible' as const,
      };
    } 
    // All other items - completely hidden
    else {
      return {
        transform: `translate(-50%, -50%) scale(0.5)`,
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        visibility: 'hidden' as const,
      };
    }
  };

  return (
    <div className="relative w-full">
      {/* Carousel Container with strong overflow hidden */}
      <div 
        ref={containerRef}
        className="relative h-[260px] sm:h-[300px] overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {musicOptions.map((music, index) => {
            const style = getCardStyle(index);
            const isCenter = index === currentIndex;

            return (
              <div
                key={music.id}
                className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                style={style}
              >
                <div
                  className={`
                    w-36 sm:w-44 h-52 sm:h-60 flex flex-col items-center justify-center text-center space-y-3
                    transition-all duration-300
                  `}
                >
                  <div className={`transition-all duration-300 ${isCenter ? 'scale-110' : ''}`}>
                    <img 
                      src={music.icon} 
                      alt={music.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                      style={{
                        filter: 'brightness(0) saturate(100%) invert(64%) sepia(89%) saturate(1234%) hue-rotate(145deg) brightness(95%) contrast(101%)'
                      }}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground px-2 whitespace-normal break-words">{music.name}</h3>
                  {isCenter && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="rounded-full hover:bg-accent-cyan/10 transition-all duration-300"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-accent-cyan" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-accent-cyan" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Volume Slider - No top margin */}
      <div className="flex items-center justify-center gap-4 px-8 sm:px-16">
        <VolumeX className="w-4 h-4 text-accent-cyan/60" />
        <Slider
          value={[volume]}
          onValueChange={handleVolumeChange}
          min={0}
          max={100}
          step={5}
          className="w-full max-w-xs"
        />
        <Volume2 className="w-5 h-5 text-accent-cyan" />
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-center gap-6 sm:gap-8 mt-4">
        <Button
          onClick={handlePrevious}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-accent-cyan" />
        </Button>
        <Button
          onClick={handleNext}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-accent-cyan" />
        </Button>
      </div>
    </div>
  );
}
