import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, CheckCircle2, BookOpen, Save, ChevronDown, ChevronUp } from 'lucide-react';
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

// Export icon maps for use in JournalPage
export const moodIconMap = {
  [MoodState.calm]: { icon: Smile, label: 'Calm' },
  [MoodState.happy]: { icon: Smile, label: 'Happy' },
  [MoodState.neutral]: { icon: Meh, label: 'Neutral' },
  [MoodState.anxious]: { icon: Frown, label: 'Anxious' },
  [MoodState.sad]: { icon: Frown, label: 'Sad' },
};

export const energyIconMap = {
  [EnergyState.energized]: { icon: Zap, label: 'Energized' },
  [EnergyState.balanced]: { icon: BatteryCharging, label: 'Balanced' },
  [EnergyState.tired]: { icon: Battery, label: 'Tired' },
  [EnergyState.restless]: { icon: Sparkles, label: 'Restless' },
};

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
        content: 'Begin to build your visualization with rich sensory detail. If you\'re imagining a beach, feel the warm sand beneath you, hear the rhythmic waves, smell the salt air, see the endless blue horizon, taste the ocean breeze. If it\'s a forest, feel the soft moss, hear birds singing, smell pine and earth, see dappled sunlight through leaves. The more vivid and multi-sensory your visualization, the more powerful its calming effect. Let yourself be fully immersed.',
      },
      {
        title: 'Explore and Discover',
        content: 'Allow yourself to move through this inner landscape with curiosity and openness. You might discover a hidden path, a peaceful clearing, or a place of special significance. Notice what draws your attention. If you encounter any symbols, images, or feelings, observe them without judgment. This is your inner world—there are no wrong experiences. You might visualize meeting a wise guide, finding a meaningful object, or simply resting in beauty and peace.',
      },
      {
        title: 'Return with Intention & Benefits',
        content: 'When you\'re ready to conclude, take a few moments to appreciate the experience. Slowly bring your awareness back to your physical body—feel your breath, notice the surface beneath you, hear the sounds around you. Gently wiggle your fingers and toes. When you open your eyes, carry the sense of peace and clarity with you into your day.\n\nBenefits: Visualization meditation enhances creativity and imagination, reduces stress and promotes deep relaxation, improves goal-setting and manifestation abilities, strengthens mental clarity and problem-solving skills, and creates a powerful sense of inner peace and possibility.',
      },
    ],
  },
  ifs: {
    steps: [
      {
        title: 'Ground in Self-Energy',
        content: 'Sit comfortably and take a few deep breaths to center yourself. In IFS, we recognize that we all have a core Self—a calm, compassionate, curious presence within. Begin by noticing how you feel right now. Are you calm, curious, compassionate, confident, clear, courageous, creative, or connected? These are qualities of Self-energy. If you notice tension, judgment, or strong emotions, simply acknowledge them. You\'re preparing to meet different parts of yourself with openness.',
      },
      {
        title: 'Notice Your Parts',
        content: 'Bring to mind a situation, feeling, or pattern that\'s been challenging for you recently. Notice what arises—perhaps a critical voice, a protective impulse, a feeling of fear or shame. In IFS, these are called "parts"—distinct aspects of your psyche, each with its own perspective and intention. Instead of pushing them away, get curious: What part of me is showing up right now? How old does this part feel? What is it trying to protect me from? Simply observe with compassion.',
      },
      {
        title: 'Dialogue with Compassion',
        content: 'Choose one part to focus on. From your Self-energy (that calm, curious presence), ask this part: What do you want me to know? What are you afraid would happen if you didn\'t do your job? Listen inwardly for a response—it might come as words, images, feelings, or sensations. Thank this part for sharing. Let it know you appreciate its efforts to protect you. Ask: What do you need from me? How can I help? This compassionate dialogue helps parts feel seen and understood.',
      },
      {
        title: 'Integrate and Appreciate & Benefits',
        content: 'As you conclude, thank all the parts that showed up today. Recognize that even the most challenging parts are trying to help you in some way. From your Self, offer them reassurance: I\'m here. I see you. We\'re in this together. Take a few deep breaths and gently return to the present moment. Notice if there\'s any shift in how you feel—perhaps more spaciousness, self-compassion, or inner harmony.\n\nBenefits: IFS meditation promotes deep self-understanding and inner harmony, reduces internal conflict and self-criticism, heals emotional wounds and trauma with compassion, enhances emotional regulation and resilience, and fosters a strong, compassionate relationship with all parts of yourself.',
      },
    ],
  },
};

