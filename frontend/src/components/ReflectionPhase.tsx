import React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import PageBackgroundShell from './PageBackgroundShell';
import StandardPageNav from './StandardPageNav';
import { MoodState, EnergyState } from '../backend';
import { moodIconMap, energyIconMap } from '../pages/PreMeditationPage';

interface ReflectionPhaseProps {
  selectedType: string;
  duration: number;
  selectedMoods: MoodState[];
  onMoodToggle: (mood: MoodState) => void;
  selectedEnergy: EnergyState | null;
  onEnergySelect: (energy: EnergyState) => void;
  reflection: string;
  onReflectionChange: (value: string) => void;
  isFavorite: boolean;
  onFavoriteChange: (value: boolean) => void;
  onSave: () => void;
  isSaving: boolean;
  onBack: () => void;
}

const formatMeditationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    mindfulness: 'Mindfulness',
    metta: 'Metta',
    visualization: 'Visualization',
    ifs: 'IFS (Internal Family Systems)',
  };
  return typeMap[type] || 'Mindfulness';
};

export default function ReflectionPhase({
  selectedType,
  duration,
  selectedMoods,
  onMoodToggle,
  selectedEnergy,
  onEnergySelect,
  reflection,
  onReflectionChange,
  isFavorite,
  onFavoriteChange,
  onSave,
  isSaving,
  onBack,
}: ReflectionPhaseProps) {
  return (
    <PageBackgroundShell>
      <StandardPageNav showBackButton onBack={onBack} />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-lg space-y-8 animate-fade-in">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Session Complete</h1>
            <p className="text-muted-foreground">
              {formatMeditationType(selectedType)} · {duration} min
            </p>
          </div>

          {/* Mood Selection */}
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">How are you feeling?</h2>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {Object.values(MoodState).map((mood) => {
                const Icon = moodIconMap[mood];
                const isSelected = selectedMoods.includes(mood);
                return (
                  <button
                    key={mood}
                    onClick={() => onMoodToggle(mood)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                        : 'border-border/50 text-muted-foreground hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs capitalize">{mood}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Energy Selection */}
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Energy level?</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.values(EnergyState).map((energy) => {
                const Icon = energyIconMap[energy];
                const isSelected = selectedEnergy === energy;
                return (
                  <button
                    key={energy}
                    onClick={() => onEnergySelect(energy)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-accent-cyan/20 border-accent-cyan text-accent-cyan'
                        : 'border-border/50 text-muted-foreground hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs capitalize">{energy}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reflection Notes */}
          <div className="bg-card/60 backdrop-blur-sm rounded-xl p-6 border border-border/50 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Reflection (optional)</h2>
            <Textarea
              value={reflection}
              onChange={(e) => onReflectionChange(e.target.value)}
              placeholder="How was your session? Any insights or observations..."
              className="min-h-[100px] bg-background/50 border-border/50 resize-none"
            />
          </div>

          {/* Favorite */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="reflection-favorite"
              checked={isFavorite}
              onCheckedChange={(checked) => onFavoriteChange(checked === true)}
            />
            <Label htmlFor="reflection-favorite" className="text-sm text-muted-foreground cursor-pointer">
              Mark this session as a favorite
            </Label>
          </div>

          {/* Save Button */}
          <Button
            onClick={onSave}
            disabled={isSaving}
            className="w-full"
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </div>
    </PageBackgroundShell>
  );
}
