import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Sparkles, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import QuizDialog from '../components/QuizDialog';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import RitualSelectionModal from '../components/RitualSelectionModal';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import { useDailyQuotes, useRituals, useDeleteRitual } from '../hooks/useQueries';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [selectedMeditation, setSelectedMeditation] = useState('mindfulness');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showRitualsModal, setShowRitualsModal] = useState(false);

  const { data: quotes = [] } = useDailyQuotes();
  const { data: rituals = [], isError: ritualsError, error: ritualsErrorObj, refetch: refetchRituals, isLoading: ritualsLoading } = useRituals();
  const deleteRitual = useDeleteRitual();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (quotes.length > 0) {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setDailyQuote(randomQuote);
    }
  }, [quotes]);

  const handleBegin = () => {
    if (selectedMeditation === 'quiz') {
      setShowQuiz(true);
    } else {
      navigate({
        to: '/pre-meditation',
        search: { type: selectedMeditation },
      });
    }
  };

  const handleQuizComplete = (recommendedType: string) => {
    setShowQuiz(false);
    navigate({
      to: '/pre-meditation',
      search: { type: recommendedType, fromQuiz: true },
    });
  };

  const handleStartRitual = (ritual: any) => {
    navigate({
      to: '/pre-meditation',
      search: {
        type: ritual.meditationType,
        ritualDuration: ritual.duration,
        ritualSound: ritual.ambientSound,
        ritualVolume: ritual.ambientSoundVolume,
        instantStart: true,
      },
    });
  };

  const handleDeleteRitual = async (ritual: any) => {
    try {
      await deleteRitual.mutateAsync(ritual);
      toast.success('Ritual deleted successfully', {
        className: 'border-2 border-accent-cyan/50 bg-accent-cyan/10',
        style: {
          background: 'oklch(0.65 0.12 195 / 0.1)',
          borderColor: 'oklch(0.65 0.12 195 / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
      });
    } catch (error: any) {
      console.error('Delete ritual error:', error);
      const message = getCloudSyncErrorMessage(error);
      toast.error(message, {
        className: 'border-2 border-destructive/50 bg-destructive/10',
        style: {
          background: 'oklch(var(--destructive) / 0.1)',
          borderColor: 'oklch(var(--destructive) / 0.5)',
          color: theme === 'dark' ? 'oklch(0.93 0.01 210)' : 'oklch(0.145 0.02 210)',
        },
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <LotusCanvas variant="enhanced" intensity={0.7} />

      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

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

      {mounted && <HamburgerMenu />}
      <FloatingNav />

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 animate-fade-in">
          {ritualsError && (
            <CloudSyncErrorBanner
              onRetry={() => refetchRituals()}
              isRetrying={ritualsLoading}
              title="Rituals Unavailable"
              description="We couldn't load your saved rituals. You can still start a meditation session normally."
            />
          )}

          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair italic text-accent-cyan-tinted">
              Today's Inspiration
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-description-gray max-w-2xl mx-auto leading-relaxed font-medium px-4">
              "{dailyQuote || 'Loading inspiration...'}"
            </p>
          </div>

          <div className="pt-2">
            <MeditationCarousel
              selectedMeditation={selectedMeditation}
              onSelectMeditation={setSelectedMeditation}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2">
            <Button
              size="lg"
              onClick={handleBegin}
              className="w-full sm:w-auto bg-accent-cyan/95 hover:bg-accent-cyan text-primary-dark font-semibold px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-glow hover:shadow-glow-strong transition-all duration-300 hover:scale-105"
            >
              Begin
            </Button>
            {!ritualsError && rituals.length > 0 && (
              <Button
                size="lg"
                onClick={() => setShowRitualsModal(true)}
                variant="outline"
                className="w-full sm:w-auto border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 text-foreground font-semibold px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg rounded-full transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-5 h-5 mr-2 text-accent-cyan" />
                Your Rituals
              </Button>
            )}
          </div>
        </div>
      </main>

      <QuizDialog open={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />

      <RitualSelectionModal
        open={showRitualsModal}
        onClose={() => setShowRitualsModal(false)}
        rituals={rituals}
        onStart={handleStartRitual}
        onDelete={handleDeleteRitual}
        isDeleting={deleteRitual.isPending}
      />
    </div>
  );
}
