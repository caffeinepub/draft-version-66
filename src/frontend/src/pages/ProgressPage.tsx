import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, Flame, Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import ProgressBowl from '../components/ProgressBowl';
import { useProgressStats, useImportData, useExportData } from '../hooks/useQueries';
import { getCurrentRank, getNextRank, getMinutesUntilNextRank } from '../utils/progressRanks';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';

export default function ProgressPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const { data: progressStats, isLoading, isError, error, refetch } = useProgressStats();
  const importData = useImportData();
  const exportData = useExportData();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      toast.success('Progress data imported successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }

    event.target.value = '';
  };

  const totalMinutes = progressStats ? Number(progressStats.totalMinutes) : 0;
  const currentStreak = progressStats ? Number(progressStats.currentStreak) : 0;
  const monthlyMinutes = progressStats ? Number(progressStats.monthlyMinutes) : 0;
  
  const currentRank = getCurrentRank(totalMinutes);
  const nextRank = getNextRank(totalMinutes);
  const minutesUntilNext = getMinutesUntilNextRank(totalMinutes);

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in mt-16">
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
              title="Failed to Load Progress"
              description="We couldn't load your progress data. Please check your connection and try again."
            />
          )}

          {/* Bowl Visualization - Centered */}
          <div className="flex items-center justify-center w-full">
            <div className="relative w-full max-w-md mx-auto flex items-center justify-center" style={{ height: '300px' }}>
              {mounted && <ProgressBowl totalMinutes={totalMinutes} theme={theme || 'light'} />}
            </div>
          </div>

          {/* Consolidated Stats Card - Single Column */}
          <div className="bg-card/70 backdrop-blur-md border-2 border-accent-cyan/30 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-2xl font-bold text-accent-cyan text-center mb-4">Your Statistics</h2>
            
            <div className="space-y-4">
              {/* Rank */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20">
                <div className="flex items-center gap-3">
                  <Trophy className="w-8 h-8 text-accent-cyan" />
                  <div>
                    <p className="text-sm text-muted-foreground">Current Rank</p>
                    <p className="text-2xl font-bold text-accent-cyan">{currentRank.name}</p>
                    {nextRank && minutesUntilNext !== null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {minutesUntilNext} min to {nextRank.name}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Minutes */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-accent-cyan" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Minutes</p>
                    <p className="text-2xl font-bold text-accent-cyan">{totalMinutes}</p>
                  </div>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20">
                <div className="flex items-center gap-3">
                  <Flame className="w-8 h-8 text-accent-cyan" />
                  <div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                    <p className="text-2xl font-bold text-accent-cyan">{currentStreak}</p>
                  </div>
                </div>
              </div>

              {/* Monthly Minutes */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-accent-cyan/5 border border-accent-cyan/20">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-accent-cyan" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                    <p className="text-2xl font-bold text-accent-cyan">{monthlyMinutes}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
          <input type="file" accept=".json" onChange={handleImport} className="hidden" />
        </label>
      </div>
    </PageBackgroundShell>
  );
}
