import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  title: string;
  icon: string;
}

interface KnowledgeCategoryCarouselProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export default function KnowledgeCategoryCarousel({
  categories,
  selectedId,
  onSelect,
}: KnowledgeCategoryCarouselProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const selectedIndex = categories.findIndex((c) => c.id === selectedId);

  const handlePrevious = () => {
    const newIndex = selectedIndex > 0 ? selectedIndex - 1 : categories.length - 1;
    onSelect(categories[newIndex].id);
  };

  const handleNext = () => {
    const newIndex = selectedIndex < categories.length - 1 ? selectedIndex + 1 : 0;
    onSelect(categories[newIndex].id);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const minSwipeDistance = 50;

    if (distance > minSwipeDistance) {
      handleNext();
    } else if (distance < -minSwipeDistance) {
      handlePrevious();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex]);

  const getCardStyle = (index: number) => {
    const totalItems = categories.length;
    let diff = index - selectedIndex;
    
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
        cursor: 'default',
      };
    } 
    // Adjacent items (±1) - left and right visible items
    else if (absDiff === 1) {
      const offset = diff > 0 ? 200 : -200;
      return {
        transform: `translate(calc(-50% + ${offset}px), -50%) scale(0.75)`,
        opacity: 0.4,
        zIndex: 20,
        pointerEvents: 'none' as const,
        visibility: 'visible' as const,
        cursor: 'default',
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
        cursor: 'default',
      };
    }
  };

  return (
    <div className="relative w-full">
      {/* Carousel Container */}
      <div 
        className="relative h-[240px] sm:h-[260px] overflow-hidden select-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
          {categories.map((category, index) => {
            const style = getCardStyle(index);
            const isCenter = index === selectedIndex;

            return (
              <div
                key={category.id}
                className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                style={style}
              >
                <button
                  onClick={() => isCenter && onSelect(category.id)}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={-1}
                  className="outline-none"
                  aria-label={`${category.title} category`}
                  aria-current={isCenter ? 'true' : 'false'}
                  disabled={!isCenter}
                  style={{ WebkitTapHighlightColor: 'transparent', cursor: 'default' }}
                >
                  <div className="w-40 sm:w-48 flex flex-col items-center justify-center text-center space-y-3">
                    <div className={`transition-all duration-300 ${isCenter ? 'scale-110' : ''}`}>
                      <img
                        src={category.icon}
                        alt={category.title}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md"
                        draggable={false}
                      />
                    </div>
                    <p
                      className={`text-base sm:text-lg font-semibold transition-colors ${
                        isCenter ? 'text-accent-cyan' : 'text-muted-foreground'
                      }`}
                    >
                      {category.title}
                    </p>
                  </div>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Navigation Arrows */}
      <div className="flex justify-center gap-6 sm:gap-8 mt-4">
        <Button
          onClick={handlePrevious}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300"
          aria-label="Previous category"
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-accent-cyan" />
        </Button>
        <Button
          onClick={handleNext}
          variant="outline"
          size="icon"
          className="rounded-full w-10 h-10 sm:w-12 sm:h-12 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300"
          aria-label="Next category"
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-accent-cyan" />
        </Button>
      </div>
    </div>
  );
}
