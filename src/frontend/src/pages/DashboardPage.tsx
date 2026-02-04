import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import LotusCanvas from '../components/LotusCanvas';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import QuizDialog from '../components/QuizDialog';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import SavedRitualsCarousel from '../components/SavedRitualsCarousel';
import { useDailyQuotes, useRituals, useDeleteRitual } from '../hooks/useQueries';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import { toast } from 'sonner';

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [selectedMeditation, setSelectedMeditation] = useState('mindfulness');
  const [showQuiz, setShowQuiz] = useState(false);
  const [showRitualArrows, setShowRitualArrows] = useLocalStorageState('ritual-arrows-enabled', true);

  const { data: quotes = [] } = useDailyQuotes();
  const { data: rituals = [], isLoading: ritualsLoading } = useRituals();
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
        className: 'bg-card border-2 border-accent-cyan/50 text-foreground',
      });
    } catch (error) {
      console.error('Error deleting ritual:', error);
      toast.error('Failed to delete ritual. Please try again.', {
        className: 'bg-card border-2 border-destructive/50 text-foreground',
      });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      {/* Single centered Lotus Canvas with reduced intensity */}
      <LotusCanvas variant="enhanced" intensity={0.7} />

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

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      {/* Floating Navigation - Always visible on all screen sizes */}
      <FloatingNav />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 animate-fade-in">
          {/* Rituals Section - Only shown when rituals exist */}
          {!ritualsLoading && rituals.length > 0 && (
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center">
                  Your Rituals
                </h2>
                {rituals.length >= 2 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="show-arrows"
                      checked={showRitualArrows}
                      onCheckedChange={(checked) => setShowRitualArrows(checked === true)}
                    />
                    <Label
                      htmlFor="show-arrows"
                      className="text-sm text-muted-foreground cursor-pointer"
                    >
                      Show navigation arrows
                    </Label>
                  </div>
                )}
              </div>
              <SavedRitualsCarousel
                rituals={rituals}
                onStart={handleStartRitual}
                onDelete={handleDeleteRitual}
                isDeleting={deleteRitual.isPending}
                showArrows={showRitualArrows}
              />
            </div>
          )}

          {/* Daily Quote Banner - Reduced spacing */}
          <div className="text-center space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-playfair italic text-accent-cyan-tinted">
              Today's Inspiration
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-description-gray max-w-2xl mx-auto leading-relaxed font-medium px-4">
              "{dailyQuote || 'Loading inspiration...'}"
            </p>
          </div>

          {/* Meditation Picker Carousel */}
          <div className="pt-2">
            <MeditationCarousel
              selectedMeditation={selectedMeditation}
              onSelectMeditation={setSelectedMeditation}
            />
          </div>

          {/* Begin Button */}
          <div className="flex justify-center pt-2">
            <Button
              size="lg"
              onClick={handleBegin}
              className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 sm:px-12 py-5 sm:py-6 text-base sm:text-lg rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105 animate-glow-pulse"
            >
              Begin
            </Button>
          </div>
        </div>
      </main>

      {/* Quiz Dialog */}
      <QuizDialog open={showQuiz} onClose={() => setShowQuiz(false)} onComplete={handleQuizComplete} />
    </div>
  );
}
