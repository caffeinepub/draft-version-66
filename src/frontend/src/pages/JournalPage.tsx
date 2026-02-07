import { useState } from 'react';
import { Search, Download, Upload, Heart, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import { useJournalEntries, useUpdateJournalEntry, useDeleteJournalEntry, useToggleFavorite, useImportData, useExportData } from '../hooks/useQueries';
import type { JournalEntry, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { moodIconMap, energyIconMap } from './PreMeditationPage';

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<MoodState | 'all'>('all');
  const [filterEnergy, setFilterEnergy] = useState<EnergyState | 'all'>('all');
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
      toast.success('Journal exported successfully');
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
      toast.success('Journal imported successfully');
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
    return matchesSearch && matchesMood && matchesEnergy;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => Number(b.timestamp - a.timestamp));

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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {searchQuery || filterMood !== 'all' || filterEnergy !== 'all'
                  ? 'No entries match your filters'
                  : 'No journal entries yet. Complete a meditation to create your first entry.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((entry) => {
                const isEditing = editingId === entry.id;
                const date = new Date(Number(entry.timestamp) / 1000000);

                return (
                  <div
                    key={entry.id.toString()}
                    className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 shadow-lg hover:shadow-glow transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className="bg-accent-cyan/20 text-accent-cyan border-accent-cyan/30">
                            {entry.meditationType}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {entry.duration.toString()} min
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {date.toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {entry.mood.map((mood) => {
                            const Icon = moodIconMap[mood];
                            return (
                              <TooltipProvider key={mood}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                                      <Icon className="w-4 h-4 text-accent-cyan" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{mood.charAt(0).toUpperCase() + mood.slice(1)}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                                  {(() => {
                                    const Icon = energyIconMap[entry.energy];
                                    return <Icon className="w-4 h-4 text-accent-cyan" />;
                                  })()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{entry.energy.charAt(0).toUpperCase() + entry.energy.slice(1)}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(entry)}
                          disabled={toggleFavorite.isPending}
                          className="hover:bg-accent-cyan/10"
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              entry.isFavorite ? 'fill-accent-cyan text-accent-cyan' : 'text-muted-foreground'
                            }`}
                          />
                        </Button>
                        {!isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(entry)}
                              className="hover:bg-accent-cyan/10"
                            >
                              <Edit2 className="w-4 h-4 text-accent-cyan" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(entry.id)}
                              className="hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <Textarea
                          value={editedReflection}
                          onChange={(e) => setEditedReflection(e.target.value)}
                          className="min-h-[100px] bg-background/50 border-accent-cyan/30 focus:border-accent-cyan"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(entry)}
                            disabled={updateEntry.isPending}
                            size="sm"
                            className="bg-accent-cyan hover:bg-accent-cyan-tinted"
                          >
                            {updateEntry.isPending ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4 mr-2" />
                            )}
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                            className="border-border hover:bg-muted"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                        {entry.reflection || 'No reflection notes'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Import/Export controls - fixed bottom-right */}
      <div className="fixed bottom-6 right-6 z-40 flex gap-3">
        <Button
          onClick={handleExport}
          disabled={exportData.isPending}
          className="rounded-full w-14 h-14 bg-accent-cyan hover:bg-accent-cyan-tinted shadow-glow"
          aria-label="Export journal"
        >
          {exportData.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
        </Button>
        <label className="cursor-pointer">
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            disabled={importData.isPending}
          />
          <div className="rounded-full w-14 h-14 bg-accent-cyan hover:bg-accent-cyan-tinted shadow-glow flex items-center justify-center transition-all hover:scale-110">
            {importData.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <Upload className="w-5 h-5 text-white" />
            )}
          </div>
        </label>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-accent-cyan/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border hover:bg-muted">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBackgroundShell>
  );
}
