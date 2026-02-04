import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ArrowLeft, Flame, TrendingUp, Award, Download, Upload, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import MobileBackButton from '../components/MobileBackButton';
import ProgressBowl from '../components/ProgressBowl';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProgressStats, useExportMeditationData, useImportMeditationData } from '../hooks/useQueries';
import type { ProgressStats } from '../backend';
import { toast } from 'sonner';
import { useRef } from 'react';
import { getCurrentRank, getRankIndex, getNextRank, getMinutesUntilNextRank, RANK_TIERS } from '../utils/progressRanks';

interface LocalProgressData {
  totalMinutes: number;
  currentStreak: number;
  monthlyMinutes: number;
  lastSessionDate?: string;
  sessions: Array<{ minutes: number; timestamp: string }>;
}

export default function ProgressPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  
  const { data: stats, isLoading } = useProgressStats();
  const exportData = useExportMeditationData();
  const importData = useImportMeditationData();

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalMinutes = stats 
    ? ('totalMinutes' in stats && typeof stats.totalMinutes === 'bigint' 
        ? Number(stats.totalMinutes) 
        : (stats as LocalProgressData).totalMinutes)
    : 0;
    
  const currentStreak = stats
    ? ('currentStreak' in stats && typeof stats.currentStreak === 'bigint'
        ? Number(stats.currentStreak)
        : (stats as LocalProgressData).currentStreak)
    : 0;
    
  const monthlyMinutes = stats
    ? ('monthlyMinutes' in stats && typeof stats.monthlyMinutes === 'bigint'
        ? Number(stats.monthlyMinutes)
        : (stats as LocalProgressData).monthlyMinutes)
    : 0;

  const hasData = totalMinutes > 0;

  const handleExport = async () => {
    try {
      await exportData.mutateAsync();
      toast.success('Meditation data exported successfully', {
        className: 'border-2 border-accent-cyan/50 bg-accent-cyan/10',
        style: {
          background: 'oklch(0.65 0.12 195 / 0.1)',
          borderColor: 'oklch(0.65 0.12 195 / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
      });
    } catch (error) {
      toast.error('Failed to export meditation data', {
        className: 'border-2 border-destructive/50 bg-destructive/10',
        style: {
          background: 'oklch(var(--destructive) / 0.1)',
          borderColor: 'oklch(var(--destructive) / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
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
        className: 'border-2 border-accent-cyan/50 bg-accent-cyan/10',
        style: {
          background: 'oklch(0.65 0.12 195 / 0.1)',
          borderColor: 'oklch(0.65 0.12 195 / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
      });
    } catch (error) {
      toast.error('Failed to import meditation data. Please check the file format.', {
        className: 'border-2 border-destructive/50 bg-destructive/10',
        style: {
          background: 'oklch(var(--destructive) / 0.1)',
          borderColor: 'oklch(var(--destructive) / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
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

  const currentRank = getCurrentRank(totalMinutes);
  const currentRankIndex = getRankIndex(totalMinutes);
  const nextRank = getNextRank(totalMinutes);
  const minutesUntilNext = getMinutesUntilNextRank(totalMinutes);
  const bloomPercent = Math.min(Math.round((totalMinutes / 20000) * 100), 100);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
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
              Your Meditation Journey
            </h1>
            <p className="text-base sm:text-lg text-description-gray">
              Track your progress and celebrate your growth
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mx-auto"></div>
                <p className="text-description-gray">Loading your progress...</p>
              </div>
            </div>
          ) : !hasData ? (
            <div className="flex justify-center py-20">
              <div className="text-center space-y-4 max-w-md">
                <TrendingUp className="w-16 h-16 text-accent-cyan/50 mx-auto" />
                <h2 className="text-2xl font-semibold text-foreground">
                  No progress yet — start meditating to see your journey bloom.
                </h2>
                <p className="text-description-gray">
                  Start your first meditation session to begin tracking your progress and watch your lotus bloom.
                </p>
                <Button
                  onClick={() => navigate({ to: '/dashboard' })}
                  className="mt-6 bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold"
                >
                  Begin Your Journey
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col items-center gap-6">
                {/* Bowl visualization container with extra padding for shadow overflow */}
                <div className="relative w-full max-w-[320px] h-[320px] flex items-center justify-center" style={{ padding: '60px' }}>
                  {mounted && theme && (
                    <ProgressBowl 
                      totalMinutes={totalMinutes} 
                      theme={theme} 
                    />
                  )}
                </div>
                
                {/* Fill percentage text - below the bowl */}
                <div className="text-center space-y-1 -mt-2">
                  <div className="text-2xl sm:text-3xl font-bold text-accent-cyan drop-shadow-lg">
                    {bloomPercent}% Filled
                  </div>
                  <div className="text-sm text-description-gray drop-shadow">
                    {totalMinutes.toLocaleString()} / 20,000 minutes
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                {/* Stats cards with responsive layout */}
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 flex-1 min-w-[140px] max-w-[200px]">
                    <TrendingUp className="w-8 h-8 text-accent-cyan mx-auto" />
                    <div className="text-3xl font-bold text-accent-cyan">
                      {totalMinutes.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Minutes</p>
                  </div>

                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 flex-1 min-w-[140px] max-w-[200px]">
                    <Flame className="w-8 h-8 text-accent-cyan mx-auto" />
                    <div className="text-3xl font-bold text-accent-cyan">
                      {currentStreak}
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>

                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30 flex-1 min-w-[140px] max-w-[200px]">
                    <Award className="w-8 h-8 text-accent-cyan mx-auto" />
                    <div className="text-3xl font-bold text-accent-cyan">
                      {monthlyMinutes}
                    </div>
                    <p className="text-sm text-muted-foreground">This Month</p>
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-card/50 backdrop-blur-sm border-2 border-accent-cyan/30 text-center space-y-3">
                  <div className="text-2xl font-bold text-accent-cyan">
                    {currentRank.name}
                  </div>
                  <div className="text-base text-muted-foreground italic font-playfair">
                    {currentRank.subtitle}
                  </div>
                  {nextRank && minutesUntilNext !== null && (
                    <div className="text-sm text-description-gray pt-3 border-t border-border/30">
                      {minutesUntilNext.toLocaleString()} minutes until{' '}
                      <span className="text-accent-cyan font-semibold">
                        {nextRank.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
