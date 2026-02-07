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
  const handleChange = (values: number[]) => {
    const newValue = values[0];
    onChange(newValue);
  };

  return (
    <div id="1uxme31" className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium text-foreground">
          Duration
        </Label>
        <span className="text-2xl font-bold text-accent-cyan">
          {value} min
        </span>
      </div>
      
      <Slider
        value={[value]}
        onValueChange={handleChange}
        min={min}
        max={max}
        step={5}
        className="w-full"
      />
      
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{min} min</span>
        <span>{max} min</span>
      </div>
    </div>
  );
}
