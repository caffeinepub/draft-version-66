import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, CheckCircle2, BookOpen, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearch } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import DurationRangeInput from '../components/DurationRangeInput';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { useMeditationTypes, useRecordSession, useCreateJournalEntry, useSaveRitual } from '../hooks/useQueries';
import { useProgressStats } from '../hooks/useQueries';
import { MeditationType, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { validateMeditationType } from '../utils/meditationType';
import { getAmbientSoundPath } from '../utils/ambientSounds';
import ActiveMeditationPage from './ActiveMeditationPage';

const detailedGuides: Record<string, { steps: Array<{ title: string; content: string }> }> = {
  mindfulness: {
    steps: [
      {
        title: 'Find Your Posture',
        content: 'Sit comfortably with your back straight but not rigid—imagine a string gently pulling the crown of your head toward the sky. You can sit on a chair with feet flat on the floor, or cross-legged on a cushion with your hips slightly elevated. Rest your hands gently on your lap or knees, palms facing down for grounding or up for receptivity. Let your shoulders relax away from your ears, and soften your jaw and facial muscles.',
      },
      {
        title: 'Begin with Breath Awareness',
        content: 'Close your eyes gently or maintain a soft downward gaze about three feet in front of you. Bring your attention to your natural breath without trying to control it. Notice the cool sensation of air entering your nostrils and the warm sensation as you exhale. Feel your chest and belly rise and fall with each breath. If it helps, you can count breaths: "one" on the inhale, "two" on the exhale, up to ten, then start again.',
      },
      {
        title: 'Anchor in the Present',
        content: 'When your mind wanders—and it will, this is completely normal—gently acknowledge the thought without judgment. You might silently note "thinking" or "planning" and then kindly return your focus to your breath. Each time you notice you\'ve wandered and come back is a successful moment of practice. The breath is your anchor to the present moment. Be patient and compassionate with yourself.',
      },
      {
        title: 'Transition Mindfully & Benefits',
        content: 'When ready to end, slowly deepen your breath for three cycles. Gently wiggle your fingers and toes, roll your shoulders, and when you feel ready, open your eyes softly. Take a moment to notice how you feel—any shifts in your body, mind, or emotions.\n\nBenefits: Regular mindfulness practice reduces stress and anxiety, improves focus and concentration, enhances emotional regulation, increases self-awareness, and promotes overall mental clarity and well-being.',
      },
    ],
  },
  metta: {
    steps: [
      {
        title: 'Settle into Comfort',
        content: 'Sit in a comfortable position with your spine upright yet relaxed. You might place your hands over your heart center or rest them gently on your lap. Allow your face to soften into a gentle, natural smile—even a subtle one can shift your internal state. Take a few deep breaths to settle in, releasing any tension you notice in your body. Create a sense of warmth and safety within yourself.',
      },
      {
        title: 'Begin with Yourself',
        content: 'Start by directing loving-kindness toward yourself—this is often the hardest but most important step. Visualize yourself as you are right now, or as a younger version of yourself. Silently repeat these phrases with genuine intention: "May I be happy. May I be healthy. May I be safe. May I live with ease." Let the words resonate in your heart. If resistance arises, acknowledge it with compassion and continue. You deserve this kindness.',
      },
      {
        title: 'Extend to Others',
        content: 'Bring to mind someone you care about deeply—a loved one, friend, or mentor. Visualize them clearly: their face, their presence, how they make you feel. Now direct the same loving phrases toward them with warmth and sincerity: "May you be happy. May you be healthy. May you be safe. May you live with ease." Feel the genuine wish for their well-being radiating from your heart. You can extend this practice to neutral people, difficult people, and eventually all beings.',
      },
      {
        title: 'Rest in Loving-Kindness & Benefits',
        content: 'Conclude by expanding your awareness to include all beings everywhere—near and far, known and unknown. Silently offer: "May all beings be happy. May all beings be healthy. May all beings be safe. May all beings live with ease." Rest in the warm, expansive feeling of universal compassion. Notice any shifts in your emotional state—perhaps more openness, warmth, or connection. When ready, gently open your eyes.\n\nBenefits: Metta practice cultivates compassion and empathy, reduces negative emotions like anger and resentment, increases positive emotions and life satisfaction, improves relationships and social connection, and enhances overall emotional resilience and well-being.',
      },
    ],
  },
  visualization: {
    steps: [
      {
        title: 'Create Your Sacred Space',
        content: 'Find a quiet, comfortable space where you won\'t be disturbed for the duration of your practice. You can sit upright or lie down—choose whatever position helps you relax most deeply while staying alert. Close your eyes and take several slow, deep breaths. With each exhale, release tension from your body. Imagine yourself in a safe, peaceful sanctuary—this could be a real place you know or an imagined haven. Make it vivid: notice the colors, textures, sounds, and scents.',
      },
      {
        title: 'Engage All Your Senses',
        content: 'Begin to build your visualization with rich sensory detail. If you\'re imagining a beach, feel the warm sand beneath you, hear the rhythmic waves, smell the salt air, see the endless blue horizon, taste the ocean breeze. The more senses you engage, the more powerful and immersive your visualization becomes. Let yourself fully inhabit this mental landscape. Your mind doesn\'t distinguish between vividly imagined experiences and real ones—use this to your advantage.',
      },
      {
        title: 'Set Your Intention',
        content: 'Now introduce your specific visualization goal. This might be healing (imagine golden light flowing to areas of pain or tension), confidence (see yourself succeeding at a challenge), peace (visualize stress dissolving like mist in sunlight), or creativity (picture ideas flowing freely). Whatever your intention, make it concrete and positive. See it, feel it, believe it. Spend several minutes dwelling in this visualization, allowing it to permeate your entire being.',
      },
      {
        title: 'Return Gently & Benefits',
        content: 'When you\'re ready to conclude, take a few deep breaths and slowly bring your awareness back to your physical body. Wiggle your fingers and toes, stretch gently, and open your eyes when it feels right. Carry the feelings and insights from your visualization into your day. You can return to this practice anytime you need its benefits.\n\nBenefits: Visualization enhances creativity and problem-solving, reduces anxiety and stress, improves performance and confidence, accelerates healing and recovery, and strengthens the mind-body connection for overall well-being.',
      },
    ],
  },
  ifs: {
    steps: [
      {
        title: 'Ground in Self-Energy',
        content: 'Sit comfortably and take several deep breaths to center yourself. In IFS (Internal Family Systems), we begin by accessing "Self"—your core essence characterized by curiosity, compassion, calm, and clarity. Notice any tension or emotion in your body without judgment. Imagine yourself as a compassionate observer, ready to meet different parts of yourself with openness and kindness. This is your foundation: a calm, centered presence from which to explore.',
      },
      {
        title: 'Identify a Part',
        content: 'Bring your attention to a feeling, thought pattern, or behavior that\'s been present lately—perhaps anxiety, self-criticism, procrastination, or anger. In IFS, these are "parts" of you, not your whole self. Ask internally: "What part of me is feeling this?" Notice where you sense it in your body. Give it space to be present. You might visualize it as a shape, color, age, or character. Approach it with genuine curiosity: "What do you want me to know?"',
      },
      {
        title: 'Listen with Compassion',
        content: 'From your centered Self, ask this part: "What are you trying to protect me from?" or "What do you need?" Listen without trying to fix or change anything. Parts often carry burdens from past experiences—they\'re trying to help, even when their strategies cause problems. Thank the part for its efforts to protect you. Acknowledge its positive intention. You might ask: "How old do you think I am?" Often, parts are stuck in the past, unaware that you\'ve grown and have more resources now.',
      },
      {
        title: 'Integrate and Heal & Benefits',
        content: 'Offer this part what it needs—perhaps reassurance, appreciation, or permission to rest. Let it know you (Self) are now capable of handling what it\'s been protecting you from. Imagine the part relaxing, updating its role, or even transforming. You might visualize it becoming lighter, younger, or more peaceful. Thank it for this dialogue. Slowly return your awareness to your breath and body, carrying this new understanding forward.\n\nBenefits: IFS meditation promotes self-compassion and inner harmony, resolves internal conflicts and self-sabotage, heals emotional wounds and trauma, increases self-awareness and emotional intelligence, and fosters integration and wholeness of the psyche.',
      },
    ],
  },
};

export const moodIconMap: Record<MoodState, any> = {
  [MoodState.calm]: Smile,
  [MoodState.anxious]: Frown,
  [MoodState.neutral]: Meh,
  [MoodState.happy]: Heart,
  [MoodState.sad]: Frown,
};

export const energyIconMap: Record<EnergyState, any> = {
  [EnergyState.tired]: Battery,
  [EnergyState.energized]: Zap,
  [EnergyState.balanced]: BatteryCharging,
  [EnergyState.restless]: Sparkles,
};

// Helper to format meditation type for display
const formatMeditationType = (type: string): string => {
  const typeMap: Record<string, string> = {
    mindfulness: 'Mindfulness',
    metta: 'Metta',
    visualization: 'Visualization',
    ifs: 'IFS (Internal Family Systems)',
  };
  return typeMap[type] || 'Mindfulness';
};

// Helper to get meditation guide title
const getMeditationGuideTitle = (type: string): string => {
  const titleMap: Record<string, string> = {
    mindfulness: 'Mindfulness Guide',
    metta: 'Metta Guide',
    visualization: 'Visualization Guide',
    ifs: 'IFS Guide',
  };
  return titleMap[type] || 'Meditation Guide';
};

export default function PreMeditationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as {
    type?: string;
    duration?: string;
    ambientSound?: string;
    ambientSoundVolume?: string;
    autoStart?: string;
  };

  // Parse meditation type from route search params
  const selectedType = validateMeditationType(search.type);

  // Check if this is an auto-start ritual
  const isAutoStartRitual = search.autoStart === 'true';
  const ritualDuration = search.duration ? parseInt(search.duration, 10) : null;
  const ritualAmbientSound = search.ambientSound || null;
  const ritualAmbientSoundVolume = search.ambientSoundVolume ? parseInt(search.ambientSoundVolume, 10) : null;

  const [phase, setPhase] = useState<'setup' | 'active' | 'reflection'>('setup');
  const [duration, setDuration] = useState(ritualDuration || 15);
  const [selectedMusicId, setSelectedMusicId] = useState(ritualAmbientSound || 'temple');
  const [volume, setVolume] = useState(ritualAmbientSoundVolume || 50);
  const [selectedMoods, setSelectedMoods] = useState<MoodState[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyState | null>(null);
  const [reflection, setReflection] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { data: meditationTypes } = useMeditationTypes();
  const { data: progressStats } = useProgressStats();
  const recordSession = useRecordSession();
  const createJournalEntry = useCreateJournalEntry();
  const saveRitual = useSaveRitual();

  const {
    timeRemaining,
    totalTime,
    isPaused,
    progress,
    togglePause,
    start,
    setDuration: setTimerDuration,
    seekTime,
    formatTime,
  } = useMeditationTimer({
    durationMinutes: duration,
    autoStart: false,
    onComplete: () => {
      // Fade out audio smoothly before stopping
      if (audioRef.current) {
        const fadeOutInterval = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
          } else {
            clearInterval(fadeOutInterval);
            stopAndResetAudio();
          }
        }, 100);
      }
      setPhase('reflection');
    },
  });

  // Helper function to stop and reset audio
  const stopAndResetAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  };

  // Auto-start ritual if flag is set
  useEffect(() => {
    if (isAutoStartRitual && phase === 'setup') {
      handleBeginMeditation();
    }
  }, [isAutoStartRitual]);

  // Update timer duration when duration changes
  useEffect(() => {
    if (phase === 'setup') {
      setTimerDuration(duration);
    }
  }, [duration, phase, setTimerDuration]);

  // Setup and cleanup audio
  useEffect(() => {
    if (phase === 'active') {
      const soundPath = getAmbientSoundPath(selectedMusicId);
      const audio = new Audio(soundPath);
      audio.loop = true;
      audio.volume = volume / 100;
      audio.play().catch((err) => console.error('Audio playback failed:', err));
      audioRef.current = audio;

      return () => {
        stopAndResetAudio();
      };
    }
  }, [phase, selectedMusicId]);

  // Update volume when slider changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Sync audio playback with timer pause state
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch((err) => console.error('Audio playback failed:', err));
      }
    }
  }, [isPaused]);

  const handleBeginMeditation = () => {
    setPhase('active');
    start();
  };

  const handleSaveRitual = async () => {
    try {
      await saveRitual.mutateAsync({
        meditationType: selectedType as MeditationType,
        duration: BigInt(duration),
        ambientSound: selectedMusicId,
        ambientSoundVolume: BigInt(volume),
        timestamp: BigInt(Date.now() * 1_000_000),
      });
      toast.success('Ritual soundscape saved successfully!');
    } catch (error: any) {
      const errorMessage = getCloudSyncErrorMessage(error);
      if (error.message?.includes('DuplicateSoundscape')) {
        toast.error('This soundscape already exists in your rituals.');
      } else if (error.message?.includes('RitualLimitExceeded')) {
        toast.error('You can only save up to 5 rituals. Please delete one first.');
      } else {
        toast.error(errorMessage || 'Failed to save ritual. Please try again.');
      }
    }
  };

  const handleSaveReflection = async () => {
    if (selectedMoods.length === 0 || !selectedEnergy) {
      toast.error('Please select at least one mood and energy level');
      return;
    }

    try {
      // Record session
      const currentStreak = progressStats?.currentStreak ? Number(progressStats.currentStreak) : 0;
      const monthlyMinutes = progressStats?.monthlyMinutes ? Number(progressStats.monthlyMinutes) : 0;

      await recordSession.mutateAsync({
        session: {
          minutes: BigInt(duration),
          timestamp: BigInt(Date.now() * 1_000_000),
        },
        monthlyStats: BigInt(monthlyMinutes + duration),
        currentStreak: BigInt(currentStreak + 1),
      });

      // Create journal entry
      await createJournalEntry.mutateAsync({
        meditationType: selectedType as MeditationType,
        duration: BigInt(duration),
        mood: selectedMoods,
        energy: selectedEnergy,
        reflection,
        timestamp: BigInt(Date.now() * 1_000_000),
        isFavorite,
      });

      toast.success('Session saved successfully!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      const errorMessage = getCloudSyncErrorMessage(error);
      toast.error(errorMessage || 'Failed to save session. Please try again.');
    }
  };

  const handleMoodToggle = (mood: MoodState) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleBackNavigation = () => {
    stopAndResetAudio();
    navigate({ to: '/dashboard' });
  };

  // Active meditation phase — delegate to ActiveMeditationPage component
  if (phase === 'active') {
    return (
      <ActiveMeditationPage
        timeRemaining={timeRemaining}
        totalTime={totalTime}
        isPaused={isPaused}
        progress={progress}
        volume={volume}
        ambientSoundId={selectedMusicId}
        onTogglePause={togglePause}
        onSeekTime={seekTime}
        onVolumeChange={setVolume}
        onBack={handleBackNavigation}
        formatTime={formatTime}
      />
    );
  }

  // Setup phase
  if (phase === 'setup') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.5}>
        <StandardPageNav />
        <div className="min-h-screen flex flex-col items-center justify-start pt-20 pb-12 px-4">
          <div className="w-full max-w-2xl space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                {formatMeditationType(selectedType)}
              </h1>
              <p className="text-lg text-muted-foreground">
                Prepare your practice
              </p>
            </div>

            {/* Unified Controls Container */}
            <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-xl">
              <CardContent className="p-6 space-y-6">
                {/* Duration Input */}
                <DurationRangeInput
                  value={duration}
                  onChange={setDuration}
                  min={5}
                  max={60}
                />

                {/* Ambient Sound Picker */}
                <div className="space-y-4">
                  <Label className="text-lg font-medium text-foreground">
                    Ambient Sound
                  </Label>
                  <AmbientMusicCarousel
                    selectedMusic={selectedMusicId}
                    onSelectMusic={setSelectedMusicId}
                    volume={volume}
                    onVolumeChange={setVolume}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <Button
                    onClick={handleBeginMeditation}
                    className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-background font-semibold py-2.5"
                  >
                    Begin Meditation
                  </Button>
                  <Button
                    onClick={handleSaveRitual}
                    variant="outline"
                    disabled={saveRitual.isPending}
                    className="flex-shrink-0 border-accent-cyan/50 text-accent-cyan hover:bg-accent-cyan/10 py-2.5"
                  >
                    {saveRitual.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span className="ml-2 hidden sm:inline">Save Ritual</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Meditation Guide Container */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  {getMeditationGuideTitle(selectedType)}
                </h2>
              </div>
              <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-xl">
                <CardContent className="p-6">
                  <MeditationGuideStepper
                    steps={detailedGuides[selectedType]?.steps || detailedGuides.mindfulness.steps}
                  />
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="ghost"
                      className="text-accent-cyan hover:text-accent-cyan/80 hover:bg-accent-cyan/10"
                      onClick={() =>
                        navigate({
                          to: '/knowledge',
                          search: { category: selectedType, scrollToContent: 'true' },
                        })
                      }
                    >
                      <BookOpen className="h-4 w-4 mr-2" />
                      More details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </PageBackgroundShell>
    );
  }

  // Reflection phase
  return (
    <PageBackgroundShell variant="premed" intensity={0.3}>
      <StandardPageNav showBackButton={false} />
      <div className="min-h-screen flex flex-col items-center justify-start pt-20 pb-12 px-4">
        <div className="w-full max-w-2xl space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="h-8 w-8 text-accent-cyan" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Session Complete
            </h1>
            <p className="text-lg text-muted-foreground">
              How was your {formatMeditationType(selectedType)} session?
            </p>
          </div>

          {/* Mood Selection */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold text-foreground block">
                How are you feeling?
              </Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                {Object.values(MoodState).map((mood) => {
                  const IconComponent = moodIconMap[mood];
                  const isSelected = selectedMoods.includes(mood);
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodToggle(mood)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                          : 'border-border/50 hover:border-accent-cyan/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs capitalize">{mood}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Energy Selection */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold text-foreground block">
                Energy level
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.values(EnergyState).map((energy) => {
                  const IconComponent = energyIconMap[energy];
                  const isSelected = selectedEnergy === energy;
                  return (
                    <button
                      key={energy}
                      onClick={() => setSelectedEnergy(energy)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-accent-cyan bg-accent-cyan/10 text-accent-cyan'
                          : 'border-border/50 hover:border-accent-cyan/50 text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <IconComponent className="h-6 w-6" />
                      <span className="text-xs capitalize">{energy}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Reflection Notes */}
          <Card className="bg-card/60 backdrop-blur-sm border-border/50 shadow-xl">
            <CardContent className="p-6 space-y-4">
              <Label className="text-lg font-semibold text-foreground block">
                Reflection (optional)
              </Label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="How did your session feel? Any insights or observations..."
                className="min-h-[100px] bg-background/50 border-border/50 resize-none"
              />
            </CardContent>
          </Card>

          {/* Favorite Toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="favorite"
              checked={isFavorite}
              onCheckedChange={(checked) => setIsFavorite(checked === true)}
              className="border-accent-cyan/50 data-[state=checked]:bg-accent-cyan data-[state=checked]:border-accent-cyan"
            />
            <Label
              htmlFor="favorite"
              className="text-foreground cursor-pointer flex items-center gap-2"
            >
              <Heart className="h-4 w-4 text-accent-cyan" />
              Mark as favorite session
            </Label>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveReflection}
            disabled={recordSession.isPending || createJournalEntry.isPending}
            className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-background font-semibold py-3"
          >
            {recordSession.isPending || createJournalEntry.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save & Continue'
            )}
          </Button>
        </div>
      </div>
    </PageBackgroundShell>
  );
}
