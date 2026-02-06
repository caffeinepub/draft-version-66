import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Play, Pause, Volume2, ChevronLeft, ChevronRight, Heart, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import MeditationCarousel from '../components/MeditationCarousel';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import MeditationTimerWaveFill from '../components/MeditationTimerWaveFill';
import RitualSelectionModal from '../components/RitualSelectionModal';
import { useCreateJournalEntry, useSaveRitual, useRituals, useDeleteRitual } from '../hooks/useQueries';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import type { MeditationType, MoodState, EnergyState, JournalEntryInput, Ritual as BackendRitual } from '../backend';
import { Smile, Meh, Frown, Heart as HeartIcon, CloudRain, Zap, Battery, Wind } from 'lucide-react';

export const moodIconMap: Record<MoodState, React.ComponentType<{ className?: string }>> = {
  calm: Smile,
  happy: Smile,
  neutral: Meh,
  anxious: CloudRain,
  sad: Frown,
};

export const energyIconMap: Record<EnergyState, React.ComponentType<{ className?: string }>> = {
  energized: Zap,
  balanced: Battery,
  tired: Meh,
  restless: Wind,
};

type ViewState = 'setup' | 'active' | 'reflection';

// Local ritual type for UI
interface LocalRitual {
  meditationType: string;
  duration: number;
  ambientSound: string;
  ambientSoundVolume: number;
  timestamp: string;
  displayName: string;
}

const meditationGuides = [
  {
    id: 'mindfulness' as MeditationType,
    steps: [
      { title: 'Find Your Posture', content: 'Sit comfortably with your back straight but not rigid. Rest your hands on your lap or knees.' },
      { title: 'Focus on Breath', content: 'Bring your attention to your natural breathing. Notice the sensation of air entering and leaving your body.' },
      { title: 'Observe Thoughts', content: 'When thoughts arise, acknowledge them without judgment and gently return your focus to your breath.' },
      { title: 'Expand Awareness', content: 'Gradually expand your awareness to include sounds, sensations, and the space around you.' },
    ],
  },
  {
    id: 'metta' as MeditationType,
    steps: [
      { title: 'Center Yourself', content: 'Sit comfortably and take a few deep breaths to settle into the present moment.' },
      { title: 'Self-Compassion', content: 'Begin by directing loving-kindness toward yourself. Silently repeat: "May I be happy, may I be healthy, may I be safe."' },
      { title: 'Extend to Others', content: 'Gradually extend these wishes to loved ones, acquaintances, and even those you find challenging.' },
      { title: 'Universal Love', content: 'Finally, extend loving-kindness to all beings everywhere, wishing them peace and happiness.' },
    ],
  },
  {
    id: 'visualization' as MeditationType,
    steps: [
      { title: 'Relax Your Body', content: 'Close your eyes and take several deep breaths, releasing tension with each exhale.' },
      { title: 'Create Your Scene', content: 'Visualize a peaceful place—a beach, forest, or mountain. Engage all your senses in this mental image.' },
      { title: 'Immerse Yourself', content: 'Notice the colors, sounds, smells, and feelings in your visualization. Make it as vivid as possible.' },
      { title: 'Absorb the Peace', content: 'Allow the tranquility of this place to fill you completely before gently returning to the present.' },
    ],
  },
  {
    id: 'ifs' as MeditationType,
    steps: [
      { title: 'Ground Yourself', content: 'Sit quietly and take a few moments to connect with your breath and body.' },
      { title: 'Notice Inner Parts', content: 'Become aware of different thoughts, feelings, or sensations. These are your "parts."' },
      { title: 'Approach with Curiosity', content: 'Choose one part to focus on. Ask it what it wants you to know, approaching it with compassion.' },
      { title: 'Integrate and Thank', content: 'Thank this part for sharing. Recognize that all parts are trying to help you in their own way.' },
    ],
  },
];

