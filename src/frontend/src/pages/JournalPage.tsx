import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Sun, ArrowLeft, Search, Heart, Calendar, Smile, Meh, Frown, Edit2, Trash2, X, Loader2, Download, Upload, Battery, BatteryCharging, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import MobileBackButton from '../components/MobileBackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournalEntries, useToggleFavoriteJournal, useUpdateJournalEntry, useDeleteJournalEntry, useExportMeditationData, useImportMeditationData } from '../hooks/useQueries';
import type { JournalEntry, MeditationType, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';

export default function JournalPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [filterEnergy, setFilterEnergy] = useState<string>('all');
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [editedReflection, setEditedReflection] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<bigint | null>(null);
  const [loadingActionId, setLoadingActionId] = useState<bigint | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: journalEntries = [], isLoading } = useJournalEntries();
  const toggleFavorite = useToggleFavoriteJournal();
  const updateEntry = useUpdateJournalEntry();
  const deleteEntry = useDeleteJournalEntry();
  const exportData = useExportMeditationData();
  const importData = useImportMeditationData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const getMoodIcon = (mood: MoodState) => {
    switch (mood) {
      case 'calm':
      case 'happy':
        return <Smile className="w-5 h-5 text-accent-cyan" />;
      case 'neutral':
        return <Meh className="w-5 h-5 text-muted-foreground" />;
      case 'anxious':
      case 'sad':
        return <Frown className="w-5 h-5 text-muted-foreground" />;
      default:
        return <Meh className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getEnergyIcon = (energy: EnergyState) => {
    switch (energy) {
      case 'tired':
        return <Battery className="w-5 h-5 text-muted-foreground" />;
      case 'energized':
        return <BatteryCharging className="w-5 h-5 text-accent-cyan" />;
      case 'balanced':
        return <Zap className="w-5 h-5 text-accent-cyan" />;
      case 'restless':
        return <Zap className="w-5 h-5 text-orange-500" />;
      default:
        return <Zap className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getMoodLabel = (mood: MoodState): string => {
    const labels: Record<MoodState, string> = {
      calm: 'Calm',
      anxious: 'Anxious',
      neutral: 'Neutral',
      happy: 'Happy',
      sad: 'Sad',
    };
    return labels[mood] || 'Unknown';
  };

  const getEnergyLabel = (energy: EnergyState): string => {
    const labels: Record<EnergyState, string> = {
      tired: 'Tired',
      energized: 'Energized',
      balanced: 'Balanced',
      restless: 'Restless',
    };
    return labels[energy] || 'Unknown';
  };

  const getMeditationTypeLabel = (type: MeditationType): string => {
    const labels: Record<MeditationType, string> = {
      mindfulness: 'Mindfulness',
      metta: 'Metta',
      visualization: 'Visualization',
      ifs: 'IFS',
    };
    return labels[type] || 'Unknown';
  };

  const filteredEntries = journalEntries.filter((entry) => {
    const matchesSearch = 
      entry.reflection.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getMeditationTypeLabel(entry.meditationType).toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.mood.some(m => getMoodLabel(m).toLowerCase().includes(searchQuery.toLowerCase())) ||
      getEnergyLabel(entry.energy).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || entry.meditationType === filterType;
    const matchesMood = filterMood === 'all' || entry.mood.some(m => m === filterMood);
    const matchesEnergy = filterEnergy === 'all' || entry.energy === filterEnergy;
    
    return matchesSearch && matchesType && matchesMood && matchesEnergy;
  });

  const favoriteEntries = journalEntries.filter((entry) => entry.isFavorite);

  const totalSessions = journalEntries.length;
  const avgDuration = totalSessions > 0 
    ? Math.round(journalEntries.reduce((sum, entry) => sum + Number(entry.duration), 0) / totalSessions)
    : 0;

  const handleToggleFavorite = async (id: bigint) => {
    setLoadingActionId(id);
    try {
      await toggleFavorite.mutateAsync(id);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleStartEdit = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEditedReflection(entry.reflection);
  };

  const handleSaveEdit = async () => {
    if (editingEntry) {
      setLoadingActionId(editingEntry.id);
      try {
        await updateEntry.mutateAsync({
          id: editingEntry.id,
          entry: { ...editingEntry, reflection: editedReflection },
        });
        setEditingEntry(null);
        setEditedReflection('');
      } finally {
        setLoadingActionId(null);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setEditedReflection('');
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmId !== null) {
      setLoadingActionId(deleteConfirmId);
      try {
        await deleteEntry.mutateAsync(deleteConfirmId);
        setDeleteConfirmId(null);
      } finally {
        setLoadingActionId(null);
      }
    }
  };

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      toast.success('Meditation data exported successfully', {
        className: 'bg-card border-2 border-accent-cyan/50 text-foreground',
      });
    } catch (error) {
      toast.error('Failed to export meditation data', {
        className: 'bg-card border-2 border-destructive/50 text-foreground',
      });
      console.error('Export error:', error);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setShowImportConfirm(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    try {
      await importData.mutateAsync(pendingFile);
      toast.success('Meditation data imported successfully', {
        className: 'bg-card border-2 border-accent-cyan/50 text-foreground',
      });
    } catch (error) {
      toast.error('Failed to import meditation data. Please check the file format.', {
        className: 'bg-card border-2 border-destructive/50 text-foreground',
      });
      console.error('Import error:', error);
    } finally {
      setShowImportConfirm(false);
      setPendingFile(null);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelImport = () => {
    setShowImportConfirm(false);
    setPendingFile(null);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderEntryCard = (entry: JournalEntry) => {
    const isEditing = editingEntry?.id === entry.id;
    const isLoading = loadingActionId === entry.id;

    return (
      <Card key={entry.id.toString()} className="bg-card/50 backdrop-blur-sm border-border/30 hover:border-accent-cyan/50 transition-all relative">
        {isLoading && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm rounded-lg flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-accent-cyan animate-spin" />
          </div>
        )}
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="border-accent-cyan/50 text-accent-cyan capitalize">
                  {getMeditationTypeLabel(entry.meditationType)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {Number(entry.duration)} minutes
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 shrink-0" />
                <span className="break-words">{formatDate(entry.timestamp)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleToggleFavorite(entry.id)}
                disabled={isLoading}
                className="p-2 hover:bg-accent-cyan/10 rounded-full transition-colors disabled:opacity-50"
              >
                <Heart
                  className={`w-5 h-5 ${
                    entry.isFavorite
                      ? 'fill-accent-cyan text-accent-cyan'
                      : 'text-muted-foreground'
                  }`}
                />
              </button>
              {!isEditing && (
                <>
                  <button
                    onClick={() => handleStartEdit(entry)}
                    disabled={isLoading}
                    className="p-2 hover:bg-accent-cyan/10 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground hover:text-accent-cyan" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(entry.id)}
                    disabled={isLoading}
                    className="p-2 hover:bg-red-500/10 rounded-full transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
                  </button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            {entry.mood.map((mood, index) => (
              <div key={index} className="flex items-center gap-2">
                {getMoodIcon(mood)}
                <span className="text-sm font-medium">{getMoodLabel(mood)}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-border/50">
              {getEnergyIcon(entry.energy)}
              <span className="text-sm font-medium">{getEnergyLabel(entry.energy)}</span>
            </div>
          </div>
          {isEditing ? (
            <div className="space-y-3">
              <Textarea
                value={editedReflection}
                onChange={(e) => setEditedReflection(e.target.value)}
                className="min-h-[100px] bg-background/50 border-border/50 focus:border-accent-cyan"
                disabled={isLoading}
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveEdit}
                  size="sm"
                  className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}
                  Save
                </Button>
                <Button
                  onClick={handleCancelEdit}
                  size="sm"
                  variant="outline"
                  className="border-border/50"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            entry.reflection && (
              <p className="text-sm text-muted-foreground leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere">
                {entry.reflection}
              </p>
            )
          )}
        </CardContent>
      </Card>
    );
  };

  const renderSkeletonCards = () => (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} className="bg-card/50 backdrop-blur-sm border-border/30">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <div className="fixed top-0 left-0 w-96 h-96 opacity-15 dark:opacity-10 pointer-events-none">
        <LotusCanvas variant="enhanced" />
      </div>
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-15 dark:opacity-10 pointer-events-none">
        <LotusCanvas variant="enhanced" />
      </div>

      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Desktop Back Button */}
      <button
        onClick={() => navigate({ to: '/dashboard' })}
        className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5 text-accent-cyan" />
      </button>

      {/* Mobile Back Button */}
      {mounted && <MobileBackButton show={true} />}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      {/* Export/Import buttons */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        <Button
          onClick={handleExport}
          size="sm"
          className="bg-accent-cyan/90 hover:bg-accent-cyan text-primary-dark shadow-lg"
          disabled={exportData.isPending}
        >
          {exportData.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export
        </Button>
        <Button
          onClick={handleImportClick}
          size="sm"
          variant="outline"
          className="border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 shadow-lg"
          disabled={importData.isPending}
        >
          {importData.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportFile}
          className="hidden"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Journal Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this journal entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loadingActionId !== null}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600"
              disabled={loadingActionId !== null}
            >
              {loadingActionId !== null ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Import Meditation Data</AlertDialogTitle>
            <AlertDialogDescription>
              This will overwrite your existing meditation data. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport} disabled={importData.isPending}>
              No, cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmImport}
              className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
              disabled={importData.isPending}
            >
              {importData.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Yes, import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto w-full space-y-8 animate-fade-in">
          <div className="text-center space-y-2 mt-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Mindful Journal
            </h1>
            <p className="text-base sm:text-lg text-description-gray">
              Reflect on your meditation journey and insights
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-8">
              <Card className="bg-card/50 backdrop-blur-sm border-border/30">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap justify-center gap-8">
                    <div className="text-center space-y-2 min-w-[120px]">
                      <Skeleton className="h-4 w-24 mx-auto" />
                      <Skeleton className="h-8 w-16 mx-auto" />
                    </div>
                    <div className="text-center space-y-2 min-w-[120px]">
                      <Skeleton className="h-4 w-24 mx-auto" />
                      <Skeleton className="h-8 w-16 mx-auto" />
                    </div>
                    <div className="text-center space-y-2 min-w-[120px]">
                      <Skeleton className="h-4 w-24 mx-auto" />
                      <Skeleton className="h-8 w-16 mx-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                {renderSkeletonCards()}
              </div>
            </div>
          ) : totalSessions === 0 ? (
            <div className="flex justify-center py-20">
              <div className="text-center space-y-4 max-w-md">
                <Calendar className="w-16 h-16 text-accent-cyan/50 mx-auto" />
                <h2 className="text-2xl font-semibold text-foreground">
                  No data yet — meditate to display journaling
                </h2>
                <p className="text-description-gray">
                  Complete a meditation session and add your reflections to start building your journal.
                </p>
                <Button
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="mt-6 bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold"
                >
                  Start Meditating
                </Button>
              </div>
            </div>
          ) : (
            <>
              <Card className="bg-card/50 backdrop-blur-sm border-border/30">
                <CardContent className="pt-6">
                  <div className="flex flex-wrap justify-center gap-8">
                    <div className="text-center space-y-2 min-w-[120px]">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Sessions</CardTitle>
                      <div className="text-3xl font-bold text-accent-cyan">{totalSessions}</div>
                    </div>
                    <div className="text-center space-y-2 min-w-[120px]">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg Duration</CardTitle>
                      <div className="text-3xl font-bold text-accent-cyan">{avgDuration} min</div>
                    </div>
                    <div className="text-center space-y-2 min-w-[120px]">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Favorites</CardTitle>
                      <div className="text-3xl font-bold text-accent-cyan">{favoriteEntries.length}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="all" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                  <TabsTrigger value="all">All Reflections</TabsTrigger>
                  <TabsTrigger value="favorites">Favorites</TabsTrigger>
                </TabsList>

                <div className="mt-6 space-y-4">
                  <div className="flex flex-col min-[800px]:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search reflections..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card/50 backdrop-blur-sm border-border/30"
                      />
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-full min-[800px]:w-40 bg-card/50 backdrop-blur-sm border-border/30">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="metta">Metta</SelectItem>
                        <SelectItem value="visualization">Visualization</SelectItem>
                        <SelectItem value="ifs">IFS</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterMood} onValueChange={setFilterMood}>
                      <SelectTrigger className="w-full min-[800px]:w-40 bg-card/50 backdrop-blur-sm border-border/30">
                        <SelectValue placeholder="Filter by mood" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Moods</SelectItem>
                        <SelectItem value="calm">Calm</SelectItem>
                        <SelectItem value="happy">Happy</SelectItem>
                        <SelectItem value="neutral">Neutral</SelectItem>
                        <SelectItem value="anxious">Anxious</SelectItem>
                        <SelectItem value="sad">Sad</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={filterEnergy} onValueChange={setFilterEnergy}>
                      <SelectTrigger className="w-full min-[800px]:w-40 bg-card/50 backdrop-blur-sm border-border/30">
                        <SelectValue placeholder="Filter by energy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Energy</SelectItem>
                        <SelectItem value="tired">Tired</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="energized">Energized</SelectItem>
                        <SelectItem value="restless">Restless</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <TabsContent value="all" className="space-y-4 mt-6">
                  {filteredEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No reflections found matching your search.
                    </div>
                  ) : (
                    filteredEntries.map((entry) => renderEntryCard(entry))
                  )}
                </TabsContent>

                <TabsContent value="favorites" className="space-y-4 mt-6">
                  {favoriteEntries.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                      <p>No favorite sessions yet. Mark sessions as favorites to see them here.</p>
                    </div>
                  ) : (
                    favoriteEntries.map((entry) => renderEntryCard(entry))
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
