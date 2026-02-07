import { useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface DurationRangeInputProps {
  value: number; // Duration in minutes
  onChange: (duration: number) => void;
  min?: number;
  max?: number;
}

export default function DurationRangeInput({
  value,
  onChange,
  min = 5,
  max = 60,
}: DurationRangeInputProps) {
  const sliderRef = useRef<HTMLDivElement>(null);

  const handleChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
  };

  // Fix thumb visual positioning to match drag direction
  useEffect(() => {
    if (!sliderRef.current) return;

    const thumb = sliderRef.current.querySelector('[role="slider"]') as HTMLElement;
    if (!thumb) return;

    // Calculate correct position percentage (0-100)
    const percentage = ((value - min) / (max - min)) * 100;
    
    // Override the transform to position thumb correctly
    // The thumb should be at the percentage position with centered alignment
    thumb.style.left = `${percentage}%`;
    thumb.style.transform = 'translateX(-50%)';
    
  }, [value, min, max]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium text-foreground">
          Duration
        </Label>
        <span className="text-2xl font-bold text-accent-cyan">
          {value} min
        </span>
      </div>
      
      <div ref={sliderRef}>
        <Slider
          value={[value]}
          onValueChange={handleChange}
          min={min}
          max={max}
          step={5}
          className="w-full"
        />
      </div>
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{min} min</span>
        <span>{max} min</span>
      </div>
    </div>
  );
}
