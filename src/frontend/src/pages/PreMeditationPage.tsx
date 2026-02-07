import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, CheckCircle2, BookOpen, Save } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import MeditationWaveFillIndicator from '../components/MeditationWaveFillIndicator';
import DurationRangeInput from '../components/DurationRangeInput';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { useMeditationTypes, useRecordSession, useCreateJournalEntry, useSaveRitual } from '../hooks/useQueries';
import { useProgressStats } from '../hooks/useQueries';
import { MeditationType, type MoodState, type EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';

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
  calm: Smile,
  anxious: Frown,
  neutral: Meh,
  happy: Heart,
  sad: Frown,
};

export const energyIconMap: Record<EnergyState, any> = {
  tired: Battery,
  energized: Zap,
  balanced: BatteryCharging,
  restless: Sparkles,
};

export default function PreMeditationPage() {
  const navigate = useNavigate();
  const selectedType = MeditationType.mindfulness;

  const [phase, setPhase] = useState<'setup' | 'active' | 'reflection'>('setup');
  const [duration, setDuration] = useState(10);
  const [selectedMusicId, setSelectedMusicId] = useState('temple');
  const [volume, setVolume] = useState(50);
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
    isPaused,
    progress,
    togglePause,
    seekTime,
    formatTime,
  } = useMeditationTimer({
    durationMinutes: duration,
    onComplete: () => {
      if (audioRef.current) {
        const fadeOut = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
          } else {
            clearInterval(fadeOut);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }
        }, 100);
      }
      setPhase('reflection');
    },
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const handleStartMeditation = () => {
    setPhase('active');
  };

  const handleTogglePlayPause = () => {
    togglePause();
  };

  const handleSeek = (direction: 'forward' | 'backward') => {
    const seekAmount = 30;
    const newTime = direction === 'forward' 
      ? Math.min(timeRemaining + seekAmount, duration * 60)
      : Math.max(timeRemaining - seekAmount, 0);
    seekTime(newTime);
  };

  const handleSaveAndContinue = async () => {
    if (selectedMoods.length === 0 || !selectedEnergy) {
      toast.error('Please select at least one mood and energy level');
      return;
    }

    try {
      const currentMonthlyMinutes = progressStats ? Number(progressStats.monthlyMinutes) : 0;
      const currentStreak = progressStats ? Number(progressStats.currentStreak) : 0;

      await recordSession.mutateAsync({
        minutes: duration,
        monthlyMinutes: currentMonthlyMinutes + duration,
        currentStreak: currentStreak + 1,
      });

      await createJournalEntry.mutateAsync({
        meditationType: selectedType,
        duration: BigInt(duration),
        mood: selectedMoods,
        energy: selectedEnergy,
        reflection: reflection,
        isFavorite: isFavorite,
        timestamp: BigInt(Date.now() * 1_000_000),
      });

      toast.success('Session saved successfully!');
      navigate({ to: '/' });
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleSaveRitual = async () => {
    try {
      await saveRitual.mutateAsync({
        meditationType: selectedType,
        duration: duration,
        ambientSound: selectedMusicId,
        ambientSoundVolume: volume,
      });
      toast.success('Ritual saved successfully!');
    } catch (error: any) {
      // Error already handled by mutation onError
    }
  };

  const handleMoodToggle = (mood: MoodState) => {
    setSelectedMoods(prev =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleEnergySelect = (energy: EnergyState) => {
    setSelectedEnergy(energy);
  };

  const guide = detailedGuides[selectedType.toLowerCase()] || detailedGuides.mindfulness;

  if (phase === 'setup') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.4}>
        <StandardPageNav />

        <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
          <div className="max-w-4xl mx-auto w-full space-y-8 animate-fade-in mt-16">
            <div className="text-center space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-accent-cyan-tinted animate-breathe-gentle capitalize">
                {selectedType} Meditation
              </h1>
              <p className="text-lg sm:text-xl text-description-gray max-w-3xl mx-auto leading-relaxed font-medium">
                Prepare your space and set your intention
              </p>
              <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-accent-cyan/20 shadow-glow space-y-6">
              <div className="flex items-center justify-end">
                <Button
                  onClick={handleSaveRitual}
                  disabled={saveRitual.isPending}
                  variant="outline"
                  size="sm"
                  className="border-accent-cyan/50 hover:bg-accent-cyan/10"
                >
                  {saveRitual.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  Save Ritual
                </Button>
              </div>

              <DurationRangeInput
                value={duration}
                onChange={setDuration}
                min={5}
                max={60}
              />

              <div className="space-y-4">
                <Label className="text-lg font-medium text-foreground">Ambient Sound</Label>
                <AmbientMusicCarousel
                  selectedMusic={selectedMusicId}
                  onSelectMusic={setSelectedMusicId}
                  volume={volume}
                  onVolumeChange={setVolume}
                />
              </div>

              <Button
                onClick={handleStartMeditation}
                className="w-full bg-accent-cyan hover:bg-accent-cyan-tinted text-white font-semibold py-6 text-lg rounded-xl shadow-glow-strong transition-all"
              >
                <Play className="w-6 h-6 mr-2" />
                Begin Meditation
              </Button>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-accent-cyan/20 shadow-glow">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-accent-cyan-tinted">Meditation Guide</h2>
                <Button
                  onClick={() => navigate({ to: '/knowledge', search: { category: selectedType, scrollToContent: 'true' } })}
                  variant="outline"
                  size="sm"
                  className="border-accent-cyan/50 hover:bg-accent-cyan/10"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  More details
                </Button>
              </div>
              <MeditationGuideStepper steps={guide.steps} />
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  if (phase === 'active') {
    return (
      <PageBackgroundShell variant="premed" intensity={0.6}>
        <StandardPageNav />

        <audio
          ref={audioRef}
          src={`/assets/${selectedMusicId === 'nature-resonance' ? 'Nature Resonance 3' : selectedMusicId === 'nature-resonance-2' ? 'Nature resonance 2' : selectedMusicId === 'singing-bowl' ? 'Singing bowl' : selectedMusicId === 'birds' ? 'Birds' : selectedMusicId === 'crickets' ? 'Crickets' : selectedMusicId === 'ocean' ? 'Ocean' : selectedMusicId === 'rain' ? 'Rain' : selectedMusicId === 'soothing' ? 'Soothing' : 'Temple'}.mp3`}
          loop
          autoPlay
        />

        <main className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-8">
            <div className="relative flex items-center justify-center w-full">
              <MeditationWaveFillIndicator progress={progress} size={280} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-5xl sm:text-6xl font-bold text-accent-cyan-tinted tabular-nums">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-2">
                    {Math.round(progress * 100)}% complete
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={handleTogglePlayPause}
                size="lg"
                className="bg-accent-cyan hover:bg-accent-cyan-tinted text-white rounded-full w-16 h-16 shadow-glow-strong"
              >
                {isPaused ? <Play className="w-8 h-8" /> : <Pause className="w-8 h-8" />}
              </Button>
            </div>

            <div className="w-full max-w-md space-y-4">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Volume</Label>
                <Slider
                  value={[volume]}
                  onValueChange={([val]) => setVolume(val)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  return (
    <PageBackgroundShell variant="premed" intensity={0.4}>
      <StandardPageNav />

      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-8 sm:py-12 pb-24">
        <div className="max-w-3xl mx-auto w-full space-y-8 animate-fade-in mt-16">
          <div className="text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-accent-cyan-tinted mx-auto animate-breathe-gentle" />
            <h1 className="text-4xl sm:text-5xl font-bold text-accent-cyan-tinted">
              Session Complete
            </h1>
            <p className="text-lg text-description-gray">
              Take a moment to reflect on your practice
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent mx-auto mt-6"></div>
          </div>

          <div className="bg-card/70 backdrop-blur-sm rounded-2xl p-6 sm:p-8 border border-accent-cyan/20 shadow-glow space-y-6">
            <div className="space-y-4">
              <Label className="text-lg font-medium text-foreground">How are you feeling? (Select all that apply)</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(Object.keys(moodIconMap) as MoodState[]).map((mood) => {
                  const Icon = moodIconMap[mood];
                  const isSelected = selectedMoods.includes(mood);
                  return (
                    <button
                      key={mood}
                      onClick={() => handleMoodToggle(mood)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-accent-cyan bg-accent-cyan/10 shadow-glow'
                          : 'border-border hover:border-accent-cyan/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-accent-cyan-tinted' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium capitalize ${isSelected ? 'text-accent-cyan-tinted' : 'text-foreground'}`}>
                        {mood}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-medium text-foreground">Energy Level</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(Object.keys(energyIconMap) as EnergyState[]).map((energy) => {
                  const Icon = energyIconMap[energy];
                  const isSelected = selectedEnergy === energy;
                  return (
                    <button
                      key={energy}
                      onClick={() => handleEnergySelect(energy)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-accent-cyan bg-accent-cyan/10 shadow-glow'
                          : 'border-border hover:border-accent-cyan/50'
                      }`}
                    >
                      <Icon className={`w-8 h-8 ${isSelected ? 'text-accent-cyan-tinted' : 'text-muted-foreground'}`} />
                      <span className={`text-sm font-medium capitalize ${isSelected ? 'text-accent-cyan-tinted' : 'text-foreground'}`}>
                        {energy}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-medium text-foreground">Personal Notes (Optional)</Label>
              <Textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="What insights or observations came up during your practice?"
                className="min-h-[120px] resize-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="favorite"
                checked={isFavorite}
                onCheckedChange={(checked) => setIsFavorite(checked === true)}
              />
              <Label
                htmlFor="favorite"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
              >
                <Heart className="w-4 h-4" />
                Mark as Favorite
              </Label>
            </div>

            <Button
              onClick={handleSaveAndContinue}
              disabled={recordSession.isPending || createJournalEntry.isPending}
              className="w-full bg-accent-cyan hover:bg-accent-cyan-tinted text-white font-semibold py-6 text-lg rounded-xl shadow-glow-strong transition-all"
            >
              {recordSession.isPending || createJournalEntry.isPending ? (
                <>
                  <Loader2 className="w-6 h-6 mr-2 animate-spin" />
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
