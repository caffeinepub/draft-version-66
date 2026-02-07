import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import MeditationCarousel from '../components/MeditationCarousel';
import FloatingNav from '../components/FloatingNav';
import RitualSelectionModal from '../components/RitualSelectionModal';
import QuizDialog from '../components/QuizDialog';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import { useRituals, useDeleteRitual } from '../hooks/useQueries';
import { validateMeditationType } from '../utils/meditationType';
import type { Ritual } from '../backend';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [selectedMeditation, setSelectedMeditation] = useState('mindfulness');
  const [ritualModalOpen, setRitualModalOpen] = useState(false);
  const [quizDialogOpen, setQuizDialogOpen] = useState(false);
  const { data: rituals } = useRituals();
  const deleteRitual = useDeleteRitual();

  const handleBegin = () => {
    // If quiz is selected, open the quiz dialog instead of navigating
    if (selectedMeditation === 'quiz') {
      setQuizDialogOpen(true);
      return;
    }

    navigate({
      to: '/pre-meditation',
      search: { type: selectedMeditation },
    });
  };

  const handleQuizComplete = (recommendedType: string) => {
    // Validate and coerce the recommended type before navigation
    const validatedType = validateMeditationType(recommendedType);
    
    setQuizDialogOpen(false);
    
    navigate({
      to: '/pre-meditation',
      search: { type: validatedType },
    });
  };

  const handleQuizClose = () => {
    setQuizDialogOpen(false);
  };

  const handleRitualSelect = (ritual: Ritual) => {
    navigate({
      to: '/pre-meditation',
      search: {
        type: ritual.meditationType,
        duration: Number(ritual.duration),
        ambientSound: ritual.ambientSound,
        ambientSoundVolume: Number(ritual.ambientSoundVolume),
        autoStart: true,
      },
    });
  };

  const handleDeleteRitual = async (ritual: Ritual) => {
    await deleteRitual.mutateAsync(ritual);
  };

  const hasRituals = rituals && rituals.length > 0;

  return (
    <PageBackgroundShell>
      <StandardPageNav showBackButton={false} />

      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-12 animate-fade-in">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Begin Your Journey
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Choose your meditation practice and find inner peace
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          <MeditationCarousel
            selectedMeditation={selectedMeditation}
            onSelectMeditation={setSelectedMeditation}
          />

          <div className="flex flex-col items-center gap-4">
            <Button
              onClick={handleBegin}
              size="lg"
              className="px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-semibold bg-accent-cyan hover:bg-accent-cyan-tinted shadow-glow-strong hover:shadow-glow-strong transition-all duration-300 rounded-full"
            >
              Begin
            </Button>

            {hasRituals && (
              <Button
                onClick={() => setRitualModalOpen(true)}
                variant="outline"
                size="lg"
                className="px-8 sm:px-12 py-3 sm:py-4 text-base sm:text-lg font-medium border-accent-cyan/50 hover:bg-accent-cyan/10 rounded-full"
              >
                Your Rituals
              </Button>
            )}
          </div>
        </div>
      </main>

      <FloatingNav />

      <RitualSelectionModal
        open={ritualModalOpen}
        onOpenChange={setRitualModalOpen}
        rituals={rituals || []}
        onSelect={handleRitualSelect}
        onDelete={handleDeleteRitual}
        isDeleting={deleteRitual.isPending}
      />

      <QuizDialog
        open={quizDialogOpen}
        onClose={handleQuizClose}
        onComplete={handleQuizComplete}
      />
    </PageBackgroundShell>
  );
}
