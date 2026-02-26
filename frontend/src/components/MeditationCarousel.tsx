import { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MeditationType {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  recommended?: boolean;
}

const meditations: MeditationType[] = [
  {
    id: 'mindfulness',
    name: 'Mindfulness',
    tagline: 'Focus and present-moment awareness',
    icon: '/assets/mindfulness.png',
    recommended: true,
  },
  {
    id: 'metta',
    name: 'Metta',
    tagline: 'Loving-kindness and compassion',
    icon: '/assets/meta.png',
  },
  {
    id: 'visualization',
    name: 'Visualization',
    tagline: 'Guided imagery and mental visualization',
    icon: '/assets/visualization.png',
  },
  {
    id: 'ifs',
    name: 'IFS',
    tagline: 'Internal Family Systems meditation',
    icon: '/assets/ifs.png',
  },
  {
    id: 'quiz',
    name: 'Take Quiz',
    tagline: 'Personalized recommendation',
    icon: '/assets/quiz.png',
  },
];

interface MeditationCarouselProps {
  selectedMeditation: string;
  onSelectMeditation: (id: string) => void;
}

export default function MeditationCarousel({ selectedMeditation, onSelectMeditation }: MeditationCarouselProps) {
  const currentIndex = meditations.findIndex((m) => m.id === selectedMeditation);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  const handlePrevious = () => {
    const newIndex = currentIndex === 0 ? meditations.length - 1 : currentIndex - 1;
    onSelectMeditation(meditations[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = currentIndex === meditations.length - 1 ? 0 : currentIndex + 1;
    onSelectMeditation(meditations[newIndex].id);
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
    const totalItems = meditations.length;
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
      const offset = diff > 0 ? 240 : -240;
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
        className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden select-none"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {meditations.map((meditation, index) => {
            const style = getCardStyle(index);
            const isCenter = index === currentIndex;

            return (
              <div
                key={meditation.id}
                className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                style={style}
              >
                <div
                  className={`
                    w-48 sm:w-56 md:w-64 h-64 sm:h-72 md:h-80 flex flex-col items-center justify-center text-center space-y-4 sm:space-y-5 md:space-y-6
                    transition-all duration-300
                  `}
                >
                  <div className={`transition-all duration-300 ${isCenter ? 'scale-110' : ''}`}>
                    <img 
                      src={meditation.icon} 
                      alt={meditation.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 object-contain"
                      style={{
                        filter: 'brightness(0) saturate(100%) invert(64%) sepia(89%) saturate(1234%) hue-rotate(145deg) brightness(95%) contrast(101%)'
                      }}
                    />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-semibold text-foreground px-2 whitespace-normal break-words">{meditation.name}</h3>
                  <p className="text-sm sm:text-base text-description-gray leading-relaxed px-4 font-medium whitespace-normal break-words">{meditation.tagline}</p>
                  {meditation.recommended && isCenter && (
                    <div className="text-xs sm:text-sm text-accent-cyan font-semibold px-3 py-1 rounded-full bg-accent-cyan/10 border border-accent-cyan/30">
                      Recommended
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows - No top margin */}
      <div className="flex justify-center gap-6 sm:gap-8">
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
