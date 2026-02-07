import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
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
  // Initialize start and end based on current duration
  const [startMinutes, setStartMinutes] = useState(0);
  const [endMinutes, setEndMinutes] = useState(value);

  // Update internal state when external value changes
  useEffect(() => {
    setEndMinutes(value);
  }, [value]);

  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const clampedStart = Math.max(0, Math.min(val, max - min));
    setStartMinutes(clampedStart);
    
    // Ensure end is at least min minutes after start
    const newEnd = Math.max(clampedStart + min, endMinutes);
    setEndMinutes(newEnd);
    
    const duration = newEnd - clampedStart;
    onChange(Math.max(min, Math.min(max, duration)));
  };

  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || min;
    const clampedEnd = Math.max(startMinutes + min, Math.min(val, startMinutes + max));
    setEndMinutes(clampedEnd);
    
    const duration = clampedEnd - startMinutes;
    onChange(Math.max(min, Math.min(max, duration)));
  };

  const duration = endMinutes - startMinutes;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium text-foreground">
          Duration: {duration} minutes
        </Label>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="start-time" className="text-sm text-muted-foreground">
            Start (min)
          </Label>
          <Input
            id="start-time"
            type="number"
            value={startMinutes}
            onChange={handleStartChange}
            min={0}
            max={max - min}
            className="text-center"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="end-time" className="text-sm text-muted-foreground">
            End (min)
          </Label>
          <Input
            id="end-time"
            type="number"
            value={endMinutes}
            onChange={handleEndChange}
            min={startMinutes + min}
            max={startMinutes + max}
            className="text-center"
          />
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground text-center">
        Session will run from minute {startMinutes} to minute {endMinutes}
      </div>
    </div>
  );
}
