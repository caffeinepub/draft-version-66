import { ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
    <div className="w-full max-w-4xl mx-auto">
      {/* Always-visible filter controls - column layout at all breakpoints */}
      <div className="flex flex-col gap-3 bg-card/70 backdrop-blur-sm rounded-xl p-4 border border-accent-cyan/20 shadow-lg">
        
        {/* Mood and Energy row - 2 columns at >=540px, stacking below */}
        <div className="grid grid-cols-1 min-[540px]:grid-cols-2 gap-3">
          {/* Moods Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm justify-between w-full min-w-0"
              >
                <span className="flex items-center gap-2">
                  Moods
                  {filterMoods.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-accent-cyan text-white">
                      {filterMoods.length}
                    </span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Moods</Label>
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
            </PopoverContent>
          </Popover>

          {/* Energy Levels Dropdown */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm justify-between w-full min-w-0"
              >
                <span className="flex items-center gap-2">
                  Energy
                  {filterEnergy.length > 0 && (
                    <span className="px-1.5 py-0.5 text-xs font-semibold rounded-full bg-accent-cyan text-white">
                      {filterEnergy.length}
                    </span>
                  )}
                </span>
                <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-3" align="start">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Energy Levels</Label>
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
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Range Inputs - always 2 columns at all widths */}
        <div className="grid grid-cols-2 gap-3">
          <div className="min-w-0">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground sr-only">
              From
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filterDateFrom}
              onChange={(e) => onFilterDateFromChange(e.target.value)}
              placeholder="From date"
              className="text-sm border-accent-cyan/50 focus:border-accent-cyan w-full"
            />
          </div>
          <div className="min-w-0">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground sr-only">
              To
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filterDateTo}
              onChange={(e) => onFilterDateToChange(e.target.value)}
              placeholder="To date"
              className="text-sm border-accent-cyan/50 focus:border-accent-cyan w-full"
            />
          </div>
        </div>

        {/* Search Input */}
        <div className="min-w-0">
          <Label htmlFor="notes-search" className="sr-only">
            Search Notes
          </Label>
          <Input
            id="notes-search"
            type="text"
            placeholder="Search notes..."
            value={filterNotesText}
            onChange={(e) => onFilterNotesTextChange(e.target.value)}
            className="text-sm border-accent-cyan/50 focus:border-accent-cyan w-full"
          />
        </div>

        {/* Favorites Checkbox and Clear Button row */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-2 whitespace-nowrap">
            <Checkbox
              id="favorites-filter"
              checked={filterFavorites}
              onCheckedChange={(checked) => onFilterFavoritesChange(checked === true)}
            />
            <label
              htmlFor="favorites-filter"
              className="text-sm cursor-pointer"
            >
              Favorites
            </label>
          </div>

          {/* Clear Filters Button */}
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="hover:bg-accent-cyan/10 whitespace-nowrap"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
