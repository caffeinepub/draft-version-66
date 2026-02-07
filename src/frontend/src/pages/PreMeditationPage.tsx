import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, CheckCircle2, BookOpen, Save, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearch } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import MeditationWaveFillIndicator from '../components/MeditationWaveFillIndicator';
import DurationRangeInput from '../components/DurationRangeInput';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { useMeditationTypes, useRecordSession, useCreateJournalEntry, useSaveRitual } from '../hooks/useQueries';
import { useProgressStats } from '../hooks/useQueries';
import { MeditationType, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { validateMeditationType } from '../utils/meditationType';
import { getAmbientSoundPath } from '../utils/ambientSounds';
import { ambientAudioManager } from '../utils/ambientAudioManager';

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
      // Fade out and stop audio when session completes
      ambientAudioManager.fadeOut(1000, () => {
        setPhase('reflection');
      });
    },
  });

  // Auto-start if this is a ritual
  useEffect(() => {
    if (isAutoStartRitual && phase === 'setup') {
      handleStartMeditation();
    }
  }, [isAutoStartRitual]);

  // Cleanup: stop audio when component unmounts
  useEffect(() => {
    return () => {
      ambientAudioManager.stop();
    };
  }, []);

  // Update volume when it changes during active phase
  useEffect(() => {
    if (phase === 'active') {
      ambientAudioManager.setVolume(volume / 100);
    }
  }, [volume, phase]);

  const handleStartMeditation = () => {
    setPhase('active');
    start();

    const soundPath = getAmbientSoundPath(selectedMusicId);
    ambientAudioManager.play(soundPath, selectedMusicId, volume / 100, true);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    ambientAudioManager.setVolume(newVolume / 100);
  };

  const handleBackNavigation = () => {
    // Stop audio before navigating back
    ambientAudioManager.stop();
  };

  const handleSaveReflection = async () => {
    if (selectedMoods.length === 0 || !selectedEnergy) {
      toast.error('Please select at least one mood and an energy level');
      return;
    }

    try {
      const timestamp = BigInt(Date.now() * 1_000_000);
      const sessionMinutes = BigInt(duration);

      // Record session
      const currentStreak = progressStats?.currentStreak ? Number(progressStats.currentStreak) : 0;
      const monthlyMinutes = progressStats?.monthlyMinutes ? Number(progressStats.monthlyMinutes) : 0;

      await recordSession.mutateAsync({
        session: { minutes: sessionMinutes, timestamp },
        monthlyStats: BigInt(monthlyMinutes + duration),
        currentStreak: BigInt(currentStreak + 1),
      });

      // Create journal entry
      await createJournalEntry.mutateAsync({
        meditationType: selectedType,
        duration: sessionMinutes,
        mood: selectedMoods,
        energy: selectedEnergy,
        reflection,
        timestamp,
        isFavorite,
      });

      toast.success('Session saved successfully!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleSaveRitual = async () => {
    try {
      const ritualData = {
        meditationType: selectedType,
        duration: BigInt(duration),
        ambientSound: selectedMusicId,
        ambientSoundVolume: BigInt(volume),
        timestamp: BigInt(Date.now() * 1_000_000),
      };

      await saveRitual.mutateAsync(ritualData);
      toast.success('Ritual soundscape saved!');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const toggleMood = (mood: MoodState) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const guide = detailedGuides[selectedType] || detailedGuides.mindfulness;

  if (phase === 'active') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.15}>
        <StandardPageNav onBack={handleBackNavigation} />
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl mx-auto space-y-12 animate-fade-in">
            <div className="flex flex-col items-center space-y-8">
              <div className="relative w-80 h-80 sm:w-96 sm:h-96">
                <MeditationWaveFillIndicator progress={progress} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="text-6xl sm:text-7xl font-bold text-accent-cyan-tinted animate-breathe-gentle tabular-nums">
                      {(timeRemaining / 60).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-2">
                      {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Button
                  onClick={togglePause}
                  size="lg"
                  className="bg-accent-cyan hover:bg-accent-cyan-tinted text-white rounded-full w-16 h-16 p-0"
                >
                  {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
                </Button>
              </div>

              <div className="w-full max-w-md space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Volume</Label>
                  <Slider
                    value={[volume]}
                    onValueChange={(vals) => handleVolumeChange(vals[0])}
                    min={0}
                    max={100}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Seek Time</Label>
                  <Slider
                    value={[timeRemaining]}
                    onValueChange={(vals) => seekTime(vals[0])}
                    min={0}
                    max={totalTime}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  if (phase === 'reflection') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.2}>
        <StandardPageNav />
        <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <CheckCircle2 className="w-16 h-16 mx-auto text-accent-cyan animate-glow-pulse" />
              <h2 className="text-3xl font-bold">Session Complete</h2>
              <p className="text-muted-foreground">
                Take a moment to reflect on your experience
              </p>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 space-y-6 shadow-lg border border-border/50">
              <div className="space-y-4">
                <Label className="text-lg font-semibold">How are you feeling?</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(moodIconMap).map(([mood, Icon]) => {
                    const isSelected = selectedMoods.includes(mood as MoodState);
                    return (
                      <button
                        key={mood}
                        onClick={() => toggleMood(mood as MoodState)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10 shadow-glow'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`w-8 h-8 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                        <span className="text-sm capitalize">{mood}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold">Energy Level</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Object.entries(energyIconMap).map(([energy, Icon]) => {
                    const isSelected = selectedEnergy === energy;
                    return (
                      <button
                        key={energy}
                        onClick={() => setSelectedEnergy(energy as EnergyState)}
                        className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10 shadow-glow'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`w-8 h-8 ${isSelected ? 'text-accent-cyan' : 'text-muted-foreground'}`} />
                        <span className="text-sm capitalize">{energy}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="reflection" className="text-lg font-semibold">
                  Personal Notes (Optional)
                </Label>
                <Textarea
                  id="reflection"
                  placeholder="What insights or experiences stood out during your practice?"
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="favorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                />
                <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-accent-cyan text-accent-cyan' : ''}`} />
                  Mark as Favorite
                </Label>
              </div>

              <Button
                onClick={handleSaveReflection}
                disabled={recordSession.isPending || createJournalEntry.isPending}
                className="w-full bg-accent-cyan hover:bg-accent-cyan-tinted text-white"
                size="lg"
              >
                {recordSession.isPending || createJournalEntry.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Continue'
                )}
              </Button>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // Setup phase - single column layout
  return (
    <PageBackgroundShell variant="premed" intensity={0.25}>
      <StandardPageNav />
      <main className="relative z-10 min-h-screen px-4 py-24">
        <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold">
              {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Meditation
            </h1>
            <p className="text-muted-foreground">
              Prepare your practice with intention
            </p>
          </div>

          {/* Single column layout */}
          <div className="space-y-6">
            {/* Guide Section */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-accent-cyan" />
                  <h3 className="text-lg font-semibold">Meditation Guide</h3>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ 
                    to: '/knowledge', 
                    search: { category: selectedType, scrollToContent: true } 
                  })}
                  className="text-accent-cyan hover:text-accent-cyan-tinted hover:bg-accent-cyan/10"
                >
                  More details
                  <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </div>
              <MeditationGuideStepper steps={guide.steps} />
            </div>

            {/* Save Ritual Section */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Save className="w-5 h-5 text-accent-cyan" />
                  <div>
                    <h3 className="text-lg font-semibold">Save as Ritual</h3>
                    <p className="text-sm text-muted-foreground">
                      Save this configuration for quick access later
                    </p>
                  </div>
                </div>
                <Button
                  onClick={handleSaveRitual}
                  disabled={saveRitual.isPending}
                  variant="outline"
                  className="border-accent-cyan text-accent-cyan hover:bg-accent-cyan/10"
                >
                  {saveRitual.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Duration Section */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <Label className="text-lg font-semibold mb-4 block">Duration</Label>
              <DurationRangeInput
                value={duration}
                onChange={(val) => {
                  setDuration(val);
                  setTimerDuration(val);
                }}
              />
            </div>

            {/* Ambient Sound Section */}
            <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/50">
              <Label className="text-lg font-semibold mb-4 block">Ambient Sound</Label>
              <AmbientMusicCarousel
                selectedMusic={selectedMusicId}
                onSelectMusic={setSelectedMusicId}
                volume={volume}
                onVolumeChange={setVolume}
              />
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStartMeditation}
              size="lg"
              className="w-full bg-accent-cyan hover:bg-accent-cyan-tinted text-white text-lg py-6"
            >
              <Play className="w-6 h-6 mr-2" />
              Begin Meditation
            </Button>
          </div>
        </div>
      </main>
    </PageBackgroundShell>
  );
}
