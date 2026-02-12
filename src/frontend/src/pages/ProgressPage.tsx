import { useState, useRef } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useTheme } from 'next-themes';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import ProgressBowl from '../components/ProgressBowl';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import { useProgressStats, useImportData, useExportData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { classifyCloudSyncError } from '../utils/cloudSync';
import { formatRankDisplay } from '../utils/progressRanks';

export default function ProgressPage() {
  const { theme } = useTheme();
  const { data: stats, isLoading, isError, error, refetch } = useProgressStats();
  const importData = useImportData();
  const exportData = useExportData();
  
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      toast.success('Progress data exported successfully');
    } catch (error: any) {
      // Error already handled by mutation onError
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setPendingFile(file);
    setShowImportConfirm(true);
  };

  const handleImportCancel = () => {
    setShowImportConfirm(false);
    setPendingFile(null);
    // Clear the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportConfirm = async () => {
    if (!pendingFile) return;

    try {
      await importData.mutateAsync({ file: pendingFile, overwrite: true });
      toast.success('Progress data imported successfully');
      setShowImportConfirm(false);
      setPendingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      // Error already handled by mutation onError
      setShowImportConfirm(false);
      setPendingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalMinutes = stats ? Number(stats.totalMinutes) : 0;
  const currentStreak = stats ? Number(stats.currentStreak) : 0;
  const monthlyMinutes = stats ? Number(stats.monthlyMinutes) : 0;
  const rank = stats ? stats.rank : 'Beginner';

  // Classify error type for better messaging
  const errorType = isError && error ? classifyCloudSyncError(error) : 'other';

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in mt-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Your Progress
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Track your meditation journey and celebrate your growth
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

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent-cyan" />
            </div>
          ) : (
            <>
              {/* Bowl Visualization */}
              <div className="flex justify-center">
                <ProgressBowl totalMinutes={totalMinutes} theme={theme || 'dark'} />
              </div>

              {/* Redesigned Stats Card */}
              <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-accent-cyan/20 shadow-glow max-w-2xl mx-auto">
                {/* Compact Header */}
                <div className="text-center mb-6">
                  <h2 className="text-lg font-semibold text-muted-foreground mb-1">Your Journey</h2>
                  <div className="text-3xl font-bold text-accent-cyan">
                    {formatRankDisplay(totalMinutes)}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                  {/* Total Minutes */}
                  <div className="bg-background/40 rounded-xl p-4 text-center border border-accent-cyan/10 hover:border-accent-cyan/30 transition-colors">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                      {totalMinutes.toLocaleString()}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Total Minutes</div>
                  </div>

                  {/* Day Streak */}
                  <div className="bg-background/40 rounded-xl p-4 text-center border border-accent-cyan/10 hover:border-accent-cyan/30 transition-colors">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                      {currentStreak}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">Day Streak</div>
                  </div>

                  {/* This Month */}
                  <div className="bg-background/40 rounded-xl p-4 text-center border border-accent-cyan/10 hover:border-accent-cyan/30 transition-colors">
                    <div className="text-3xl sm:text-4xl font-bold text-foreground mb-1">
                      {monthlyMinutes}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">This Month</div>
                  </div>
                </div>
              </div>
            </>
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
            className="border-accent-cyan/50 hover:bg-accent-cyan/10 bg-card/90 backdrop-blur-sm shadow-lg cursor-pointer"
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
            onChange={handleFileSelect} 
            className="hidden" 
          />
        </label>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              Importing will overwrite all your existing journal entries and progress data. This action cannot be undone. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleImportCancel} disabled={importData.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleImportConfirm}
              disabled={importData.isPending}
              className="bg-accent-cyan hover:bg-accent-cyan/90"
            >
              {importData.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Confirm Import'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageBackgroundShell>
  );
}