export default function PreMeditationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as {
    type?: string;
    duration?: number;
    ambientSound?: string;
    ambientSoundVolume?: number;
    autoStart?: boolean;
  };
  
  // Validate and coerce the type from search params
  const selectedType = validateMeditationType(search.type || 'mindfulness');
  
  const [duration, setDuration] = useState(search.duration || 10);
  const [selectedMusic, setSelectedMusic] = useState(search.ambientSound || 'none');
  const [musicVolume, setMusicVolume] = useState(search.ambientSoundVolume || 50);
  const [phase, setPhase] = useState<'setup' | 'active' | 'reflection'>(search.autoStart ? 'active' : 'setup');
  const [mood, setMood] = useState<MoodState[]>([]);
  const [energy, setEnergy] = useState<EnergyState | null>(null);
  const [reflection, setReflection] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showGuideDetails, setShowGuideDetails] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordSession = useRecordSession();
  const createJournalEntry = useCreateJournalEntry();
  const saveRitual = useSaveRitual();
  const { data: progressStats } = useProgressStats();

  const { timeRemaining, progress, start, togglePause, isPaused, reset } = useMeditationTimer({
    durationMinutes: duration,
    onComplete: () => {},
    autoStart: false,
  });

  useEffect(() => {
    if (search.autoStart && phase === 'active') {
      start();
    }
  }, [search.autoStart, phase, start]);

  useEffect(() => {
    if (phase === 'active' && selectedMusic !== 'none') {
      const soundPath = getAmbientSoundPath(selectedMusic);
      if (soundPath) {
        audioRef.current = new Audio(soundPath);
        audioRef.current.loop = true;
        audioRef.current.volume = musicVolume / 100;
        audioRef.current.play().catch(err => console.error('Audio playback failed:', err));
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [phase, selectedMusic]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = musicVolume / 100;
    }
  }, [musicVolume]);

  useEffect(() => {
    if (timeRemaining === 0 && phase === 'active') {
      if (audioRef.current) {
        const fadeOut = setInterval(() => {
          if (audioRef.current && audioRef.current.volume > 0.05) {
            audioRef.current.volume = Math.max(0, audioRef.current.volume - 0.05);
          } else {
            clearInterval(fadeOut);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
          }
        }, 100);
      }
      setPhase('reflection');
    }
  }, [timeRemaining, phase]);

  const handleBeginMeditation = () => {
    setPhase('active');
    start();
  };

  const handlePauseResume = () => {
    togglePause();
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play().catch(err => console.error('Audio resume failed:', err));
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleMoodToggle = (moodState: MoodState) => {
    setMood(prev =>
      prev.includes(moodState)
        ? prev.filter(m => m !== moodState)
        : [...prev, moodState]
    );
  };

  const handleSaveReflection = async () => {
    try {
      const sessionData = {
        minutes: BigInt(duration),
        timestamp: BigInt(Date.now()),
      };

      const currentStreak = progressStats?.currentStreak || BigInt(0);
      const monthlyMinutes = progressStats?.monthlyMinutes || BigInt(0);

      await recordSession.mutateAsync({
        session: sessionData,
        monthlyStats: monthlyMinutes,
        currentStreak: currentStreak,
      });

      if (mood.length > 0 && energy) {
        const journalData = {
          meditationType: selectedType as MeditationType,
          duration: BigInt(duration),
          mood,
          energy,
          reflection,
          timestamp: BigInt(Date.now()),
          isFavorite,
        };

        await createJournalEntry.mutateAsync(journalData);
      }

      toast.success('Session saved successfully!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      const errorMessage = getCloudSyncErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handleSaveRitual = async () => {
    try {
      const ritualData = {
        meditationType: selectedType as MeditationType,
        duration: BigInt(duration),
        ambientSound: selectedMusic,
        ambientSoundVolume: BigInt(musicVolume),
        timestamp: BigInt(Date.now()),
      };

      await saveRitual.mutateAsync(ritualData);
      toast.success('Ritual saved successfully!');
    } catch (error: any) {
      const errorMessage = getCloudSyncErrorMessage(error);
      toast.error(errorMessage);
    }
  };

  const handleBackToDashboard = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    navigate({ to: '/dashboard' });
  };

  const currentGuide = detailedGuides[selectedType] || detailedGuides.mindfulness;

  if (phase === 'active') {
    const waveFillProgress = duration > 0 ? Math.max(0, Math.min(1, progress)) : 0;

    return (
      <PageBackgroundShell variant="premed" intensity={0.3}>
        <StandardPageNav onBack={handleBackToDashboard} />
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="flex flex-col items-center space-y-8">
              <div className="relative">
                <MeditationWaveFillIndicator
                  progress={waveFillProgress}
                  size={280}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-accent-cyan-tinted">
                      {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <Button
                  onClick={handlePauseResume}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-16 h-16 border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10"
                >
                  {isPaused ? <Play className="w-6 h-6 text-accent-cyan" /> : <Pause className="w-6 h-6 text-accent-cyan" />}
                </Button>
              </div>

              {selectedMusic !== 'none' && (
                <div className="w-full max-w-xs space-y-2">
                  <Label className="text-sm text-description-gray">Volume</Label>
                  <Slider
                    value={[musicVolume]}
                    onValueChange={(value) => setMusicVolume(value[0])}
                    min={0}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  if (phase === 'reflection') {
    return (
      <PageBackgroundShell>
        <StandardPageNav onBack={handleBackToDashboard} />
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
          <div className="w-full max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-accent-cyan mx-auto" />
              <h1 className="text-4xl font-bold text-accent-cyan-tinted">Session Complete</h1>
              <p className="text-lg text-description-gray">How are you feeling?</p>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground">Mood</Label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(moodIconMap).map(([state, { icon: Icon, label }]) => (
                    <Button
                      key={state}
                      variant={mood.includes(state as MoodState) ? 'default' : 'outline'}
                      onClick={() => handleMoodToggle(state as MoodState)}
                      className={mood.includes(state as MoodState) ? 'bg-accent-cyan hover:bg-accent-cyan/90' : 'border-accent-cyan/50 hover:bg-accent-cyan/10'}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground">Energy Level</Label>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(energyIconMap).map(([state, { icon: Icon, label }]) => (
                    <Button
                      key={state}
                      variant={energy === state ? 'default' : 'outline'}
                      onClick={() => setEnergy(state as EnergyState)}
                      className={energy === state ? 'bg-accent-cyan hover:bg-accent-cyan/90' : 'border-accent-cyan/50 hover:bg-accent-cyan/10'}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="reflection" className="text-base font-semibold text-foreground">
                  Personal Notes (Optional)
                </Label>
                <Textarea
                  id="reflection"
                  placeholder="How did this session feel? Any insights or observations..."
                  value={reflection}
                  onChange={(e) => setReflection(e.target.value)}
                  className="min-h-[120px] bg-background/50 border-accent-cyan/30 focus:border-accent-cyan"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="favorite"
                  checked={isFavorite}
                  onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                />
                <Label htmlFor="favorite" className="text-base cursor-pointer flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  Mark as Favorite
                </Label>
              </div>
            </div>

            <Button
              onClick={handleSaveReflection}
              disabled={!mood.length || !energy || recordSession.isPending || createJournalEntry.isPending}
              size="lg"
              className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark py-6 text-lg font-semibold"
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
        </main>
      </PageBackgroundShell>
    );
  }

  return (
    <PageBackgroundShell>
      <StandardPageNav onBack={handleBackToDashboard} />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="w-full max-w-4xl mx-auto space-y-8 animate-fade-in">
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-bold text-accent-cyan-tinted capitalize">
              {selectedType} Meditation
            </h1>
            <p className="text-lg text-description-gray max-w-2xl mx-auto">
              Prepare your space and set your intention
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8">
            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 space-y-6">
              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground">Duration</Label>
                <DurationRangeInput value={duration} onChange={setDuration} />
              </div>

              <div className="space-y-4">
                <Label className="text-base font-semibold text-foreground">Ambient Sound</Label>
                <AmbientMusicCarousel
                  selectedMusic={selectedMusic}
                  onSelectMusic={setSelectedMusic}
                  volume={musicVolume}
                  onVolumeChange={setMusicVolume}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleBeginMeditation}
                  size="lg"
                  className="flex-1 bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark py-2 text-lg font-semibold"
                >
                  Begin Meditation
                </Button>
                <Button
                  onClick={handleSaveRitual}
                  disabled={saveRitual.isPending}
                  variant="outline"
                  size="lg"
                  className="border-accent-cyan/50 hover:bg-accent-cyan/10 py-2"
                >
                  {saveRitual.isPending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                </Button>
              </div>
            </div>

            <div className="bg-card/70 backdrop-blur-sm rounded-xl p-6 border border-accent-cyan/20 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-accent-cyan-tinted flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  Meditation Guide
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowGuideDetails(!showGuideDetails)}
                  className="text-accent-cyan hover:bg-accent-cyan/10"
                >
                  {showGuideDetails ? (
                    <>
                      <ChevronUp className="w-4 h-4 mr-1" />
                      Less Details
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 mr-1" />
                      More Details
                    </>
                  )}
                </Button>
              </div>

              {showGuideDetails ? (
                <MeditationGuideStepper steps={currentGuide.steps} />
              ) : (
                <p className="text-description-gray leading-relaxed">
                  {currentGuide.steps[0].content.substring(0, 200)}...
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </PageBackgroundShell>
  );
}
