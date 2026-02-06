import { useState, useEffect } from 'react';
import { Search, Heart, Trash2, Edit2, X, Check, Star, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import ExportImportControls from '../components/ExportImportControls';
import { useJournalEntries, useUpdateJournalEntry, useDeleteJournalEntry, useToggleFavorite, useImportData, useExportData } from '../hooks/useQueries';
import type { JournalEntry, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { moodIconMap, energyIconMap } from './PreMeditationPage';
import { format } from 'date-fns';

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<MoodState | 'all'>('all');
  const [filterEnergy, setFilterEnergy] = useState<EnergyState | 'all'>('all');
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [filterTimeRange, setFilterTimeRange] = useState<string>('all');
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editedReflection, setEditedReflection] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<bigint | null>(null);

  const { data: entries, isLoading, isError, error, refetch } = useJournalEntries();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const toggleFavorite = useToggleFavorite();
  const importData = useImportData();
  const exportData = useExportData();

  // Guest mode crash recovery
  useEffect(() => {
    const hasReloaded = sessionStorage.getItem('journal-crash-recovery');
    
    if (!hasReloaded && entries && entries.length > 0) {
      try {
        // Test if entries have valid mood data
        entries.forEach(entry => {
          if (entry.mood && entry.mood.length > 0) {
            entry.mood.forEach(mood => {
              if (typeof mood === 'string') {
                mood.charAt(0); // This will throw if mood is undefined/invalid
              }
            });
          }
        });
      } catch (err) {
        console.error('Detected legacy data format, clearing guest storage:', err);
        // Clear guest storage
        localStorage.removeItem('guestJournalEntries');
        localStorage.removeItem('guestProgressStats');
        localStorage.removeItem('guestSessionRecords');
        sessionStorage.setItem('journal-crash-recovery', 'true');
        window.location.reload();
      }
    }
  }, [entries]);

  const handleToggleFavorite = async (entry: JournalEntry) => {
    try {
      await toggleFavorite.mutateAsync(entry.id);
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditedReflection(entry.reflection);
  };

  const handleSaveEdit = async (entry: JournalEntry) => {
    try {
      await updateEntry.mutateAsync({
        entryId: entry.id,
        entry: {
          meditationType: entry.meditationType,
          duration: entry.duration,
          mood: entry.mood,
          energy: entry.energy,
          reflection: editedReflection,
          isFavorite: entry.isFavorite,
          timestamp: entry.timestamp,
        },
      });
      setEditingId(null);
      setEditedReflection('');
      toast.success('Entry updated successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedReflection('');
  };

  const handleDeleteClick = (id: bigint) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (entryToDelete !== null) {
      try {
        await deleteEntry.mutateAsync(entryToDelete);
        toast.success('Entry deleted successfully');
      } catch (error: any) {
        const message = getCloudSyncErrorMessage(error);
        toast.error(message);
      }
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      toast.success('Data has been exported successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importData.mutateAsync({ file, overwrite: false });
      toast.success('Data has been imported successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }

    event.target.value = '';
  };

  const filteredEntries = (entries || []).filter((entry) => {
    const matchesSearch = entry.reflection.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMood = filterMood === 'all' || entry.mood.includes(filterMood);
    const matchesEnergy = filterEnergy === 'all' || entry.energy === filterEnergy;
    const matchesFavorites = !filterFavorites || entry.isFavorite;
    
    // Date filter
    let matchesDate = true;
    if (filterDate) {
      const entryDate = new Date(Number(entry.timestamp) / 1_000_000);
      const filterDateStart = new Date(filterDate);
      filterDateStart.setHours(0, 0, 0, 0);
      const filterDateEnd = new Date(filterDate);
      filterDateEnd.setHours(23, 59, 59, 999);
      matchesDate = entryDate >= filterDateStart && entryDate <= filterDateEnd;
    }
    
    // Time range filter
    let matchesTime = true;
    if (filterTimeRange !== 'all') {
      const entryDate = new Date(Number(entry.timestamp) / 1_000_000);
      const hours = entryDate.getHours();
      
      switch (filterTimeRange) {
        case 'morning': // 5am - 12pm
          matchesTime = hours >= 5 && hours < 12;
          break;
        case 'afternoon': // 12pm - 5pm
          matchesTime = hours >= 12 && hours < 17;
          break;
        case 'evening': // 5pm - 9pm
          matchesTime = hours >= 17 && hours < 21;
          break;
        case 'night': // 9pm - 5am
          matchesTime = hours >= 21 || hours < 5;
          break;
      }
    }
    
    return matchesSearch && matchesMood && matchesEnergy && matchesFavorites && matchesDate && matchesTime;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => Number(b.timestamp - a.timestamp));

  const getMoodLabel = (mood: MoodState): string => {
    return mood.charAt(0).toUpperCase() + mood.slice(1);
  };

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in mt-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Mindful Journal
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Reflect on your meditation journey and track your inner growth
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          {isError && (
            <CloudSyncErrorBanner 
              onRetry={refetch} 
              isRetrying={isLoading}
              title="Failed to Load Journal"
              description="We couldn't load your journal entries. Please check your connection and try again."
            />
          )}

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search reflections..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card/70 backdrop-blur-sm border-accent-cyan/30 focus:border-accent-cyan"
              />
            </div>
          </div>

          {/* Icon-based filters */}
          <div className="bg-card/70 backdrop-blur-sm rounded-xl p-4 border border-accent-cyan/20">
            <div className="space-y-4">
              {/* Favorites, Date, and Time filters */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Quick Filters</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setFilterFavorites(!filterFavorites)}
                    variant={filterFavorites ? "default" : "outline"}
                    size="sm"
                    className={filterFavorites ? "bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark" : "border-accent-cyan/50 hover:border-accent-cyan"}
                  >
                    <Star className={`w-4 h-4 mr-2 ${filterFavorites ? 'fill-current' : ''}`} />
                    Favorites
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={filterDate ? "default" : "outline"}
                        size="sm"
                        className={filterDate ? "bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark" : "border-accent-cyan/50 hover:border-accent-cyan"}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        {filterDate ? format(filterDate, 'MMM d, yyyy') : 'Date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={filterDate}
                        onSelect={setFilterDate}
                        initialFocus
                      />
                      {filterDate && (
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterDate(undefined)}
                            className="w-full"
                          >
                            Clear Date
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>

                  <Select value={filterTimeRange} onValueChange={setFilterTimeRange}>
                    <SelectTrigger className={`w-[140px] ${filterTimeRange !== 'all' ? 'bg-accent-cyan text-primary-dark border-accent-cyan' : 'border-accent-cyan/50'}`}>
                      <Clock className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Times</SelectItem>
                      <SelectItem value="morning">Morning (5am-12pm)</SelectItem>
                      <SelectItem value="afternoon">Afternoon (12pm-5pm)</SelectItem>
                      <SelectItem value="evening">Evening (5pm-9pm)</SelectItem>
                      <SelectItem value="night">Night (9pm-5am)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Filter by Mood</p>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setFilterMood('all')}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            filterMood === 'all'
                              ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                              : 'border-border hover:border-accent-cyan/50 text-muted-foreground'
                          }`}
                          aria-label="Show all moods"
                        >
                          All
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Show all moods</TooltipContent>
                    </Tooltip>
                    {(['calm', 'happy', 'neutral', 'anxious', 'sad'] as MoodState[]).map((mood) => {
                      const Icon = moodIconMap[mood];
                      const isSelected = filterMood === mood;
                      return (
                        <Tooltip key={mood}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setFilterMood(mood)}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-accent-cyan bg-accent-cyan/10'
                                  : 'border-border hover:border-accent-cyan/50'
                              }`}
                              aria-label={`Filter by ${mood}`}
                            >
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{mood.charAt(0).toUpperCase() + mood.slice(1)}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>

              <div>
                <p className="text-sm font-medium text-foreground mb-3">Filter by Energy</p>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setFilterEnergy('all')}
                          className={`px-4 py-2 rounded-lg border-2 transition-all ${
                            filterEnergy === 'all'
                              ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                              : 'border-border hover:border-accent-cyan/50 text-muted-foreground'
                          }`}
                          aria-label="Show all energy levels"
                        >
                          All
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>Show all energy levels</TooltipContent>
                    </Tooltip>
                    {(['energized', 'balanced', 'tired', 'restless'] as EnergyState[]).map((energy) => {
                      const Icon = energyIconMap[energy];
                      const isSelected = filterEnergy === energy;
                      return (
                        <Tooltip key={energy}>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setFilterEnergy(energy)}
                              className={`p-2 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? 'border-accent-cyan bg-accent-cyan/10'
                                  : 'border-border hover:border-accent-cyan/50'
                              }`}
                              aria-label={`Filter by ${energy}`}
                            >
                              <Icon className={`w-5 h-5 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>{energy.charAt(0).toUpperCase() + energy.slice(1)}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Journal entries list */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading your journal entries...</p>
              </div>
            ) : sortedEntries.length === 0 ? (
              <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-xl border border-accent-cyan/20">
                <p className="text-muted-foreground">
                  {entries && entries.length > 0 
                    ? 'No entries match your filters. Try adjusting your search criteria.'
                    : 'No journal entries yet. Start your meditation journey to create your first entry!'}
                </p>
              </div>
            ) : (
              sortedEntries.map((entry) => {
                const isEditing = editingId === entry.id;
                const entryDate = new Date(Number(entry.timestamp) / 1_000_000);

                return (
                  <div
                    key={entry.id.toString()}
                    className="bg-card/70 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-accent-cyan/50 text-accent-cyan">
                            {entry.meditationType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {entry.duration.toString()} min
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(entryDate, 'MMMM d, yyyy • h:mm a')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFavorite(entry)}
                          disabled={toggleFavorite.isPending}
                          className="hover:bg-accent-cyan/10"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              entry.isFavorite
                                ? 'fill-accent-cyan text-accent-cyan'
                                : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                        {!isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(entry)}
                              className="hover:bg-accent-cyan/10"
                            >
                              <Edit2 className="w-5 h-5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(entry.id)}
                              className="hover:bg-destructive/10"
                            >
                              <Trash2 className="w-5 h-5 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {entry.mood.map((mood) => {
                        const Icon = moodIconMap[mood];
                        return (
                          <Badge
                            key={mood}
                            variant="secondary"
                            className="flex items-center gap-1.5 bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{getMoodLabel(mood)}</span>
                          </Badge>
                        );
                      })}
                      {(() => {
                        const Icon = energyIconMap[entry.energy];
                        return (
                          <Badge
                            variant="secondary"
                            className="flex items-center gap-1.5 bg-accent-lavender/10 text-accent-lavender border-accent-lavender/30"
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{entry.energy.charAt(0).toUpperCase() + entry.energy.slice(1)}</span>
                          </Badge>
                        );
                      })()}
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedReflection}
                          onChange={(e) => setEditedReflection(e.target.value)}
                          className="min-h-[120px] bg-background/50 border-accent-cyan/30 focus:border-accent-cyan"
                          placeholder="Edit your reflection..."
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(entry)}
                            disabled={updateEntry.isPending}
                            size="sm"
                            className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            disabled={updateEntry.isPending}
                            variant="outline"
                            size="sm"
                            className="border-accent-cyan/50 hover:border-accent-cyan"
                          >
                            <X className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {entry.reflection}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      <ExportImportControls
        onExport={handleExport}
        onImport={handleImport}
        isExporting={exportData.isPending}
        isImporting={importData.isPending}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBackgroundShell>
  );
}
