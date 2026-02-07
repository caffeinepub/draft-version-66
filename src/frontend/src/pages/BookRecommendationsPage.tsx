import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ArrowLeft, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import MobileBackButton from '../components/MobileBackButton';
import { Badge } from '@/components/ui/badge';
import { BOOK_RECOMMENDATIONS } from '../lib/bookData';

export default function BookRecommendationsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Clamp currentIndex to valid range when recommendations list changes
  useEffect(() => {
    if (currentIndex >= BOOK_RECOMMENDATIONS.length && BOOK_RECOMMENDATIONS.length > 0) {
      setCurrentIndex(BOOK_RECOMMENDATIONS.length - 1);
    }
  }, [currentIndex]);

  const handlePrevious = () => {
    if (BOOK_RECOMMENDATIONS.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? BOOK_RECOMMENDATIONS.length - 1 : prev - 1));
  };

  const handleNext = () => {
    if (BOOK_RECOMMENDATIONS.length <= 1) return;
    setCurrentIndex((prev) => (prev === BOOK_RECOMMENDATIONS.length - 1 ? 0 : prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || BOOK_RECOMMENDATIONS.length <= 1) return;
    
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
    const totalItems = BOOK_RECOMMENDATIONS.length;
    
    // Handle single item case
    if (totalItems === 1) {
      return {
        transform: 'translate(-50%, -50%) scale(1)',
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto' as const,
        visibility: 'visible' as const,
      };
    }

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
      const offset = diff > 0 ? 320 : -320;
      return {
        transform: `translate(calc(-50% + ${offset}px), -50%) scale(0.85)`,
        opacity: 0.4,
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

  // Empty state when no books available
  if (BOOK_RECOMMENDATIONS.length === 0) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
        <LotusCanvas variant="enhanced" />
        
        {mounted && (
          <div className="hidden md:block">
            <SessionIndicator />
          </div>
        )}

        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-accent-cyan" />
            ) : (
              <Moon className="h-5 w-5 text-primary-dark" />
            )}
          </button>
        )}

        <button
          onClick={() => navigate({ to: '/dashboard' })}
          className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="h-5 w-5 text-accent-cyan" />
        </button>

        {mounted && <MobileBackButton />}
        {mounted && <HamburgerMenu />}

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 sm:px-4 py-8 sm:py-12">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted">
              No Recommendations Available
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto">
              Check back soon for curated meditation book recommendations.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      {/* Single centered Lotus Canvas */}
      <LotusCanvas variant="enhanced" />

      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Desktop Back Button */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5 text-accent-cyan" />
      </button>

      {/* Mobile Back Button */}
      {mounted && <MobileBackButton />}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-4 mt-16">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Recommended Reading
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Deepen your practice with these carefully selected books on meditation techniques and mindfulness practices
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          <div className="relative w-full max-w-6xl mx-auto">
            {/* Carousel Container with strong overflow hidden */}
            <div 
              ref={containerRef}
              className="relative h-[500px] sm:h-[550px] md:h-[600px] overflow-hidden"
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            >
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
                {BOOK_RECOMMENDATIONS.map((book, index) => {
                  const style = getCardStyle(index);
                  const isCenter = index === currentIndex;

                  return (
                    <div
                      key={book.title}
                      className="absolute left-1/2 top-1/2 transition-all duration-500 ease-out"
                      style={style}
                    >
                      <div
                        className={`
                          w-72 sm:w-80 md:w-96 bg-card/70 backdrop-blur-md border-2 rounded-3xl
                          flex flex-col overflow-hidden
                          transition-all duration-300
                          ${isCenter ? 'border-accent-cyan/70 shadow-[0_4px_12px_rgba(0,173,181,0.15)]' : 'border-accent-cyan/30 shadow-[0_2px_8px_rgba(0,173,181,0.08)]'}
                        `}
                      >
                        <div className="p-5 sm:p-[1.2rem] space-y-4 sm:space-y-6">
                          <div className="space-y-3">
                            <h3 className={`text-xl sm:text-2xl font-bold leading-tight transition-colors duration-300 ${isCenter ? 'text-foreground' : 'text-foreground/70'}`}>
                              {book.title}
                            </h3>
                            <p className={`text-sm sm:text-base font-semibold tracking-wide ${isCenter ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                              by {book.author}
                            </p>
                          </div>

                          <p className={`text-base sm:text-lg leading-relaxed ${isCenter ? 'text-muted-foreground' : 'text-muted-foreground/70'}`}>
                            {book.description}
                          </p>

                          {book.tags && book.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {book.tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="outline"
                                  className={`text-xs border-accent-cyan/40 bg-accent-cyan/5 ${isCenter ? 'text-accent-cyan/80' : 'text-accent-cyan/60'}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {isCenter && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full border-2 border-accent-cyan/60 text-accent-cyan hover:bg-accent-cyan hover:text-primary-dark hover:border-accent-cyan transition-all duration-300 font-bold py-3 rounded-2xl shadow-md hover:shadow-glow"
                              onClick={() => {
                                if (book.amazonLink) {
                                  window.open(book.amazonLink, '_blank', 'noopener,noreferrer');
                                }
                              }}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View on Amazon
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Arrows - Below carousel with reduced top margin */}
            {BOOK_RECOMMENDATIONS.length > 1 && (
              <div className="flex justify-center gap-6 sm:gap-8 mt-2">
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
            )}

            {/* Carousel Indicators */}
            {BOOK_RECOMMENDATIONS.length > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                {BOOK_RECOMMENDATIONS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-500 ${
                      idx === currentIndex
                        ? 'bg-accent-cyan w-8'
                        : 'bg-muted-foreground/40 hover:bg-accent-cyan/50 w-2'
                    }`}
                    aria-label={`Go to book ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
