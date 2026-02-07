import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Heart } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import QuizDialog from '../components/QuizDialog';
import RitualSelectionModal from '../components/RitualSelectionModal';
import { useDailyQuotes, useRituals, useDeleteRitual } from '../hooks/useQueries';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedMeditation, setSelectedMeditation] = useState('mindfulness');
  const [showQuizDialog, setShowQuizDialog] = useState(false);
  const [showRitualModal, setShowRitualModal] = useState(false);
  const { data: quotes } = useDailyQuotes();
  const { data: rituals, isLoading: ritualsLoading } = useRituals();
  const deleteRitual = useDeleteRitual();

  const sanitizedQuotes = useMemo(() => {
    if (!quotes) return [];
    return quotes.filter((q) => q && q.trim().length > 0);
  }, [quotes]);

  const randomQuote = useMemo(() => {
    if (sanitizedQuotes.length === 0) return 'Begin your meditation journey today.';
    const randomIndex = Math.floor(Math.random() * sanitizedQuotes.length);
    return sanitizedQuotes[randomIndex];
  }, [sanitizedQuotes]);

  const handleBeginClick = () => {
    if (selectedMeditation === 'quiz') {
      setShowQuizDialog(true);
    } else if (selectedMeditation === 'ritual') {
      setShowRitualModal(true);
    } else {
      navigate({ to: '/pre-meditation', search: { type: selectedMeditation } });
    }
  };

  const handleQuizComplete = (recommendedType: string) => {
    setShowQuizDialog(false);
    navigate({ to: '/pre-meditation', search: { type: recommendedType } });
  };

  const handleRitualStart = (ritual: any) => {
    setShowRitualModal(false);
    navigate({ 
      to: '/pre-meditation', 
      search: { type: ritual.meditationType }
    });
  };

  const handleRitualDelete = async (ritual: any) => {
    await deleteRitual.mutateAsync(ritual);
  };

  const formattedRituals = useMemo(() => {
    if (!rituals) return [];
    return rituals.map(r => ({
      meditationType: r.meditationType,
      duration: Number(r.duration),
      ambientSound: r.ambientSound,
      ambientSoundVolume: Number(r.ambientSoundVolume),
      timestamp: new Date(Number(r.timestamp) / 1_000_000).toISOString(),
      displayName: `${r.meditationType} - ${Number(r.duration)} min`,
    }));
  }, [rituals]);

  // Determine if we have rituals (non-empty array)
  const hasRituals = rituals && rituals.length > 0;

  return (
    <PageBackgroundShell variant="default" intensity={0.3}>
      <StandardPageNav showBackButton={false} />
      <FloatingNav />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl mx-auto space-y-12 animate-fade-in">
          <div className="text-center space-y-6">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Find Your Peace
            </h1>
            <p className="text-xl sm:text-2xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              {randomQuote}
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-8"></div>
          </div>

          <div className="space-y-8">
            <MeditationCarousel selectedMeditation={selectedMeditation} onSelectMeditation={setSelectedMeditation} />

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleBeginClick}
                size="lg"
                className="w-full sm:w-auto bg-accent-cyan hover:bg-accent-cyan-tinted text-white font-semibold px-12 py-6 text-lg rounded-full shadow-glow-strong transition-all"
              >
                <Play className="w-6 h-6 mr-2" />
                Begin
              </Button>

              {hasRituals && (
                <Button
                  onClick={() => setShowRitualModal(true)}
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-accent-cyan/50 hover:bg-accent-cyan/10 text-accent-cyan-tinted font-semibold px-12 py-6 text-lg rounded-full transition-all"
                >
                  <Heart className="w-6 h-6 mr-2" />
                  Your Rituals
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>

      <QuizDialog
        open={showQuizDialog}
        onClose={() => setShowQuizDialog(false)}
        onComplete={handleQuizComplete}
      />

      <RitualSelectionModal
        open={showRitualModal}
        onClose={() => setShowRitualModal(false)}
        rituals={formattedRituals}
        onStart={handleRitualStart}
        onDelete={handleRitualDelete}
        isDeleting={deleteRitual.isPending}
      />
    </PageBackgroundShell>
  );
}
