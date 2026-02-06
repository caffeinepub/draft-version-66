import { useState, useEffect } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Play, Pause, Volume2, Heart, Info, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import LotusCanvas from '../components/LotusCanvas';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import MeditationTimerRing from '../components/MeditationTimerRing';
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
type ReflectionStep = 'mood' | 'energy' | 'note';

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
      { 
        title: 'Find Your Posture', 
        content: 'Sit comfortably with your back straight but not rigid, allowing your spine to support itself naturally. Rest your hands gently on your lap or knees, palms facing up or down—whichever feels most natural. Let your shoulders relax away from your ears. If sitting on a chair, place your feet flat on the floor. If on a cushion, cross your legs comfortably. The goal is to be alert yet relaxed, stable yet at ease. Take a moment to adjust until you find a position you can maintain without strain.' 
      },
      { 
        title: 'Focus on Breath', 
        content: 'Bring your full attention to your natural breathing without trying to control it. Notice the cool air entering your nostrils and the warm air leaving. Feel the gentle rise and fall of your chest and belly with each breath. You might focus on the sensation at the tip of your nose, the expansion of your ribcage, or the movement of your abdomen. Choose one anchor point and stay with it. Let your breath be your home base, the place you return to again and again throughout this practice.' 
      },
      { 
        title: 'Observe Thoughts', 
        content: 'When thoughts arise—and they will—acknowledge them without judgment, criticism, or engagement. Imagine them as clouds passing through the sky of your mind, or leaves floating down a stream. You don\'t need to push them away or follow them. Simply notice: "thinking is happening," then gently guide your attention back to your breath. This return is the practice itself. Each time you notice you\'ve wandered and come back, you\'re strengthening your mindfulness muscle. Be patient and kind with yourself; this is natural and part of the process.' 
      },
      { 
        title: 'Expand Awareness', 
        content: 'Gradually widen your field of attention beyond the breath to include the full spectrum of your present-moment experience. Notice sounds near and far without labeling them. Feel sensations in your body—tingling, warmth, pressure, or stillness. Become aware of the space around you and the quality of light. Let your awareness be spacious and receptive, like the sky that holds all weather. Rest in this open, choiceless awareness, simply being present with whatever arises, moment by moment, without preference or resistance.' 
      },
    ],
  },
  {
    id: 'metta' as MeditationType,
    steps: [
      { 
        title: 'Center Yourself', 
        content: 'Sit comfortably in a quiet space where you won\'t be disturbed. Close your eyes gently or soften your gaze downward. Take several slow, deep breaths, feeling your body settle into stillness. Let go of any tension you\'re holding in your shoulders, jaw, or belly. Bring your attention to the area around your heart center. You might place a hand over your heart to help you connect with this space of warmth and care. Allow yourself to arrive fully in this moment, setting aside concerns about the past or future.' 
      },
      { 
        title: 'Self-Compassion', 
        content: 'Begin by directing loving-kindness toward yourself. This can feel challenging, but remember that you deserve kindness just as much as anyone else. Silently repeat these phrases, letting them resonate in your heart: "May I be happy. May I be healthy. May I be safe. May I live with ease." Feel the intention behind these words. If resistance arises, acknowledge it with gentleness. You might visualize yourself as a young child or imagine being held in warm, loving light. Take your time with each phrase, allowing the wishes to sink in deeply.' 
      },
      { 
        title: 'Extend to Others', 
        content: 'Now gradually extend these same wishes outward. First, bring to mind someone you love deeply—a dear friend, family member, or mentor. Picture them clearly and offer them the same phrases: "May you be happy. May you be healthy. May you be safe. May you live with ease." Next, think of a neutral person—someone you see regularly but don\'t know well, like a neighbor or cashier. Extend the same wishes to them. Finally, if you feel ready, bring to mind someone you find challenging or difficult. This doesn\'t mean condoning harmful behavior, but recognizing their humanity and their own wish to be free from suffering.' 
      },
      { 
        title: 'Universal Love', 
        content: 'Expand your circle of compassion to include all beings everywhere, without exception. Imagine your loving-kindness radiating outward like ripples on a pond, reaching your community, your city, your country, and ultimately the entire world. Include all people, all animals, all forms of life. Silently offer: "May all beings be happy. May all beings be healthy. May all beings be safe. May all beings live with ease." Feel the boundless nature of this love—it costs nothing to give and grows stronger the more you share it. Rest in this feeling of universal connection and goodwill before gently returning to your day.' 
      },
    ],
  },
  {
    id: 'visualization' as MeditationType,
    steps: [
      { 
        title: 'Relax Your Body', 
        content: 'Close your eyes and begin by taking several deep, cleansing breaths. Breathe in slowly through your nose, filling your lungs completely, then exhale fully through your mouth, releasing any tension or stress. With each exhale, consciously let go of tightness in your body. Start at the top of your head and progressively relax downward: soften your forehead, release your jaw, drop your shoulders, unclench your hands, relax your belly, and let your legs feel heavy and supported. Take your time with this process. Feel yourself sinking deeper into relaxation with each breath, becoming more receptive and open to the visualization ahead.' 
      },
      { 
        title: 'Create Your Scene', 
        content: 'Now begin to visualize a peaceful place—somewhere that feels safe, beautiful, and calming to you. This might be a sun-warmed beach with gentle waves, a quiet forest with dappled sunlight filtering through leaves, a serene mountain meadow, or any place that brings you peace. It can be somewhere you\'ve been before or a place entirely from your imagination. Start building this scene in your mind\'s eye with as much detail as possible. What do you see? Notice the colors, the light, the landscape. What do you hear? Perhaps birds singing, water flowing, or wind rustling through trees. What do you smell? Fresh pine, salt air, blooming flowers? Engage all your senses to make this place vivid and real.' 
      },
      { 
        title: 'Immerse Yourself', 
        content: 'Step fully into your visualization. Feel yourself actually present in this peaceful place. Notice the temperature of the air on your skin—is it warm and sunny or cool and refreshing? Feel the ground beneath your feet—soft grass, warm sand, smooth stone? Look around slowly, taking in every detail. Watch how the light plays across the landscape. Listen to the symphony of natural sounds. Breathe in the fresh, clean air. Perhaps you sit down, lie back, or walk slowly through this space. Let yourself be completely absorbed in the experience. This is your sanctuary, a place of perfect peace and safety that exists within you and is always accessible.' 
      },
      { 
        title: 'Absorb the Peace', 
        content: 'Allow the deep tranquility of this place to fill you completely. Feel it soaking into every cell of your body, washing away stress, worry, and tension. Let the peace settle into your bones, your muscles, your organs. Breathe it in with each inhale. Notice how calm and centered you feel here. Know that you can return to this place anytime you need refuge or renewal—it\'s always here, waiting for you. When you\'re ready, take a few more deep breaths, wiggle your fingers and toes, and gently open your eyes. Carry this sense of peace with you as you return to your day, knowing you can access it whenever you need it.' 
      },
    ],
  },
  {
    id: 'ifs' as MeditationType,
    steps: [
      { 
        title: 'Ground Yourself', 
        content: 'Sit in a comfortable position and take a few moments to arrive fully in your body. Close your eyes or soften your gaze. Begin by taking several slow, deep breaths, feeling your belly rise and fall. Notice the sensation of your body making contact with the chair or cushion beneath you. Feel your feet on the floor. Scan through your body from head to toe, simply noticing any sensations without trying to change them. This grounding practice helps you connect with your core Self—the calm, compassionate center from which you can observe your inner world with curiosity and care.' 
      },
      { 
        title: 'Notice Inner Parts', 
        content: 'Now turn your attention inward and become aware of the different thoughts, feelings, sensations, or impulses present within you. In Internal Family Systems, we call these "parts"—distinct aspects of your psyche, each with its own perspective, feelings, and intentions. You might notice a worried part, an angry part, a sad part, a critical part, or a protective part. Perhaps you feel tension in your chest, a knot in your stomach, or a voice in your head. Simply observe what\'s present without judgment. These parts are not problems to be fixed; they\'re aspects of you trying to help in the best way they know how. Take a moment to acknowledge each part you notice, recognizing that they all belong to your inner system.' 
      },
      { 
        title: 'Approach with Curiosity', 
        content: 'Choose one part to focus on—perhaps the one that feels most prominent or the one you\'re most curious about. Approach this part with genuine interest and compassion, as you might approach a child who\'s upset. Ask it gently: "What do you want me to know? What are you trying to protect me from? What do you need?" Listen for a response, which might come as words, images, feelings, or sensations. Don\'t rush or force anything. If the part doesn\'t want to communicate yet, that\'s okay—simply let it know you\'re here and willing to listen whenever it\'s ready. Notice how you feel toward this part. If you feel curious, compassionate, calm, or connected, you\'re in Self. If you feel critical, afraid, or frustrated, another part may have stepped in—gently ask it to step back so you can listen from your core Self.' 
      },
      { 
        title: 'Integrate and Thank', 
        content: 'Thank this part for sharing with you and for all the ways it has tried to help you, even if its methods have sometimes been painful or problematic. Recognize that every part, no matter how troublesome it may seem, has a positive intention—it\'s trying to protect you, keep you safe, or help you cope. Let this part know that you see it, you hear it, and you appreciate its efforts. Ask if there\'s anything it needs from you right now. You might offer it reassurance, understanding, or simply your presence. As you close this practice, acknowledge all your parts and the complex inner system they form. Know that you can return to this practice anytime to build a stronger relationship with your parts, leading to greater inner harmony, self-understanding, and healing.' 
      },
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

  const [reflectionStep, setReflectionStep] = useState<ReflectionStep>('mood');
  const [selectedMoods, setSelectedMoods] = useState<MoodState[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyState | null>(null);
  const [reflection, setReflection] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const [showRitualModal, setShowRitualModal] = useState(false);
  const [showGuideDetails, setShowGuideDetails] = useState(false);

  const createJournalEntry = useCreateJournalEntry();
  const saveRitual = useSaveRitual();
  const { data: rituals } = useRituals();
  const deleteRitual = useDeleteRitual();

  const {
    timeRemaining,
    totalTime,
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
        setReflectionStep('mood');
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

  const handleNextReflectionStep = () => {
    if (reflectionStep === 'mood') {
      if (selectedMoods.length === 0) {
        toast.error('Please select at least one mood');
        return;
      }
      setReflectionStep('energy');
    } else if (reflectionStep === 'energy') {
      if (!selectedEnergy) {
        toast.error('Please select an energy level');
        return;
      }
      setReflectionStep('note');
    }
  };

  const handlePreviousReflectionStep = () => {
    if (reflectionStep === 'energy') {
      setReflectionStep('mood');
    } else if (reflectionStep === 'note') {
      setReflectionStep('energy');
    }
  };

  const handleSaveAndContinue = async () => {
    const entry: JournalEntryInput = {
      meditationType: selectedType as MeditationType,
      duration: BigInt(durationMinutes),
      mood: selectedMoods,
      energy: selectedEnergy!,
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
  };

  const handleDeleteRitual = async (ritual: LocalRitual) => {
    const backendRitual: BackendRitual = {
      meditationType: ritual.meditationType as MeditationType,
      duration: BigInt(ritual.duration),
      ambientSound: ritual.ambientSound,
      ambientSoundVolume: BigInt(ritual.ambientSoundVolume),
      timestamp: BigInt(0),
    };

    try {
      await deleteRitual.mutateAsync(backendRitual);
      toast.success('Ritual deleted successfully');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  // Convert backend rituals to local format
  const localRituals: LocalRitual[] = (rituals || []).map((ritual) => ({
    meditationType: ritual.meditationType,
    duration: Number(ritual.duration),
    ambientSound: ritual.ambientSound,
    ambientSoundVolume: Number(ritual.ambientSoundVolume),
    timestamp: ritual.timestamp.toString(),
    displayName: `${ritual.meditationType} - ${Number(ritual.duration)} min`,
  }));

  const currentGuide = meditationGuides.find((g) => g.id === selectedType);

  const meditationTypeLabels: Record<string, string> = {
    mindfulness: 'Mindfulness',
    metta: 'Metta',
    visualization: 'Visualization',
    ifs: 'IFS',
  };

  // Setup View
  if (viewState === 'setup') {
    return (
      <PageBackgroundShell>
        <StandardPageNav />
        <LotusCanvas variant="premed" intensity={0.6} />

        <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12">
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

            {/* Meditation Type Selection - Simple Buttons */}
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Select Meditation Type</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {['mindfulness', 'metta', 'visualization', 'ifs'].map((type) => (
                    <Button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      variant={selectedType === type ? 'default' : 'outline'}
                      className={`h-auto py-4 flex flex-col items-center gap-2 ${
                        selectedType === type
                          ? 'bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark border-accent-cyan'
                          : 'border-accent-cyan/50 hover:border-accent-cyan'
                      }`}
                    >
                      <span className="text-base font-medium">{meditationTypeLabels[type]}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Step Guide with More Details Button */}
            {currentGuide && (
              <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-foreground">Step-by-Step Guide</h3>
                    <Button
                      onClick={() => setShowGuideDetails(true)}
                      variant="outline"
                      size="sm"
                      className="border-accent-cyan/50 hover:border-accent-cyan"
                    >
                      <Info className="w-4 h-4 mr-2" />
                      More Details
                    </Button>
                  </div>
                  <MeditationGuideStepper steps={currentGuide.steps} />
                </CardContent>
              </Card>
            )}

            {/* Duration Selection */}
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Duration</h3>
                  <Badge variant="outline" className="text-lg px-4 py-1 border-accent-cyan/50 text-accent-cyan">
                    {durationMinutes} min
                  </Badge>
                </div>
                <Slider
                  value={[durationMinutes]}
                  onValueChange={(value) => setDurationMinutes(value[0])}
                  min={5}
                  max={60}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>5 min</span>
                  <span>60 min</span>
                </div>
              </CardContent>
            </Card>

            {/* Ambient Sound Selection */}
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-semibold text-foreground">Ambient Sound</h3>
                <AmbientMusicCarousel
                  selectedMusic={selectedAmbient}
                  onSelectMusic={setSelectedAmbient}
                  volume={ambientVolume}
                  onVolumeChange={setAmbientVolume}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleBeginMeditation}
                size="lg"
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold text-lg px-8 py-6"
              >
                <Play className="w-5 h-5 mr-2" />
                Begin Meditation
              </Button>
              <Button
                onClick={handleSaveRitual}
                variant="outline"
                size="lg"
                className="border-accent-cyan/50 hover:border-accent-cyan text-lg px-8 py-6"
                disabled={saveRitual.isPending}
              >
                {saveRitual.isPending ? 'Saving...' : 'Save as Ritual'}
              </Button>
              <Button
                onClick={() => setShowRitualModal(true)}
                variant="outline"
                size="lg"
                className="border-accent-cyan/50 hover:border-accent-cyan text-lg px-8 py-6"
              >
                Load Ritual
              </Button>
            </div>
          </div>
        </main>

        {/* More Details Dialog */}
        <Dialog open={showGuideDetails} onOpenChange={setShowGuideDetails}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-accent-cyan">
                {meditationTypeLabels[selectedType]} - Detailed Guide
              </DialogTitle>
              <DialogDescription>
                Follow these steps for a complete meditation practice
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {currentGuide?.steps.map((step, index) => (
                <div key={index} className="space-y-2">
                  <h4 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-cyan/20 text-accent-cyan text-sm font-bold">
                      {index + 1}
                    </span>
                    {step.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed pl-10">
                    {step.content}
                  </p>
                </div>
              ))}
            </div>
            <DialogClose asChild>
              <Button variant="outline" className="w-full">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>

        {/* Ritual Selection Modal */}
        <RitualSelectionModal
          open={showRitualModal}
          onClose={() => setShowRitualModal(false)}
          rituals={localRituals}
          onStart={handleSelectRitual}
          onDelete={handleDeleteRitual}
          isDeleting={deleteRitual.isPending}
        />
      </PageBackgroundShell>
    );
  }

  // Active Meditation View
  if (viewState === 'active') {
    return (
      <PageBackgroundShell>
        <StandardPageNav />
        <LotusCanvas variant="premed" intensity={0.3} />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <div className="w-full max-w-2xl space-y-8 animate-fade-in">
            {/* Circular Timer */}
            <div className="flex justify-center">
              <div className="relative">
                <MeditationTimerRing
                  progress={progress}
                  size={300}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl sm:text-6xl font-bold text-accent-cyan-tinted">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {meditationTypeLabels[selectedType]}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <Button
                  onClick={togglePause}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-16 h-16 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10"
                >
                  {isPaused ? (
                    <Play className="w-8 h-8 text-accent-cyan" />
                  ) : (
                    <Pause className="w-8 h-8 text-accent-cyan" />
                  )}
                </Button>
              </div>

              {/* Volume Control */}
              <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-accent-cyan flex-shrink-0" />
                    <Slider
                      value={[ambientVolume]}
                      onValueChange={(value) => setAmbientVolume(value[0])}
                      min={0}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {ambientVolume}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Time Seek Slider */}
              <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
                <CardContent className="p-4 space-y-2">
                  <Slider
                    value={[timeRemaining]}
                    onValueChange={(value) => seekTime(value[0])}
                    min={0}
                    max={totalTime}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0:00</span>
                    <span>{formatTime(totalTime)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // Reflection View - Step-based
  return (
    <PageBackgroundShell>
      <StandardPageNav />
      <LotusCanvas variant="premed" intensity={0.5} />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto w-full space-y-6 sm:space-y-8 animate-fade-in mt-16">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle">
              Reflect on Your Practice
            </h1>
            <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
              {reflectionStep === 'mood' && 'How are you feeling?'}
              {reflectionStep === 'energy' && 'What is your energy level?'}
              {reflectionStep === 'note' && 'Capture your thoughts (optional)'}
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          {/* Step Indicator */}
          <div className="flex justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${reflectionStep === 'mood' ? 'bg-accent-cyan' : 'bg-accent-cyan/30'}`} />
            <div className={`w-3 h-3 rounded-full ${reflectionStep === 'energy' ? 'bg-accent-cyan' : 'bg-accent-cyan/30'}`} />
            <div className={`w-3 h-3 rounded-full ${reflectionStep === 'note' ? 'bg-accent-cyan' : 'bg-accent-cyan/30'}`} />
          </div>

          {/* Step 1: Mood Selection */}
          {reflectionStep === 'mood' && (
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-foreground text-center">Select Your Mood(s)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(['calm', 'happy', 'neutral', 'anxious', 'sad'] as MoodState[]).map((mood) => {
                    const Icon = moodIconMap[mood];
                    const isSelected = selectedMoods.includes(mood);
                    return (
                      <button
                        key={mood}
                        onClick={() => handleToggleMood(mood)}
                        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`w-10 h-10 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-accent-cyan' : 'text-foreground'}`}>
                          {mood.charAt(0).toUpperCase() + mood.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleNextReflectionStep}
                    className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Energy Selection */}
          {reflectionStep === 'energy' && (
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-6">
                <h3 className="text-xl font-semibold text-foreground text-center">Select Your Energy Level</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {(['energized', 'balanced', 'tired', 'restless'] as EnergyState[]).map((energy) => {
                    const Icon = energyIconMap[energy];
                    const isSelected = selectedEnergy === energy;
                    return (
                      <button
                        key={energy}
                        onClick={() => setSelectedEnergy(energy)}
                        className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`w-10 h-10 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                        <span className={`text-sm font-medium ${isSelected ? 'text-accent-cyan' : 'text-foreground'}`}>
                          {energy.charAt(0).toUpperCase() + energy.slice(1)}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between">
                  <Button
                    onClick={handlePreviousReflectionStep}
                    variant="outline"
                    className="border-accent-cyan/50 hover:border-accent-cyan"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleNextReflectionStep}
                    className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Note, Favorite, and Save */}
          {reflectionStep === 'note' && (
            <Card className="bg-card/70 backdrop-blur-sm border-accent-cyan/30">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-foreground">Personal Notes (Optional)</h3>
                  <Textarea
                    placeholder="Write your thoughts, insights, or observations..."
                    value={reflection}
                    onChange={(e) => setReflection(e.target.value)}
                    rows={6}
                    className="bg-background/50 border-accent-cyan/30 focus:border-accent-cyan resize-none"
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-t border-accent-cyan/20">
                  <span className="text-sm font-medium text-foreground">Mark as Favorite</span>
                  <Button
                    onClick={() => setIsFavorite(!isFavorite)}
                    variant="ghost"
                    size="icon"
                    className={`rounded-full ${isFavorite ? 'text-red-500' : 'text-muted-foreground'}`}
                  >
                    <HeartIcon className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>

                <div className="flex justify-between">
                  <Button
                    onClick={handlePreviousReflectionStep}
                    variant="outline"
                    className="border-accent-cyan/50 hover:border-accent-cyan"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={handleSaveAndContinue}
                    disabled={createJournalEntry.isPending}
                    className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark"
                  >
                    {createJournalEntry.isPending ? 'Saving...' : 'Save & Continue'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </PageBackgroundShell>
  );
}
