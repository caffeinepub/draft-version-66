import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, CheckCircle2, BookOpen, Save } from 'lucide-react';
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
import { getAmbientSoundPath, getAmbientSoundById } from '../utils/ambientSounds';

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

  const handleMoreDetails = () => {
    navigate({ 
      to: '/knowledge', 
      search: { 
        category: selectedType,
        scrollToContent: 'true'
      } 
    });
  };

  const currentGuide = detailedGuides[selectedType] || detailedGuides.mindfulness;

  // Setup Phase
  if (phase === 'setup') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.3}>
        <StandardPageNav />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-4xl mx-auto space-y-8">
            {/* Title Section */}
            <div className="text-center space-y-2">
              <h1 className="text-4xl md:text-5xl font-bold text-accent-cyan">
                {formatMeditationType(selectedType)}
              </h1>
              <p className="text-lg text-muted-foreground">Prepare your practice</p>
            </div>

            {/* Unified Controls Container */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardContent className="pt-6 space-y-6">
                {/* Duration Input */}
                <DurationRangeInput
                  value={duration}
                  onChange={setDuration}
                />

                {/* Ambient Sound Picker */}
                <div className="space-y-3">
                  <Label className="text-base font-medium">Ambient Sound</Label>
                  <AmbientMusicCarousel
                    selectedMusic={selectedMusicId}
                    onSelectMusic={setSelectedMusicId}
                    volume={volume}
                    onVolumeChange={setVolume}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <Button
                    onClick={handleBeginMeditation}
                    className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-white py-2.5"
                    disabled={recordSession.isPending || createJournalEntry.isPending}
                  >
                    Begin Meditation
                  </Button>
                  <Button
                    onClick={handleSaveRitual}
                    variant="outline"
                    className="flex-1 py-2.5"
                    disabled={saveRitual.isPending}
                  >
                    {saveRitual.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Ritual
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Meditation Guide Container */}
            <Card className="bg-card/80 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="text-center text-xl">
                  {getMeditationGuideTitle(selectedType)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <MeditationGuideStepper steps={currentGuide.steps} />
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={handleMoreDetails}
                    variant="outline"
                    className="gap-2"
                  >
                    <BookOpen className="h-4 w-4" />
                    More Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // Active Phase
  if (phase === 'active') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.3}>
        <StandardPageNav />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
          <div className="w-full max-w-2xl mx-auto space-y-8">
            {/* Timer Display */}
            <div className="flex flex-col items-center space-y-6">
              <div className="relative">
                <MeditationWaveFillIndicator progress={progress} size={300} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-5xl font-light text-foreground tabular-nums">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>

              {/* Play/Pause Button with theme color background and hover glow */}
              <button
                onClick={togglePause}
                className="w-20 h-20 rounded-full bg-accent-cyan/20 hover:bg-accent-cyan/30 border-2 border-accent-cyan/60 hover:border-accent-cyan flex items-center justify-center transition-all hover:shadow-[0_0_20px_rgba(0,173,181,0.4),0_0_40px_rgba(0,173,181,0.2)] active:scale-95"
                aria-label={isPaused ? 'Play' : 'Pause'}
              >
                {isPaused ? (
                  <Play className="w-8 h-8 text-accent-cyan fill-accent-cyan" />
                ) : (
                  <Pause className="w-8 h-8 text-accent-cyan fill-accent-cyan" />
                )}
              </button>
            </div>

            {/* Time Control - Reduced height */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-[540px] mx-auto">
              <Label className="text-sm font-medium mb-3 block">Time</Label>
              <Slider
                value={[timeRemaining]}
                onValueChange={(values) => seekTime(totalTime - values[0])}
                max={totalTime}
                step={1}
                className="w-full"
              />
            </div>

            {/* Volume Control - Reduced height */}
            <div className="bg-card/60 backdrop-blur-sm rounded-xl p-4 border border-border/50 max-w-[540px] mx-auto">
              <Label className="text-sm font-medium mb-3 block">Volume</Label>
              <Slider
                value={[volume]}
                onValueChange={(values) => setVolume(values[0])}
                max={100}
                step={1}
                className="w-full"
              />
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // Reflection Phase
  return (
    <PageBackgroundShell variant="premed" intensity={0.3}>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-accent-cyan">Reflection</h1>
            <p className="text-muted-foreground">How do you feel after your session?</p>
          </div>

          <Card className="bg-card/80 backdrop-blur-sm border-border/50">
            <CardContent className="pt-6 space-y-6">
              {/* Mood Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">How are you feeling? (Select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(moodIconMap).map(([mood, Icon]) => {
                    const moodState = mood as MoodState;
                    const isSelected = selectedMoods.includes(moodState);
                    return (
                      <button
                        key={mood}
                        onClick={() => handleMoodToggle(moodState)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          isSelected
                            ? 'bg-accent-cyan border-accent-cyan text-white'
                            : 'bg-background border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{mood}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Energy Selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Energy Level</Label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(energyIconMap).map(([energy, Icon]) => {
                    const energyState = energy as EnergyState;
                    const isSelected = selectedEnergy === energyState;
                    return (
                      <button
                        key={energy}
                        onClick={() => setSelectedEnergy(energyState)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                          isSelected
                            ? 'bg-accent-cyan border-accent-cyan text-white'
                            : 'bg-background border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="text-sm font-medium capitalize">{energy}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Personal Notes */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Personal Notes (Optional)</Label>
                <Textarea
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  placeholder="Any insights or observations from your practice..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              {/* Favorite Toggle */}
              <div className="flex items-center gap-3">
                <Checkbox
                  id="favorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                />
                <Label htmlFor="favorite" className="text-sm font-medium cursor-pointer">
                  Mark as Favorite
                </Label>
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveReflection}
                className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-white"
                disabled={recordSession.isPending || createJournalEntry.isPending}
              >
                {recordSession.isPending || createJournalEntry.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save & Continue
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </PageBackgroundShell>
  );
}
