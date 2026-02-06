import { useState } from 'react';
import { TrendingUp, Calendar, Award, Flame } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import ProgressBowl from '../components/ProgressBowl';
import ExportImportControls from '../components/ExportImportControls';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import { useProgressStats, useImportData, useExportData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { useTheme } from 'next-themes';

export default function ProgressPage() {
  const { data: stats, isLoading, isError, refetch } = useProgressStats();
  const importData = useImportData();
  const exportData = useExportData();
  const { theme } = useTheme();

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

  const totalMinutes = stats ? Number(stats.totalMinutes) : 0;
  const currentStreak = stats ? Number(stats.currentStreak) : 0;
  const monthlyMinutes = stats ? Number(stats.monthlyMinutes) : 0;
  const rank = stats?.rank || 'Beginner';

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
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

          {/* Bowl Visualization */}
          <div className="flex justify-center">
            <ProgressBowl totalMinutes={totalMinutes} theme={theme || 'dark'} />
          </div>

          {/* Stats Card */}
          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <TrendingUp className="w-8 h-8 text-accent-cyan" />
                  </div>
                  <div className="text-3xl font-bold text-accent-cyan-tinted">{totalMinutes}</div>
                  <div className="text-sm text-muted-foreground">Total Minutes</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <Flame className="w-8 h-8 text-accent-cyan" />
                  </div>
                  <div className="text-3xl font-bold text-accent-cyan-tinted">{currentStreak}</div>
                  <div className="text-sm text-muted-foreground">Day Streak</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <Calendar className="w-8 h-8 text-accent-cyan" />
                  </div>
                  <div className="text-3xl font-bold text-accent-cyan-tinted">{monthlyMinutes}</div>
                  <div className="text-sm text-muted-foreground">This Month</div>
                </div>

                <div className="text-center space-y-2">
                  <div className="flex justify-center">
                    <Award className="w-8 h-8 text-accent-cyan" />
                  </div>
                  <div className="text-3xl font-bold text-accent-cyan-tinted">{rank}</div>
                  <div className="text-sm text-muted-foreground">Current Rank</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rank Progress */}
          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Rank Progression</h3>
              <div className="flex flex-wrap gap-2">
                {['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'].map((rankName) => (
                  <Badge
                    key={rankName}
                    variant={rank === rankName ? 'default' : 'outline'}
                    className={
                      rank === rankName
                        ? 'bg-accent-cyan text-primary-dark'
                        : 'border-accent-cyan/30 text-muted-foreground'
                    }
                  >
                    {rankName}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• Beginner: 0-49 minutes</p>
                <p>• Intermediate: 50-199 minutes</p>
                <p>• Advanced: 200-499 minutes</p>
                <p>• Expert: 500-999 minutes</p>
                <p>• Master: 1000+ minutes</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <ExportImportControls
        onExport={handleExport}
        onImport={handleImport}
        isExporting={exportData.isPending}
        isImporting={importData.isPending}
      />
    </PageBackgroundShell>
  );
}
