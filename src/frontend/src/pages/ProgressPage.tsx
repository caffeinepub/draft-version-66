import { useState, useRef } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      toast.success('Progress data exported successfully');
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
      toast.success('Progress data imported successfully');
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

              {/* Stats Card */}
              <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-8 border border-accent-cyan/20 shadow-glow max-w-md mx-auto">
                <div className="space-y-6">
                  <div className="text-center pb-4 border-b border-accent-cyan/20">
                    <div className="text-5xl font-bold text-accent-cyan mb-2">
                      {formatRankDisplay(totalMinutes)}
                    </div>
                    <div className="text-sm text-muted-foreground">Current Rank</div>
                  </div>

                  <div className="text-center pb-4 border-b border-accent-cyan/20">
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {totalMinutes.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Minutes</div>
                  </div>

                  <div className="text-center pb-4 border-b border-accent-cyan/20">
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {currentStreak}
                    </div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>

                  <div className="text-center">
                    <div className="text-4xl font-bold text-foreground mb-2">
                      {monthlyMinutes}
                    </div>
                    <div className="text-sm text-muted-foreground">This Month</div>
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
            onChange={handleImportFileSelect} 
            className="hidden" 
          />
        </label>
      </div>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={importConfirmOpen} onOpenChange={setImportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace all your existing journal entries, progress stats, and session records with the data from the imported file. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelImport} disabled={importData.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmImport}
              disabled={importData.isPending}
              className="bg-accent-cyan hover:bg-accent-cyan-tinted"
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
