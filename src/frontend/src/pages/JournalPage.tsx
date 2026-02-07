import { useState, useRef } from 'react';
import { Download, Upload, Heart, Trash2, Edit2, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import JournalFiltersDropdown from '../components/JournalFiltersDropdown';
import { useJournalEntries, useUpdateJournalEntry, useDeleteJournalEntry, useToggleFavorite, useImportData, useExportData } from '../hooks/useQueries';
import type { JournalEntry, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { classifyCloudSyncError } from '../utils/cloudSync';
import { moodIconMap, energyIconMap } from './PreMeditationPage';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export default function JournalPage() {
  const [filterFavorites, setFilterFavorites] = useState(false);
  const [filterMoods, setFilterMoods] = useState<MoodState[]>([]);
  const [filterEnergy, setFilterEnergy] = useState<EnergyState[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterNotesText, setFilterNotesText] = useState('');
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editedReflection, setEditedReflection] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<bigint | null>(null);
  const [deletingEntryId, setDeletingEntryId] = useState<bigint | null>(null);
  const [favoritingEntryId, setFavoritingEntryId] = useState<bigint | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: entries, isLoading, isError, error, refetch } = useJournalEntries();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const toggleFavorite = useToggleFavorite();
  const importData = useImportData();
  const exportData = useExportData();

  const handleToggleFavorite = async (entry: JournalEntry) => {
    if (!isAuthenticated) {
      // Guest mode - instant local toggle
      try {
        await toggleFavorite.mutateAsync(entry.id);
      } catch (error: any) {
        // Error already handled by mutation onError
      }
      return;
    }

    // Authenticated mode - show row-level loading
    setFavoritingEntryId(entry.id);
    try {
      await toggleFavorite.mutateAsync(entry.id);
    } catch (error: any) {
      // Error already handled by mutation onError
    } finally {
      setFavoritingEntryId(null);
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
      // Error already handled by mutation onError
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
      setDeletingEntryId(entryToDelete);
      try {
        await deleteEntry.mutateAsync(entryToDelete);
        toast.success('Entry deleted successfully');
      } catch (error: any) {
        // Error already handled by mutation onError
      } finally {
        setDeletingEntryId(null);
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
      // Error already handled by mutation onError
    }
  };

  const handleImportFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingImportFile(file);
    setImportConfirmOpen(true);
  };

  const handleCancelImport = () => {
    setImportConfirmOpen(false);
    setPendingImportFile(null);
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConfirmImport = async () => {
    if (!pendingImportFile) return;

    setImportConfirmOpen(false);
    
    try {
      await importData.mutateAsync({ file: pendingImportFile, overwrite: true });
      toast.success('Journal imported successfully');
    } catch (error: any) {
      // Error already handled by mutation onError
    } finally {
      setPendingImportFile(null);
      // Clear file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearFilters = () => {
    setFilterFavorites(false);
    setFilterMoods([]);
    setFilterEnergy([]);
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterNotesText('');
  };

  const filteredEntries = (entries || []).filter((entry) => {
    // Favorites filter
    if (filterFavorites && !entry.isFavorite) return false;

    // Mood filter (if any moods selected, entry must have at least one)
    if (filterMoods.length > 0) {
      const hasMatchingMood = entry.mood.some((mood) => filterMoods.includes(mood));
      if (!hasMatchingMood) return false;
    }

    // Energy filter (if any energy levels selected, entry must match one)
    if (filterEnergy.length > 0 && !filterEnergy.includes(entry.energy)) {
      return false;
    }

    // Date filter
    if (filterDateFrom || filterDateTo) {
      const entryDate = new Date(Number(entry.timestamp) / 1000000);
      const entryDateStr = entryDate.toISOString().split('T')[0];
      
      if (filterDateFrom && entryDateStr < filterDateFrom) return false;
      if (filterDateTo && entryDateStr > filterDateTo) return false;
    }

    // Notes text search
    if (filterNotesText && !entry.reflection.toLowerCase().includes(filterNotesText.toLowerCase())) {
      return false;
    }

    return true;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => Number(b.timestamp - a.timestamp));

  // Classify error type for better messaging
  const errorType = isError && error ? classifyCloudSyncError(error) : 'other';

  // Track if we're currently deleting the entry in the dialog
  const isDeletingEntry = deleteEntry.isPending && entryToDelete !== null;

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
              errorType={errorType}
            />
          )}

          <div className="flex items-center justify-center">
            <JournalFiltersDropdown
              filterFavorites={filterFavorites}
              filterMoods={filterMoods}
              filterEnergy={filterEnergy}
              filterDateFrom={filterDateFrom}
              filterDateTo={filterDateTo}
              filterNotesText={filterNotesText}
              onFilterFavoritesChange={setFilterFavorites}
              onFilterMoodsChange={setFilterMoods}
              onFilterEnergyChange={setFilterEnergy}
              onFilterDateFromChange={setFilterDateFrom}
              onFilterDateToChange={setFilterDateTo}
              onFilterNotesTextChange={setFilterNotesText}
              onClearFilters={handleClearFilters}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {filterFavorites || filterMoods.length > 0 || filterEnergy.length > 0 || filterDateFrom || filterDateTo || filterNotesText
                  ? 'No entries match your filters'
                  : 'No journal entries yet. Complete a meditation to create your first entry.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((entry) => {
                const isEditing = editingId === entry.id;
                const isSavingThisEntry = isAuthenticated && updateEntry.isPending && editingId === entry.id;
                const isDeletingThisEntry = deletingEntryId === entry.id;
                const isFavoritingThisEntry = favoritingEntryId === entry.id;
                const date = new Date(Number(entry.timestamp) / 1000000);

                return (
                  <div
                    key={entry.id.toString()}
                    className={`bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 shadow-lg hover:shadow-glow transition-all ${
                      isDeletingThisEntry ? 'opacity-50' : ''
                    }`}
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
                            const { icon: Icon, label } = moodIconMap[mood];
                            return (
                              <TooltipProvider key={mood}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                                      <Icon className="w-4 h-4 text-accent-cyan" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>{label}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            );
                          })}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="p-1.5 rounded-lg bg-accent-cyan/10 border border-accent-cyan/30">
                                  {(() => {
                                    const { icon: Icon, label } = energyIconMap[entry.energy];
                                    return <Icon className="w-4 h-4 text-accent-cyan" />;
                                  })()}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{energyIconMap[entry.energy].label}</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFavorite(entry)}
                          disabled={isFavoritingThisEntry || isDeletingThisEntry}
                          className="hover:bg-accent-cyan/10"
                        >
                          {isFavoritingThisEntry ? (
                            <Loader2 className="w-5 h-5 animate-spin text-accent-cyan" />
                          ) : (
                            <Heart
                              className={`w-5 h-5 ${
                                entry.isFavorite ? 'fill-accent-cyan text-accent-cyan' : 'text-muted-foreground'
                              }`}
                            />
                          )}
                        </Button>
                        {!isEditing && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleStartEdit(entry)}
                              disabled={isDeletingThisEntry}
                              className="hover:bg-accent-cyan/10"
                            >
                              <Edit2 className="w-4 h-4 text-accent-cyan" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(entry.id)}
                              disabled={isDeletingThisEntry}
                              className="hover:bg-red-500/10"
                            >
                              {isDeletingThisEntry ? (
                                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-500" />
                              )}
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
                          disabled={isSavingThisEntry}
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(entry)}
                            disabled={isSavingThisEntry}
                            size="sm"
                            className="bg-accent-cyan hover:bg-accent-cyan-tinted"
                          >
                            {isSavingThisEntry ? (
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
                            disabled={isSavingThisEntry}
                            className="border-border hover:bg-muted"
                          >
                            <X className="w-4 h-4 mr-2" />
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
              })}
            </div>
          )}
        </div>
      </main>

      {/* Import/Export Controls - Bottom Right */}
      <div className="fixed bottom-6 right-6 z-40 flex gap-2">
        <Button
          onClick={handleExport}
          variant="outline"
          size="sm"
          disabled={exportData.isPending}
          className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm shadow-lg"
        >
          {exportData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
          Export
        </Button>
        <label>
          <Button
            variant="outline"
            size="sm"
            disabled={importData.isPending}
            className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm shadow-lg"
            asChild
          >
            <span>
              {importData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Import
            </span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImportFileSelect}
            className="hidden"
          />
        </label>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletingEntry}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeletingEntry}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeletingEntry ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Journal Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your current journal entries with the imported data. This action cannot be undone. Make sure you have exported your current data if you want to keep it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport} disabled={importData.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              disabled={importData.isPending}
              className="bg-accent-cyan hover:bg-accent-cyan/90"
            >
              {importData.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBackgroundShell>
  );
}
