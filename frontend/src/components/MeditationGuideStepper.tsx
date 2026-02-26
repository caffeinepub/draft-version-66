import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface Step {
  title: string;
  content: string;
}

interface MeditationGuideStepperProps {
  steps: Step[];
}

export default function MeditationGuideStepper({ steps }: MeditationGuideStepperProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const contentRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setDirection('forward');
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setDirection('backward');
      setCurrentStep(currentStep - 1);
    }
  };

  const handleDotClick = (index: number) => {
    setDirection(index > currentStep ? 'forward' : 'backward');
    setCurrentStep(index);
  };

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swiped left - go to next
        handleNext();
      } else {
        // Swiped right - go to previous
        handlePrevious();
      }
    }

    touchStartX.current = 0;
    touchEndX.current = 0;
  };

  // Parse content to separate main content from Benefits section
  const parseContent = (content: string) => {
    const benefitsIndex = content.indexOf('\n\nBenefits:');
    if (benefitsIndex === -1) {
      return { main: content, benefits: null };
    }
    return {
      main: content.substring(0, benefitsIndex),
      benefits: content.substring(benefitsIndex + 12), // Skip "\n\nBenefits:"
    };
  };

  const { main, benefits } = parseContent(steps[currentStep].content);

  return (
    <div className="w-full">
      {/* Step indicator dots */}
      <div className="flex justify-center gap-2 mb-6">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentStep
                ? 'w-8 bg-accent-cyan'
                : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
            }`}
            aria-label={`Go to step ${index + 1}`}
          />
        ))}
      </div>

      {/* Content area with swipe support */}
      <div
        ref={contentRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden"
      >
        <div
          key={currentStep}
          className={`space-y-4 ${
            direction === 'forward'
              ? 'animate-in slide-in-from-right duration-300'
              : 'animate-in slide-in-from-left duration-300'
          }`}
        >
          <h3 className="text-xl font-semibold text-foreground">
            {currentStep + 1}. {steps[currentStep].title}
          </h3>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
            {main}
          </p>

          {benefits && (
            <div className="mt-6 p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg">
              <div className="flex items-start gap-2">
                <Sparkles className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line">
                  {benefits}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between mt-6 gap-4">
        <Button
          onClick={handlePrevious}
          disabled={currentStep === 0}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <span className="text-sm text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>

        <Button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          variant="outline"
          size="default"
          className="flex items-center gap-2"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
