import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ChevronLeft, ChevronRight, Trash2, Loader2, Timer } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Ritual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
  displayName: string;
}

interface SavedRitualsCarouselProps {
  rituals: Ritual[];
  onStart: (ritual: Ritual) => void;
  onDelete: (ritual: Ritual) => Promise<void>;
  isDeleting?: boolean;
}

// Meditation type icon mapping (same as MeditationCarousel)
const meditationIcons: Record<string, string> = {
  mindfulness: '/assets/mindfulness.png',
  metta: '/assets/meta.png',
  visualization: '/assets/visualization.png',
  ifs: '/assets/ifs.png',
};

// Meditation type display names
const meditationNames: Record<string, string> = {
  mindfulness: 'Mindfulness',
  metta: 'Metta',
  visualization: 'Visualization',
  ifs: 'IFS',
};

// Ambient sound icon mapping (same as AmbientMusicCarousel)
const ambientSoundIcons: Record<string, string> = {
  temple: '/assets/temple.png',
  'singing-bowl': '/assets/singing-bowl.png',
  rain: '/assets/rainy.png',
  ocean: '/assets/ocean wave.png',
  soothing: '/assets/soothing.png',
  birds: '/assets/birds.png',
  crickets: '/assets/cricket.png',
};

// Ambient sound display names
const ambientSoundNames: Record<string, string> = {
  temple: 'Temple Bells',
  'singing-bowl': 'Singing Bowl',
  rain: 'Gentle Rain',
  ocean: 'Ocean Waves',
  soothing: 'Soothing Melody',
  birds: 'Forest Birds',
  crickets: 'Night Crickets',
};

