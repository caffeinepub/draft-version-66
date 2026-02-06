import { useState, useEffect } from 'react';
import { Search, Download, Upload, Heart, Trash2, Edit2, X, Check, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import { useJournalEntries, useSaveJournalEntry, useImportData, useExportData } from '../hooks/useQueries';
import type { JournalEntry, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';

const moodIcons: Record<MoodState, string> = {
  calm: '😌',
  anxious: '😰',
  neutral: '😐',
  happy: '😊',
  sad: '😢',
};

const energyIcons: Record<EnergyState, string> = {
  tired: '🥱',
  energized: '⚡',
  balanced: '⚖️',
  restless: '😣',
};

export default function JournalPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [editingId, setEditingId] = useState<bigint | null>(null);
  const [editedReflection, setEditedReflection] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<bigint | null>(null);

  const { data: entries, isLoading, isError, error, refetch } = useJournalEntries();
  const saveEntry = useSaveJournalEntry();
  const importData = useImportData();
  const exportData = useExportData();

  const handleToggleFavorite = (entry: JournalEntry) => {
    saveEntry.mutate({
      meditationType: entry.meditationType,
      duration: Number(entry.duration),
      mood: entry.mood,
      energy: entry.energy,
      reflection: entry.reflection,
      isFavorite: !entry.isFavorite,
    });
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingId(entry.id);
    setEditedReflection(entry.reflection);
  };

  const handleSaveEdit = (entry: JournalEntry) => {
    saveEntry.mutate({
      meditationType: entry.meditationType,
      duration: Number(entry.duration),
      mood: entry.mood,
      energy: entry.energy,
      reflection: editedReflection,
      isFavorite: entry.isFavorite,
    });
    setEditingId(null);
    setEditedReflection('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditedReflection('');
  };

  const handleDeleteClick = (id: bigint) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (entryToDelete !== null) {
      // Note: Backend doesn't have delete method, this is guest-only
      toast.info('Delete functionality is not yet implemented for authenticated users');
    }
    setDeleteDialogOpen(false);
    setEntryToDelete(null);
  };

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
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
    const matchesMood = filterMood === 'all' || entry.mood.includes(filterMood as MoodState);
    const matchesEnergy = filterEnergy === 'all' || entry.energy === filterEnergy;
    return matchesSearch && matchesMood && matchesEnergy;
  });

  const sortedEntries = [...filteredEntries].sort((a, b) => Number(b.timestamp - a.timestamp));

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12">
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

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={handleExport}
                variant="outline"
                size="sm"
                disabled={exportData.isPending}
                className="flex-1 sm:flex-none border-accent-cyan/50 hover:bg-accent-cyan/10"
              >
                {exportData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Export
              </Button>
              <label>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={importData.isPending}
                  className="flex-1 sm:flex-none border-accent-cyan/50 hover:bg-accent-cyan/10 cursor-pointer"
                  asChild
                >
                  <span>
                    {importData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    Import
                  </span>
                </Button>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={filterMood} onValueChange={setFilterMood}>
                <SelectTrigger className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by mood" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Moods</SelectItem>
                  <SelectItem value="calm">😌 Calm</SelectItem>
                  <SelectItem value="anxious">😰 Anxious</SelectItem>
                  <SelectItem value="neutral">😐 Neutral</SelectItem>
                  <SelectItem value="happy">😊 Happy</SelectItem>
                  <SelectItem value="sad">😢 Sad</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <Select value={filterEnergy} onValueChange={setFilterEnergy}>
                <SelectTrigger className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by energy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Energy Levels</SelectItem>
                  <SelectItem value="tired">🥱 Tired</SelectItem>
                  <SelectItem value="energized">⚡ Energized</SelectItem>
                  <SelectItem value="balanced">⚖️ Balanced</SelectItem>
                  <SelectItem value="restless">😣 Restless</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-accent-cyan mx-auto" />
              <p className="text-muted-foreground mt-4">Loading your journal...</p>
            </div>
          ) : sortedEntries.length === 0 ? (
            <div className="text-center py-12 bg-card/50 backdrop-blur-sm rounded-3xl border border-accent-cyan/20">
              <p className="text-xl text-muted-foreground">
                {searchQuery || filterMood !== 'all' || filterEnergy !== 'all'
                  ? 'No entries match your filters'
                  : 'No journal entries yet. Complete a meditation session to start your journey.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedEntries.map((entry) => (
                <div
                  key={entry.id.toString()}
                  className="bg-card/70 backdrop-blur-md border-2 border-accent-cyan/30 rounded-3xl p-6 space-y-4 hover:border-accent-cyan/50 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="border-accent-cyan/40 bg-accent-cyan/5 text-accent-cyan/80">
                          {entry.meditationType.charAt(0).toUpperCase() + entry.meditationType.slice(1)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {Number(entry.duration)} min
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(Number(entry.timestamp) / 1000000).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.mood.map((mood) => (
                          <span key={mood} className="text-2xl" title={mood}>
                            {moodIcons[mood]}
                          </span>
                        ))}
                        <span className="text-2xl" title={entry.energy}>
                          {energyIcons[entry.energy]}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleFavorite(entry)}
                        className={entry.isFavorite ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground hover:text-accent-cyan'}
                      >
                        <Heart className={`w-5 h-5 ${entry.isFavorite ? 'fill-current' : ''}`} />
                      </Button>
                      {editingId === entry.id ? (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleSaveEdit(entry)} className="text-green-500 hover:text-green-600">
                            <Check className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={handleCancelEdit} className="text-muted-foreground hover:text-accent-cyan">
                            <X className="w-5 h-5" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" onClick={() => handleStartEdit(entry)} className="text-muted-foreground hover:text-accent-cyan">
                            <Edit2 className="w-5 h-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(entry.id)} className="text-muted-foreground hover:text-red-500">
                            <Trash2 className="w-5 h-5" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {editingId === entry.id ? (
                    <Textarea
                      value={editedReflection}
                      onChange={(e) => setEditedReflection(e.target.value)}
                      className="min-h-[100px] bg-background/50 border-accent-cyan/30 focus:border-accent-cyan"
                    />
                  ) : (
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{entry.reflection}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

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
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBackgroundShell>
  );
}
