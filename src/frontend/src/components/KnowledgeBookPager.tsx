import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Page {
  title: string;
  content: string;
}

interface KnowledgeBookPagerProps {
  pages: Page[];
  categoryTitle: string;
}

export default function KnowledgeBookPager({ pages, categoryTitle }: KnowledgeBookPagerProps) {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const contentAnchorRef = useRef<HTMLDivElement>(null);
  const prevPageIndexRef = useRef<number>(0);

  const currentPage = pages[currentPageIndex];
  const isFirstPage = currentPageIndex === 0;
  const isLastPage = currentPageIndex === pages.length - 1;

  const scrollToContent = () => {
    if (contentAnchorRef.current) {
      contentAnchorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePrevious = () => {
    if (!isFirstPage) {
      setDirection('left');
      setCurrentPageIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      setDirection('right');
      setCurrentPageIndex((prev) => prev + 1);
    }
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
  }, [currentPageIndex]);

  // Scroll to content whenever page changes (but not on initial mount or category change)
  useEffect(() => {
    if (prevPageIndexRef.current !== currentPageIndex) {
      scrollToContent();
      prevPageIndexRef.current = currentPageIndex;
    }
  }, [currentPageIndex]);

  // Reset to first page when pages prop changes (category change) WITHOUT scrolling
  useEffect(() => {
    setCurrentPageIndex(0);
    prevPageIndexRef.current = 0;
  }, [pages]);

  return (
    <div
      className="relative"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Scroll anchor positioned at the start of page content */}
      <div ref={contentAnchorRef} className="absolute -top-4" aria-hidden="true" />

      {/* Page Content - No fixed height, uses natural flow */}
      <div className="relative overflow-hidden">
        <div
          key={currentPageIndex}
          className={`py-6 space-y-6 ${
            direction === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          }`}
        >
          {/* Page Title */}
          <div className="space-y-2 border-b border-accent-cyan/20 pb-4">
            <h2 className="text-2xl md:text-3xl font-playfair font-bold text-accent-cyan">
              {currentPage.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {categoryTitle} • Page {currentPageIndex + 1} of {pages.length}
            </p>
          </div>

          {/* Page Content */}
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {currentPage.content.split('\n\n').map((paragraph, index) => {
              // Check if paragraph is a heading (starts with **)
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                const heading = paragraph.slice(2, -2);
                return (
                  <h3 key={index} className="text-xl font-semibold text-foreground mt-6 mb-3">
                    {heading}
                  </h3>
                );
              }
              // Check if paragraph is a bullet point
              if (paragraph.startsWith('•')) {
                return (
                  <p key={index} className="text-base leading-relaxed text-foreground pl-4">
                    {paragraph}
                  </p>
                );
              }
              // Regular paragraph
              return (
                <p key={index} className="text-base leading-relaxed text-foreground">
                  {paragraph}
                </p>
              );
            })}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-8 mb-8">
        <Button
          onClick={handlePrevious}
          disabled={isFirstPage}
          variant="outline"
          className="border-accent-cyan/50 hover:bg-accent-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {/* Page Indicators */}
        <div className="flex gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setDirection(index > currentPageIndex ? 'right' : 'left');
                setCurrentPageIndex(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentPageIndex
                  ? 'bg-accent-cyan w-8'
                  : 'bg-accent-cyan/30 hover:bg-accent-cyan/50'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>

        <Button
          onClick={handleNext}
          disabled={isLastPage}
          variant="outline"
          className="border-accent-cyan/50 hover:bg-accent-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