export default function SavedRitualsCarousel({ rituals, onStart, onDelete, isDeleting = false }: SavedRitualsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ritualToDelete, setRitualToDelete] = useState<Ritual | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Normalize active index when rituals array changes (e.g., after deletion)
  useEffect(() => {
    if (rituals.length > 0 && activeIndex >= rituals.length) {
      setActiveIndex(Math.max(0, rituals.length - 1));
    }
  }, [rituals.length, activeIndex]);

  const handlePrevious = () => {
    if (isDeleting) return;
    setActiveIndex((prev) => (prev === 0 ? rituals.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (isDeleting) return;
    setActiveIndex((prev) => (prev === rituals.length - 1 ? 0 : prev + 1));
  };

  const handleDeleteClick = (ritual: Ritual) => {
    if (isDeleting) return;
    setRitualToDelete(ritual);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (ritualToDelete) {
      try {
        await onDelete(ritualToDelete);
        setDeleteDialogOpen(false);
        setRitualToDelete(null);
      } catch (error) {
        // Error is handled by parent component
        setDeleteDialogOpen(false);
        setRitualToDelete(null);
      }
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isDeleting) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDeleting) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isDeleting || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Render ritual card content with chips
  const renderRitualCard = (ritual: Ritual, isActive: boolean) => {
    const meditationIcon = meditationIcons[ritual.meditationType] || meditationIcons.mindfulness;
    const meditationName = meditationNames[ritual.meditationType] || ritual.meditationType;
    const ambientIcon = ambientSoundIcons[ritual.ambientSound] || ambientSoundIcons.soothing;
    const ambientName = ambientSoundNames[ritual.ambientSound] || ritual.ambientSound;

    return (
      <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300">
        {/* Chips Row - wraps on narrow screens */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {/* Meditation Type Chip */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-full">
            <img 
              src={meditationIcon} 
              alt={meditationName}
              className="w-4 h-4 object-contain"
              style={{
                filter: 'brightness(0) saturate(100%) invert(64%) sepia(89%) saturate(1234%) hue-rotate(145deg) brightness(95%) contrast(101%)'
              }}
            />
            <span className="text-[16px] font-medium text-foreground whitespace-nowrap">
              {meditationName}
            </span>
          </span>

          {/* Duration Chip */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-full">
            <Timer className="w-4 h-4 text-accent-cyan" />
            <span className="text-[16px] font-medium text-foreground whitespace-nowrap">
              {ritual.duration} minutes
            </span>
          </span>

          {/* Ambient Sound Chip */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/30 rounded-full">
            <img 
              src={ambientIcon} 
              alt={ambientName}
              className="w-4 h-4 object-contain"
              style={{
                filter: 'brightness(0) saturate(100%) invert(64%) sepia(89%) saturate(1234%) hue-rotate(145deg) brightness(95%) contrast(101%)'
              }}
            />
            <span className="text-[16px] font-medium text-foreground whitespace-nowrap">
              {ambientName}
            </span>
          </span>
        </div>

        {/* Action Buttons - only show for active card */}
        {isActive && (
          <div className="flex items-center justify-end gap-2">
            {isDeleting ? (
              <Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
            ) : (
              <>
                <Button
                  onClick={() => handleDeleteClick(ritual)}
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full p-2"
                  aria-label="Delete ritual"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => onStart(ritual)}
                  size="sm"
                  className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all duration-300"
                  disabled={isDeleting}
                >
                  <Play className="w-4 h-4 mr-1" fill="currentColor" />
                  Start
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  // Single ritual: no carousel needed
  if (rituals.length === 1) {
    const ritual = rituals[0];
    return (
      <>
        <div className={`max-w-2xl mx-auto mb-6 select-none ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
          {renderRitualCard(ritual, true)}
        </div>

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Ritual</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this ritual? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Calculate card style based on position relative to active index
  const getCardStyle = (index: number) => {
    const totalItems = rituals.length;
    let diff = index - activeIndex;
    
    // Calculate shortest circular distance
    if (diff > totalItems / 2) {
      diff -= totalItems;
    } else if (diff < -totalItems / 2) {
      diff += totalItems;
    }

    const absDiff = Math.abs(diff);

    // Center item (active)
    if (absDiff === 0) {
      return {
        transform: 'translateX(-50%) scale(1)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto' as const,
        visibility: 'visible' as const,
      };
    } 
    // All non-active items - completely hidden with opacity 0
    else {
      return {
        transform: 'translateX(-50%) scale(0.8)',
        opacity: 0,
        zIndex: 0,
        pointerEvents: 'none' as const,
        visibility: 'hidden' as const,
      };
    }
  };

  // Multiple rituals: carousel with navigation
  return (
    <>
      <div className={`relative max-w-2xl mx-auto ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Carousel Container - increased min-height and bottom margin for wrapping chips */}
        <div
          ref={containerRef}
          className="relative min-h-[180px] py-2 mb-10 overflow-visible select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="absolute inset-0 flex items-start justify-center pt-2">
            {rituals.map((ritual, index) => {
              const style = getCardStyle(index);
              const isActive = index === activeIndex;

              return (
                <div
                  key={`${ritual.timestamp}-${index}`}
                  className="absolute left-1/2 w-full transition-all duration-500 ease-out"
                  style={style}
                >
                  {renderRitualCard(ritual, isActive)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Row: Left Arrow, Dots, Right Arrow */}
        <div className="flex items-center justify-center gap-3">
          <Button
            onClick={handlePrevious}
            variant="ghost"
            size="icon"
            className="rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-8 h-8"
            aria-label="Previous ritual"
            disabled={isDeleting}
          >
            <ChevronLeft className="w-5 h-5 text-accent-cyan" />
          </Button>

          {/* Dot Indicators */}
          <div className="flex justify-center gap-2">
            {rituals.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (!isDeleting) {
                    setActiveIndex(index);
                  }
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === activeIndex
                    ? 'bg-accent-cyan w-6'
                    : 'bg-border hover:bg-accent-cyan/50'
                }`}
                aria-label={`Go to ritual ${index + 1}`}
                disabled={isDeleting}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            variant="ghost"
            size="icon"
            className="rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-8 h-8"
            aria-label="Next ritual"
            disabled={isDeleting}
          >
            <ChevronRight className="w-5 h-5 text-accent-cyan" />
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ritual</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ritual? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
