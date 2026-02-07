import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MoodState, EnergyState } from '../backend';

interface JournalFiltersDropdownProps {
  filterFavorites: boolean;
  filterMoods: MoodState[];
  filterEnergy: EnergyState[];
  filterDateFrom: string;
  filterDateTo: string;
  filterNotesText: string;
  onFilterFavoritesChange: (value: boolean) => void;
  onFilterMoodsChange: (moods: MoodState[]) => void;
  onFilterEnergyChange: (energy: EnergyState[]) => void;
  onFilterDateFromChange: (date: string) => void;
  onFilterDateToChange: (date: string) => void;
  onFilterNotesTextChange: (text: string) => void;
  onClearFilters: () => void;
}

const allMoods: MoodState[] = [
  MoodState.calm,
  MoodState.happy,
  MoodState.neutral,
  MoodState.anxious,
  MoodState.sad,
];

const allEnergyLevels: EnergyState[] = [
  EnergyState.energized,
  EnergyState.balanced,
  EnergyState.tired,
  EnergyState.restless,
];

export default function JournalFiltersDropdown({
  filterFavorites,
  filterMoods,
  filterEnergy,
  filterDateFrom,
  filterDateTo,
  filterNotesText,
  onFilterFavoritesChange,
  onFilterMoodsChange,
  onFilterEnergyChange,
  onFilterDateFromChange,
  onFilterDateToChange,
  onFilterNotesTextChange,
  onClearFilters,
}: JournalFiltersDropdownProps) {
  const [open, setOpen] = useState(false);

  const handleMoodToggle = (mood: MoodState) => {
    if (filterMoods.includes(mood)) {
      onFilterMoodsChange(filterMoods.filter((m) => m !== mood));
    } else {
      onFilterMoodsChange([...filterMoods, mood]);
    }
  };

  const handleEnergyToggle = (energy: EnergyState) => {
    if (filterEnergy.includes(energy)) {
      onFilterEnergyChange(filterEnergy.filter((e) => e !== energy));
    } else {
      onFilterEnergyChange([...filterEnergy, energy]);
    }
  };

  const activeFilterCount = [
    filterFavorites,
    filterMoods.length > 0 && filterMoods.length < allMoods.length,
    filterEnergy.length > 0 && filterEnergy.length < allEnergyLevels.length,
    filterDateFrom,
    filterDateTo,
    filterNotesText,
  ].filter(Boolean).length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm relative"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold rounded-full bg-accent-cyan text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Filters</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 text-xs"
              >
                <X className="w-3 h-3 mr-1" />
                Clear all
              </Button>
            </div>

            <Separator />

            {/* Favorites Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Favorites</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorites"
                  checked={filterFavorites}
                  onCheckedChange={(checked) => onFilterFavoritesChange(checked === true)}
                />
                <label
                  htmlFor="favorites"
                  className="text-sm cursor-pointer"
                >
                  Show only favorites
                </label>
              </div>
            </div>

            <Separator />

            {/* Mood Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Mood</Label>
              <div className="space-y-2">
                {allMoods.map((mood) => (
                  <div key={mood} className="flex items-center space-x-2">
                    <Checkbox
                      id={`mood-${mood}`}
                      checked={filterMoods.includes(mood)}
                      onCheckedChange={() => handleMoodToggle(mood)}
                    />
                    <label
                      htmlFor={`mood-${mood}`}
                      className="text-sm cursor-pointer capitalize"
                    >
                      {mood}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Energy Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Energy Level</Label>
              <div className="space-y-2">
                {allEnergyLevels.map((energy) => (
                  <div key={energy} className="flex items-center space-x-2">
                    <Checkbox
                      id={`energy-${energy}`}
                      checked={filterEnergy.includes(energy)}
                      onCheckedChange={() => handleEnergyToggle(energy)}
                    />
                    <label
                      htmlFor={`energy-${energy}`}
                      className="text-sm cursor-pointer capitalize"
                    >
                      {energy}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Date Filter */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date Range</Label>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="date-from" className="text-xs text-muted-foreground">
                    From
                  </Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => onFilterDateFromChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="date-to" className="text-xs text-muted-foreground">
                    To
                  </Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => onFilterDateToChange(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Notes Text Search */}
            <div className="space-y-2">
              <Label htmlFor="notes-search" className="text-sm font-medium">
                Search Notes
              </Label>
              <Input
                id="notes-search"
                type="text"
                placeholder="Search in reflections..."
                value={filterNotesText}
                onChange={(e) => onFilterNotesTextChange(e.target.value)}
              />
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
