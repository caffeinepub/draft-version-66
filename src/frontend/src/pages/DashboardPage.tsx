import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import QuizDialog from '../components/QuizDialog';
import RitualSelectionModal from '../components/RitualSelectionModal';
import CloudSyncErrorBanner from '../components/CloudSyncErrorBanner';
import PageBackgroundShell from '../components/PageBackgroundShell';
import { useDailyQuotes, useRituals, useDeleteRitual } from '../hooks/useQueries';
import type { Ritual } from '../backend';

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [selectedType, setSelectedType] = useState('mindfulness');
  const [quizOpen, setQuizOpen] = useState(false);
  const [ritualsModalOpen, setRitualsModalOpen] = useState(false);

  const { data: quotes, isLoading: quotesLoading } = useDailyQuotes();
  const { data: rituals, isLoading: ritualsLoading, isError: ritualsError, refetch: refetchRituals } = useRituals();
  const deleteRitual = useDeleteRitual();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Memoize the quote selection so it doesn't change on carousel navigation
  const displayQuote = useMemo(() => {
    if (quotes && quotes.length > 0) {
      // Filter out empty quotes
      const validQuotes = quotes.filter(q => q && q.trim().length > 0);
      if (validQuotes.length > 0) {
        return validQuotes[Math.floor(Math.random() * validQuotes.length)];
      }
    }
    return 'Welcome to your meditation journey.';
  }, [quotes]);

  const handleBegin = () => {
    // If "Take Quiz" is selected, open quiz dialog instead of navigating
    if (selectedType === 'quiz') {
      setQuizOpen(true);
      return;
    }
    
    navigate({
      to: '/pre-meditation',
      search: { type: selectedType },
    });
  };

  const handleQuizComplete = (recommendedType: string) => {
    setQuizOpen(false);
    // Auto-navigate to pre-meditation after quiz with fromQuiz flag
    navigate({
      to: '/pre-meditation',
      search: { type: recommendedType, fromQuiz: true },
    });
  };

  const handleStartRitual = (ritual: { meditationType: string; duration: number; ambientSound: string; ambientSoundVolume: number; timestamp: string; displayName: string }) => {
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
    setRitualsModalOpen(false);
  };

  const handleDeleteRitual = async (ritual: { meditationType: string; duration: number; ambientSound: string; ambientSoundVolume: number; timestamp: string; displayName: string }) => {
    // Convert back to backend Ritual type
    const backendRitual: Ritual = {
      meditationType: ritual.meditationType as any,
      duration: BigInt(ritual.duration),
      ambientSound: ritual.ambientSound,
      ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
      timestamp: BigInt(ritual.timestamp),
    };
    await deleteRitual.mutateAsync(backendRitual);
  };

  const hasRituals = rituals && rituals.length > 0;
  const showRitualsButton = hasRituals && !ritualsError;

  return (
    <PageBackgroundShell>
      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle - no back button on dashboard */}
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

      {/* Mobile Hamburger Menu - no back button on dashboard */}
      {mounted && <HamburgerMenu />}

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-5xl mx-auto w-full space-y-8 sm:space-y-12 animate-fade-in">
          {/* Daily Quote */}
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Find Your Center
            </h1>
            <div className="max-w-3xl mx-auto">
              <p className="text-lg sm:text-xl md:text-2xl text-description-gray leading-relaxed font-medium italic">
                {quotesLoading ? 'Loading wisdom...' : `"${displayQuote}"`}
              </p>
            </div>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          {/* Rituals Error Banner */}
          {ritualsError && (
            <div className="max-w-2xl mx-auto">
              <CloudSyncErrorBanner
                onRetry={refetchRituals}
                isRetrying={ritualsLoading}
                title="Failed to Load Rituals"
                description="We couldn't load your saved rituals. Please check your connection and try again."
              />
            </div>
          )}

          {/* Meditation Type Carousel */}
          <div className="space-y-6">
            <MeditationCarousel selectedMeditation={selectedType} onSelectMeditation={setSelectedType} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Button
              onClick={handleBegin}
              size="lg"
              className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Begin
            </Button>

            {showRitualsButton && (
              <Button
                onClick={() => setRitualsModalOpen(true)}
                size="lg"
                variant="outline"
                className="w-full sm:w-auto px-6 sm:px-8 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-full border-2 border-accent-cyan/60 text-accent-cyan hover:bg-accent-cyan hover:text-primary-dark transition-all duration-300 hover:scale-105"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Your Rituals
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Floating Navigation */}
      <FloatingNav />

      {/* Quiz Dialog */}
      <QuizDialog open={quizOpen} onClose={() => setQuizOpen(false)} onComplete={handleQuizComplete} />

      {/* Rituals Modal */}
      {hasRituals && (
        <RitualSelectionModal
          open={ritualsModalOpen}
          onClose={() => setRitualsModalOpen(false)}
          rituals={rituals.map((r) => ({
            meditationType: r.meditationType,
            displayName: r.meditationType.charAt(0).toUpperCase() + r.meditationType.slice(1),
            duration: Number(r.duration),
            ambientSound: r.ambientSound,
            ambientSoundVolume: Number(r.ambientSoundVolume),
            timestamp: Number(r.timestamp).toString(),
          }))}
          onStart={handleStartRitual}
          onDelete={handleDeleteRitual}
          isDeleting={deleteRitual.isPending}
        />
      )}
    </PageBackgroundShell>
  );
}
