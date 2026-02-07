import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface GuideStep {
  title: string;
  content: string;
}

interface MeditationGuideStepperProps {
  steps: GuideStep[];
}

export default function MeditationGuideStepper({ steps }: MeditationGuideStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection('next');
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setDirection('prev');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDotClick = (index: number) => {
    if (index !== currentStep) {
      setDirection(index > currentStep ? 'next' : 'prev');
      setCurrentStep(index);
    }
  };

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;

    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50; // Minimum distance for a swipe to register

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - go to next
        handleNext();
      } else {
        // Swiped right - go to previous
        handlePrev();
      }
    }

    // Reset touch positions
    touchStartX.current = null;
    touchEndX.current = null;
  };

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;
  const step = steps[currentStep];

  // Parse content to separate main content from benefits
  const parsedContent = (() => {
    const benefitsMatch = step.content.match(/^([\s\S]*?)\n\nBenefits:\s*([\s\S]*)$/);
    if (benefitsMatch) {
      return {
        main: benefitsMatch[1].trim(),
        benefits: benefitsMatch[2].trim(),
      };
    }
    return { main: step.content, benefits: null };
  })();

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </p>
      </div>

      {/* Step content with animation and swipe support - responsive layout */}
      <div 
        className="relative min-h-[280px]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={currentStep}
          className={`flex flex-col md:flex-row gap-4 items-start ${
            direction === 'next' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          }`}
        >
          {/* Step number - full width on mobile, side-by-side on desktop */}
          <div 
            className="shrink-0 w-12 h-12 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center"
            style={{
              boxShadow: '0 0 12px oklch(0.7 0.15 195 / 0.4)',
            }}
          >
            <span className="text-accent-cyan font-bold text-lg">{currentStep + 1}</span>
          </div>
          
          {/* Content area - full width on mobile, flexible on desktop */}
          <div className="flex-1 space-y-3 pt-1 w-full">
            <h3 className="text-lg sm:text-xl font-semibold text-accent-cyan">{step.title}</h3>
            
            {/* Main content */}
            <p className="text-sm sm:text-base text-selected-element-light dark:text-guide-text leading-relaxed whitespace-pre-line">
              {parsedContent.main}
            </p>
            
            {/* Benefits section with hierarchy */}
            {parsedContent.benefits && (
              <div className="mt-6 pt-4 border-t border-accent-cyan/20">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-accent-cyan" />
                  <h4 className="text-base sm:text-lg font-semibold text-accent-cyan">
                    Benefits
                  </h4>
                </div>
                <p className="text-sm sm:text-base text-selected-element-light dark:text-guide-text leading-relaxed">
                  {parsedContent.benefits}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation controls - responsive layout */}
      <div className="flex justify-between items-center gap-4 pt-4">
        {/* Desktop: Full buttons */}
        <Button
          onClick={handlePrev}
          disabled={isFirstStep}
          variant="outline"
          size="lg"
          className="hidden sm:flex border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Previous
        </Button>

        {/* Mobile: Icon-only buttons */}
        <Button
          onClick={handlePrev}
          disabled={isFirstStep}
          variant="outline"
          size="icon"
          className="sm:hidden border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Clickable step indicator dots - gray for unselected */}
        <div className="flex gap-2">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                index === currentStep
                  ? 'w-8 bg-accent-cyan hover:bg-accent-cyan'
                  : 'w-2 bg-muted-foreground/40 hover:bg-muted-foreground/60'
              }`}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>

        {/* Desktop: Full buttons */}
        <Button
          onClick={handleNext}
          disabled={isLastStep}
          size="lg"
          className="hidden sm:flex bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        >
          Next
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>

        {/* Mobile: Icon-only buttons */}
        <Button
          onClick={handleNext}
          disabled={isLastStep}
          size="icon"
          className="sm:hidden bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
