import { useState } from 'react';
import { TrendingUp, Calendar, Award, Flame } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import ExportImportControls from '../components/ExportImportControls';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import ProgressBowl from '../components/ProgressBowl';
import { useProgressStats, useSessionRecords, useImportData, useExportData } from '../hooks/useQueries';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { getCurrentRank, getNextRank, getMinutesUntilNextRank } from '../utils/progressRanks';
import { format } from 'date-fns';

export default function ProgressPage() {
  const { theme } = useTheme();
  const { data: stats, isLoading: statsLoading, isError: statsError, refetch: refetchStats } = useProgressStats();
  const { data: sessions, isLoading: sessionsLoading, isError: sessionsError, refetch: refetchSessions } = useSessionRecords();
  const importData = useImportData();
  const exportData = useExportData();

  const [filterFavorites, setFilterFavorites] = useState(false);

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
  const currentRank = getCurrentRank(totalMinutes);
  const nextRank = getNextRank(totalMinutes);
  const minutesUntilNext = getMinutesUntilNextRank(totalMinutes);

  const sortedSessions = sessions
    ? [...sessions].sort((a, b) => Number(b.timestamp - a.timestamp))
    : [];

  const isLoading = statsLoading || sessionsLoading;
  const isError = statsError || sessionsError;

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
              onRetry={() => {
                refetchStats();
                refetchSessions();
              }} 
              isRetrying={isLoading}
              title="Failed to Load Progress"
              description="We couldn't load your progress data. Please check your connection and try again."
            />
          )}

          {/* Bowl Visualization */}
          <div className="flex justify-center">
            <ProgressBowl totalMinutes={totalMinutes} theme={theme || 'dark'} />
          </div>

          {/* Stats Card - Single Column */}
          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
            <CardHeader>
              <CardTitle className="text-2xl text-accent-cyan flex items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                Your Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="flex items-center justify-between p-4 bg-accent-cyan/5 rounded-lg border border-accent-cyan/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-cyan/10 rounded-lg">
                      <Flame className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Streak</p>
                      <p className="text-2xl font-bold text-foreground">{currentStreak} days</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent-cyan/5 rounded-lg border border-accent-cyan/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-cyan/10 rounded-lg">
                      <Calendar className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Minutes</p>
                      <p className="text-2xl font-bold text-foreground">{totalMinutes} min</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-accent-cyan/5 rounded-lg border border-accent-cyan/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-accent-cyan/10 rounded-lg">
                      <Award className="w-6 h-6 text-accent-cyan" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Rank</p>
                      <p className="text-2xl font-bold text-foreground">{currentRank.name}</p>
                      {nextRank && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {minutesUntilNext} min until {nextRank.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Session History */}
          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
            <CardHeader>
              <CardTitle className="text-xl text-accent-cyan">Session History</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading sessions...</p>
              ) : sortedSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No meditation sessions yet. Start your first session to begin tracking your progress!
                </p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {sortedSessions.map((session, index) => {
                    const sessionDate = new Date(Number(session.timestamp) / 1_000_000);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-accent-cyan/5 rounded-lg border border-accent-cyan/20 hover:border-accent-cyan/40 transition-all"
                      >
                        <div>
                          <p className="font-medium text-foreground">
                            {session.minutes.toString()} minutes
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(sessionDate, 'MMMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                        <Badge variant="outline" className="border-accent-cyan/50 text-accent-cyan">
                          Completed
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
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
