import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, ArrowLeft, Flame, TrendingUp, Award, Download, Upload, Loader2 } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import MobileBackButton from '../components/MobileBackButton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useProgressStats, useExportMeditationData, useImportMeditationData } from '../hooks/useQueries';
import type { ProgressStats } from '../backend';
import { toast } from 'sonner';

interface LocalProgressData {
  totalMinutes: number;
  currentStreak: number;
  monthlyMinutes: number;
  lastSessionDate?: string;
  sessions: Array<{ minutes: number; timestamp: string }>;
}

const RANKS = [
  { name: 'Seedling', subtitle: 'just beginning to open', minMinutes: 0, maxMinutes: 999 },
  { name: 'Budding', subtitle: 'finding your rhythm', minMinutes: 1000, maxMinutes: 4999 },
  { name: 'Blooming', subtitle: 'steady presence', minMinutes: 5000, maxMinutes: 19999 },
  { name: 'Lotus in Full Flower', subtitle: 'deep calm cultivated', minMinutes: 20000, maxMinutes: 99999 },
  { name: 'Master Lotus', subtitle: 'profound wisdom achieved', minMinutes: 100000, maxMinutes: Infinity },
];

export default function ProgressPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const lotusCanvasRef = useRef<HTMLCanvasElement>(null);
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

  function getCurrentRank() {
    return RANKS.find(rank => totalMinutes >= rank.minMinutes && totalMinutes <= rank.maxMinutes) || RANKS[0];
  }

  function getRankIndex() {
    return RANKS.findIndex(rank => totalMinutes >= rank.minMinutes && totalMinutes <= rank.maxMinutes);
  }

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

  useEffect(() => {
    const canvas = lotusCanvasRef.current;
    if (!canvas || !hasData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const centerX = rect.width / 2;
    const centerY = rect.height * 0.6;

    const bloomProgress = Math.min(totalMinutes / 10000, 1);
    
    let animationFrame: number;
    let time = 0;

    function animate() {
      if (!ctx || !canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.015;
      const breathe = Math.sin(time) * 0.08 + 1;
      const glowIntensity = 0.2 + bloomProgress * 0.6;

      const stemHeight = 80 + bloomProgress * 40;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.quadraticCurveTo(
        centerX - 10, 
        centerY - stemHeight / 2, 
        centerX, 
        centerY - stemHeight
      );
      ctx.strokeStyle = `oklch(0.5 0.1 140 / ${0.4 + bloomProgress * 0.4})`;
      ctx.lineWidth = 3;
      ctx.stroke();

      const lotusY = centerY - stemHeight;
      
      const petalCount = 5;
      const baseRadius = (30 + bloomProgress * 50) * breathe;
      
      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * baseRadius * 0.4;
        const y = lotusY + Math.sin(angle) * baseRadius * 0.3;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, baseRadius * 0.4, baseRadius * 0.7, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.7);
        gradient.addColorStop(0, `oklch(0.6 0.12 195 / ${0.2 + bloomProgress * 0.3})`);
        gradient.addColorStop(1, `oklch(0.6 0.12 195 / ${0.05 + bloomProgress * 0.1})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `oklch(0.65 0.12 195 / ${0.3 + bloomProgress * 0.4})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.restore();
      }

      for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI - Math.PI / 2;
        const x = centerX + Math.cos(angle) * baseRadius * 0.6;
        const y = lotusY + Math.sin(angle) * baseRadius * 0.5;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI / 2);
        
        ctx.beginPath();
        ctx.ellipse(0, 0, baseRadius * 0.5, baseRadius * 0.9, 0, 0, Math.PI * 2);
        
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, baseRadius * 0.9);
        gradient.addColorStop(0, `oklch(0.7 0.15 195 / ${0.4 + bloomProgress * 0.5})`);
        gradient.addColorStop(1, `oklch(0.7 0.15 195 / ${0.1 + bloomProgress * 0.2})`);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.strokeStyle = `oklch(0.7 0.15 195 / ${0.5 + bloomProgress * 0.4})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
      }

      const glowRadius = (20 + bloomProgress * 30) * breathe;
      const glowGradient = ctx.createRadialGradient(centerX, lotusY, 0, centerX, lotusY, glowRadius);
      glowGradient.addColorStop(0, `oklch(0.8 0.2 195 / ${glowIntensity * breathe})`);
      glowGradient.addColorStop(0.5, `oklch(0.75 0.18 195 / ${glowIntensity * 0.5})`);
      glowGradient.addColorStop(1, 'oklch(0.7 0.15 195 / 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.arc(centerX, lotusY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 3; i++) {
        const ringRadius = glowRadius + (i + 1) * 15;
        const ringOpacity = (glowIntensity * 0.3) / (i + 1);
        ctx.beginPath();
        ctx.arc(centerX, lotusY, ringRadius * breathe, 0, Math.PI * 2);
        ctx.strokeStyle = `oklch(0.7 0.15 195 / ${ringOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationFrame = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [hasData, totalMinutes]);

  const currentRank = getCurrentRank();
  const currentRankIndex = getRankIndex();

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#040f13] to-background">
      <div className="fixed top-0 left-0 w-96 h-96 opacity-10 dark:opacity-8 pointer-events-none">
        <LotusCanvas variant="enhanced" />
      </div>
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-10 dark:opacity-8 pointer-events-none">
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
              <div className="flex justify-center">
                <div className="relative">
                  <canvas
                    ref={lotusCanvasRef}
                    className="w-72 h-72 sm:w-80 sm:h-80"
                    style={{
                      filter: 'drop-shadow(0 0 40px oklch(0.7 0.15 195 / 0.4))',
                    }}
                  />
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-center pointer-events-none">
                    <div className="text-2xl sm:text-3xl font-bold text-accent-cyan">
                      {Math.round((totalMinutes / 10000) * 100)}% Bloomed
                    </div>
                    <div className="text-sm text-description-gray mt-1">
                      {totalMinutes} / 10,000 minutes
                    </div>
                  </div>
                </div>
              </div>

              <div className="max-w-3xl mx-auto space-y-6">
                <div className="grid grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
                    <TrendingUp className="w-8 h-8 text-accent-cyan mx-auto" />
                    <div className="text-3xl font-bold text-accent-cyan">
                      {totalMinutes.toLocaleString()}
                    </div>
                    <p className="text-sm text-muted-foreground">Total Minutes</p>
                  </div>

                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
                    <Flame className="w-8 h-8 text-accent-cyan mx-auto" />
                    <div className="text-3xl font-bold text-accent-cyan">
                      {currentStreak}
                    </div>
                    <p className="text-sm text-muted-foreground">Day Streak</p>
                  </div>

                  <div className="text-center space-y-2 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/30">
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
                  {currentRankIndex < RANKS.length - 1 && (
                    <div className="text-sm text-description-gray pt-3 border-t border-border/30">
                      {RANKS[currentRankIndex + 1].minMinutes - totalMinutes} minutes until{' '}
                      <span className="text-accent-cyan font-semibold">
                        {RANKS[currentRankIndex + 1].name}
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
