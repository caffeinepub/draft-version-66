import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate } from '@tanstack/react-router';
import LotusCanvas from '../components/LotusCanvas';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import QuizDialog from '../components/QuizDialog';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import { useDailyQuotes } from '../hooks/useQueries';

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [dailyQuote, setDailyQuote] = useState('');
  const [selectedMeditation, setSelectedMeditation] = useState('mindfulness');
  const [showQuiz, setShowQuiz] = useState(false);

  const { data: quotes = [] } = useDailyQuotes();

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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#040f13] to-background">
      {/* Two Lotus Canvases scattered diagonally across corners */}
      <div className="fixed top-0 left-0 w-[40%] h-[40%] opacity-20 pointer-events-none">
        <LotusCanvas />
      </div>
      <div className="fixed bottom-0 right-0 w-[40%] h-[40%] opacity-20 pointer-events-none">
        <LotusCanvas />
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

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      {/* Floating Navigation - Always visible on all screen sizes */}
      <FloatingNav />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 animate-fade-in">
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
