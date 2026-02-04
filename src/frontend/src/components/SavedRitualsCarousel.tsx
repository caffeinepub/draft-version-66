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
  showArrows?: boolean;
}

export default function SavedRitualsCarousel({ 
  rituals, 
  onStart, 
  onDelete, 
  isDeleting = false,
  showArrows = true 
}: SavedRitualsCarouselProps) {
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

  const handleDeleteConfirm = () => {
    if (ritualToDelete) {
      onDelete(ritualToDelete);
      setDeleteDialogOpen(false);
      setRitualToDelete(null);
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
  const showNavigationArrows = showArrows && rituals.length >= 2;

  return (
    <>
      <div className={`relative max-w-2xl mx-auto ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>
        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="relative overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-between">
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

        {/* Arrow Controls - shown on all screen sizes when enabled */}
        {showNavigationArrows && (
          <>
            {/* Mobile Arrow Controls */}
            <div className="flex md:hidden absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none px-2">
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="icon"
                className="pointer-events-auto rounded-full bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-10 h-10"
                aria-label="Previous ritual"
                disabled={isDeleting}
              >
                <ChevronLeft className="w-5 h-5 text-accent-cyan" />
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="pointer-events-auto rounded-full bg-card/90 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300 w-10 h-10"
                aria-label="Next ritual"
                disabled={isDeleting}
              >
                <ChevronRight className="w-5 h-5 text-accent-cyan" />
              </Button>
            </div>

            {/* Desktop Arrow Controls */}
            <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 left-0 right-0 justify-between pointer-events-none">
              <Button
                onClick={handlePrevious}
                variant="ghost"
                size="icon"
                className="pointer-events-auto -ml-12 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300"
                aria-label="Previous ritual"
                disabled={isDeleting}
              >
                <ChevronLeft className="w-5 h-5 text-accent-cyan" />
              </Button>
              <Button
                onClick={handleNext}
                variant="ghost"
                size="icon"
                className="pointer-events-auto -mr-12 rounded-full bg-card/80 backdrop-blur-sm border border-border/50 hover:bg-card hover:scale-110 transition-all duration-300"
                aria-label="Next ritual"
                disabled={isDeleting}
              >
                <ChevronRight className="w-5 h-5 text-accent-cyan" />
              </Button>
            </div>
          </>
        )}

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {rituals.map((_, index) => (
            <button
              key={index}
              onClick={() => !isDeleting && setActiveIndex(index)}
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
