import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, ChevronLeft, ChevronRight, Trash2, Loader2 } from 'lucide-react';
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
  onDelete: (ritual: Ritual) => void;
  isDeleting?: boolean;
}

export default function SavedRitualsCarousel({ 
  rituals, 
  onStart, 
  onDelete, 
  isDeleting = false,
}: SavedRitualsCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ritualToDelete, setRitualToDelete] = useState<Ritual | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
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
    if (isDeleting || isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev === 0 ? rituals.length - 1 : prev - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isDeleting || isTransitioning) return;
    setIsTransitioning(true);
    setActiveIndex((prev) => (prev === rituals.length - 1 ? 0 : prev + 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleDotClick = (index: number) => {
    if (isDeleting || isTransitioning || index === activeIndex) return;
    setIsTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleDeleteClick = (ritual: Ritual) => {
    if (isDeleting) return;
    setRitualToDelete(ritual);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (ritualToDelete) {
      onDelete(ritualToDelete);
      setDeleteDialogOpen(false);
      setRitualToDelete(null);
    }
  };

  const onTouchStart = (e: React.TouchEvent) => {
    if (isDeleting || isTransitioning) return;
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (isDeleting || isTransitioning) return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (isDeleting || isTransitioning || !touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrevious();
    }
  };

  // Single ritual: no carousel needed
  if (rituals.length === 1) {
    const ritual = rituals[0];
    return (
      <>
        <div className={`bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between max-w-2xl mx-auto ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex-1">
            <p className="text-base sm:text-lg font-medium text-foreground">
              {ritual.displayName}
            </p>
          </div>
          <div className="flex items-center gap-2">
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
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Multiple rituals: carousel with navigation
  const currentRitual = rituals[activeIndex];
  const showNavigationArrows = rituals.length >= 2;

  return (
    <>
      <div className={`relative max-w-2xl mx-auto ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Carousel Container with slide animation */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div 
            className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between"
            style={{
              animation: isTransitioning ? 'slideIn 0.3s ease-out' : 'none',
            }}
          >
            <div className="flex-1">
              <p className="text-base sm:text-lg font-medium text-foreground">
                {currentRitual.displayName}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isDeleting ? (
                <Loader2 className="w-5 h-5 text-accent-cyan animate-spin" />
              ) : (
                <>
                  <Button
                    onClick={() => handleDeleteClick(currentRitual)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-full p-2"
                    aria-label="Delete ritual"
                    disabled={isDeleting}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => onStart(currentRitual)}
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
          </div>
        </div>

        {/* Controls Row: Left Arrow, Dots, Right Arrow */}
        {showNavigationArrows && (
          <div className="flex items-center justify-center gap-3 mt-4">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="icon"
              className="rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-8 h-8 shrink-0"
              aria-label="Previous ritual"
              disabled={isDeleting || isTransitioning}
            >
              <ChevronLeft className="w-5 h-5 text-accent-cyan" />
            </Button>

            {/* Dot Indicators */}
            <div className="flex justify-center gap-2">
              {rituals.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleDotClick(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === activeIndex
                      ? 'bg-accent-cyan w-6'
                      : 'bg-border hover:bg-accent-cyan/50'
                  }`}
                  aria-label={`Go to ritual ${index + 1}`}
                  disabled={isDeleting || isTransitioning}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              variant="ghost"
              size="icon"
              className="rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-8 h-8 shrink-0"
              aria-label="Next ritual"
              disabled={isDeleting || isTransitioning}
            >
              <ChevronRight className="w-5 h-5 text-accent-cyan" />
            </Button>
          </div>
        )}
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