export default function PreMeditationPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: '/pre-meditation' });
  const fromQuiz = (searchParams as any)?.fromQuiz === 'true';

  const [viewState, setViewState] = useState<ViewState>('setup');
  const [selectedType, setSelectedType] = useState<string>('mindfulness');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [selectedAmbient, setSelectedAmbient] = useState('temple');
  const [ambientVolume, setAmbientVolume] = useState(50);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const [selectedMoods, setSelectedMoods] = useState<MoodState[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyState | null>(null);
  const [reflection, setReflection] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [showRitualModal, setShowRitualModal] = useState(false);

  const createJournalEntry = useCreateJournalEntry();
  const saveRitual = useSaveRitual();
  const { data: rituals } = useRituals();
  const deleteRitual = useDeleteRitual();

  const {
    timeRemaining,
    isPaused,
    progress,
    togglePause,
    seekTime,
    formatTime,
  } = useMeditationTimer({ 
    durationMinutes,
    onComplete: () => {
      if (audioElement) {
        const fadeOut = setInterval(() => {
          if (audioElement.volume > 0.05) {
            audioElement.volume = Math.max(0, audioElement.volume - 0.05);
          } else {
            audioElement.pause();
            audioElement.volume = ambientVolume / 100;
            clearInterval(fadeOut);
          }
        }, 100);
      }

      setTimeout(() => {
        setViewState('reflection');
      }, 1500);
    }
  });

  useEffect(() => {
    if (fromQuiz) {
      setSelectedType('mindfulness');
    }
  }, [fromQuiz]);

  // Map ambient music ID to file name
  const ambientFileMap: Record<string, string> = {
    'temple': 'Temple.mp3',
    'singing-bowl': 'Singing bowl.mp3',
    'rain': 'Rain.mp3',
    'ocean': 'Ocean.mp3',
    'soothing': 'Soothing.mp3',
    'birds': 'Birds.mp3',
    'crickets': 'Crickets.mp3',
  };

  useEffect(() => {
    const fileName = ambientFileMap[selectedAmbient] || 'Temple.mp3';
    const audio = new Audio(`/assets/${fileName}`);
    audio.loop = true;
    audio.volume = ambientVolume / 100;
    setAudioElement(audio);

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [selectedAmbient]);

  useEffect(() => {
    if (audioElement) {
      audioElement.volume = ambientVolume / 100;
    }
  }, [ambientVolume, audioElement]);

  useEffect(() => {
    if (viewState === 'active' && audioElement && !isPaused) {
      audioElement.play().catch(console.error);
      setIsAudioPlaying(true);
    } else if (audioElement) {
      audioElement.pause();
      setIsAudioPlaying(false);
    }
  }, [viewState, isPaused, audioElement]);

  const handleBeginMeditation = () => {
    setViewState('active');
  };

  const handleToggleMood = (mood: MoodState) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleSaveAndContinue = async () => {
    if (selectedMoods.length === 0 || !selectedEnergy) {
      toast.error('Please select at least one mood and an energy level');
      return;
    }

    const entry: JournalEntryInput = {
      meditationType: selectedType as MeditationType,
      duration: BigInt(durationMinutes),
      mood: selectedMoods,
      energy: selectedEnergy,
      reflection,
      isFavorite,
      timestamp: BigInt(Date.now() * 1_000_000),
    };

    try {
      await createJournalEntry.mutateAsync(entry);
      toast.success('Meditation session saved successfully');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleSaveRitual = async () => {
    const fileName = ambientFileMap[selectedAmbient] || 'Temple.mp3';
    const ritual: BackendRitual = {
      meditationType: selectedType as MeditationType,
      duration: BigInt(durationMinutes),
      ambientSound: fileName,
      ambientSoundVolume: BigInt(ambientVolume),
      timestamp: BigInt(Date.now() * 1_000_000),
    };

    try {
      await saveRitual.mutateAsync(ritual);
      toast.success('Ritual saved successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleSelectRitual = (ritual: LocalRitual) => {
    setSelectedType(ritual.meditationType);
    setDurationMinutes(ritual.duration);
    
    // Find the ambient ID from the file name
    const ambientId = Object.entries(ambientFileMap).find(([_, fileName]) => fileName === ritual.ambientSound)?.[0] || 'temple';
    setSelectedAmbient(ambientId);
    setAmbientVolume(ritual.ambientSoundVolume);
    setShowRitualModal(false);
    toast.success('Ritual loaded successfully');
  };

  const handleDeleteRitual = async (ritual: LocalRitual) => {
    // Convert back to backend format for deletion
    const backendRitual: BackendRitual = {
      meditationType: ritual.meditationType as MeditationType,
      duration: BigInt(ritual.duration),
      ambientSound: ritual.ambientSound,
      ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
      timestamp: BigInt(new Date(ritual.timestamp).getTime() * 1_000_000),
    };

    try {
      await deleteRitual.mutateAsync(backendRitual);
      toast.success('Ritual deleted successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleMoreDetails = () => {
    navigate({ 
      to: '/knowledge', 
      search: { category: selectedType }
    });
  };

  const currentGuide = meditationGuides.find((g) => g.id === selectedType);
  const guideSteps = currentGuide?.steps || [];

  // Convert backend rituals to local display format
  const displayRituals: LocalRitual[] = (rituals || []).map(r => ({
    meditationType: r.meditationType,
    duration: Number(r.duration),
    ambientSound: r.ambientSound,
    ambientSoundVolume: Number(r.ambientSoundVolume),
    timestamp: new Date(Number(r.timestamp) / 1_000_000).toISOString(),
    displayName: `${r.meditationType} - ${Number(r.duration)}min`,
  }));

  if (viewState === 'active') {
    return (
      <PageBackgroundShell>
        <StandardPageNav />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-3 sm:px-4 py-8">
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <Badge variant="outline" className="border-accent-cyan/50 text-accent-cyan mb-4">
                {selectedType}
              </Badge>
              <h2 className="text-2xl sm:text-3xl font-semibold text-accent-cyan">
                {!isPaused ? 'Breathe and Be Present' : 'Paused'}
              </h2>
            </div>

            {/* Circular Timer Container */}
            <div className="flex justify-center">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <div className="absolute inset-0 rounded-full overflow-hidden">
                  <MeditationTimerWaveFill
                    progress={progress}
                    timeText={formatTime(timeRemaining)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-center">
                <Button
                  onClick={togglePause}
                  size="lg"
                  className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark w-32"
                >
                  {!isPaused ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Resume
                    </>
                  )}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-accent-cyan shrink-0" />
                  <Slider
                    value={[ambientVolume]}
                    onValueChange={(value) => setAmbientVolume(value[0])}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {ambientVolume}%
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground shrink-0">Seek:</span>
                  <div className="flex gap-2 flex-1">
                    <Button
                      onClick={() => seekTime(timeRemaining - 30)}
                      variant="outline"
                      size="sm"
                      className="border-accent-cyan/50 hover:border-accent-cyan flex-1"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      -30s
                    </Button>
                    <Button
                      onClick={() => seekTime(timeRemaining + 30)}
                      variant="outline"
                      size="sm"
                      className="border-accent-cyan/50 hover:border-accent-cyan flex-1"
                    >
                      +30s
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  if (viewState === 'reflection') {
    return (
      <PageBackgroundShell>
        <StandardPageNav />

        <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
          <div className="max-w-3xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in mt-16">
            <div className="text-center space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-cyan-tinted">
                Reflection
              </h1>
              <p className="text-base sm:text-lg text-description-gray">
                Take a moment to reflect on your meditation experience
              </p>
            </div>

            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
              <CardContent className="pt-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    How are you feeling? (Select all that apply)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['calm', 'happy', 'neutral', 'anxious', 'sad'] as MoodState[]).map((mood) => {
                      const Icon = moodIconMap[mood];
                      const isSelected = selectedMoods.includes(mood);
                      return (
                        <TooltipProvider key={mood}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleToggleMood(mood)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                                    : 'border-border hover:border-accent-cyan/50 text-muted-foreground'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {mood.charAt(0).toUpperCase() + mood.slice(1)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Energy Level
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['energized', 'balanced', 'tired', 'restless'] as EnergyState[]).map((energy) => {
                      const Icon = energyIconMap[energy];
                      const isSelected = selectedEnergy === energy;
                      return (
                        <TooltipProvider key={energy}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => setSelectedEnergy(energy)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                                  isSelected
                                    ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                                    : 'border-border hover:border-accent-cyan/50 text-muted-foreground'
                                }`}
                              >
                                <Icon className="w-5 h-5" />
                                <span className="text-sm font-medium">
                                  {energy.charAt(0).toUpperCase() + energy.slice(1)}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {energy.charAt(0).toUpperCase() + energy.slice(1)}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-3">
                    Personal Notes (Optional)
                  </label>
                  <Textarea
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    placeholder="What did you notice during your meditation? Any insights or observations?"
                    className="min-h-[120px] bg-background/50 border-accent-cyan/30 focus:border-accent-cyan"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                      isFavorite
                        ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                        : 'border-border hover:border-accent-cyan/50 text-muted-foreground'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">Mark as Favorite</span>
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveRitual}
                    variant="outline"
                    disabled={saveRitual.isPending}
                    className="flex-1 border-accent-cyan/50 hover:border-accent-cyan"
                  >
                    {saveRitual.isPending ? 'Saving...' : 'Save Ritual'}
                  </Button>
                  <Button
                    onClick={handleSaveAndContinue}
                    disabled={createJournalEntry.isPending || selectedMoods.length === 0 || !selectedEnergy}
                    className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                  >
                    {createJournalEntry.isPending ? 'Saving...' : 'Save & Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  return (
    <PageBackgroundShell>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-4xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in mt-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Prepare Your Practice
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              Customize your meditation session
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          {rituals && rituals.length > 0 && (
            <div className="flex justify-center">
              <Button
                onClick={() => setShowRitualModal(true)}
                variant="outline"
                className="border-accent-cyan/50 hover:border-accent-cyan"
              >
                Load Saved Ritual
              </Button>
            </div>
          )}

          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
            <CardContent className="pt-6 space-y-8">
              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  Meditation Type
                </label>
                <MeditationCarousel
                  selectedMeditation={selectedType}
                  onSelectMeditation={setSelectedType}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  Duration: {durationMinutes} minutes
                </label>
                <Slider
                  value={[durationMinutes]}
                  onValueChange={(value) => setDurationMinutes(value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-4">
                  Ambient Sound
                </label>
                <AmbientMusicCarousel
                  selectedMusic={selectedAmbient}
                  onSelectMusic={setSelectedAmbient}
                  volume={ambientVolume}
                  onVolumeChange={setAmbientVolume}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/20">
            <CardContent className="pt-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-accent-cyan">Step-by-Step Guide</h3>
                <Button
                  onClick={handleMoreDetails}
                  variant="ghost"
                  size="sm"
                  className="text-accent-cyan hover:text-accent-cyan-tinted hover:bg-accent-cyan/10"
                >
                  <Info className="w-4 h-4 mr-2" />
                  More Details
                </Button>
              </div>
              <MeditationGuideStepper steps={guideSteps} />
            </CardContent>
          </Card>

          <div className="flex justify-center pt-4">
            <Button
              onClick={handleBeginMeditation}
              size="lg"
              className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Begin Meditation
            </Button>
          </div>
        </div>
      </main>

      <RitualSelectionModal
        open={showRitualModal}
        onClose={() => setShowRitualModal(false)}
        rituals={displayRituals}
        onStart={handleSelectRitual}
        onDelete={handleDeleteRitual}
        isDeleting={deleteRitual.isPending}
      />
    </PageBackgroundShell>
  );
}
