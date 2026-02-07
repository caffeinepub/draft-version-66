import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, ExternalLink, CheckCircle2, BookOpen, Save, ArrowLeft } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearch } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import PageBackgroundShell from '../components/PageBackgroundShell';
import HamburgerMenu from '../components/HamburgerMenu';
import MeditationWaveFillIndicator from '../components/MeditationWaveFillIndicator';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { useMeditationTypes, useRecordSession, useCreateJournalEntry, useSaveRitual } from '../hooks/useQueries';
import { useProgressStats } from '../hooks/useQueries';
import type { MeditationType, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';
import { getCloudSyncErrorMessage } from '../utils/cloudSync';
import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';

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
        content: 'Find a quiet, comfortable space where you won\'t be disturbed for the duration of your practice. You can sit upright or lie down—choose whatever position helps you relax most deeply while staying alert. Dim the lights if possible. Close your eyes gently and take three slow, deep breaths, allowing each exhale to release any tension or stress you\'re holding. Set an intention for this practice: perhaps healing, clarity, peace, or simply deep rest.',
      },
      {
        title: 'Deepen Your Relaxation',
        content: 'Take several slow, deep breaths—inhaling through your nose for a count of four, holding gently for four, and exhaling through your mouth for six. With each exhale, consciously release tension from different parts of your body: your forehead, jaw, shoulders, arms, chest, belly, hips, legs, and feet. Feel yourself becoming heavier and more relaxed, as if you\'re sinking into the surface beneath you. Let go of any need to control or analyze—simply allow yourself to be.',
      },
      {
        title: 'Build Your Mental Sanctuary',
        content: 'Begin to visualize a peaceful place—this could be somewhere real you\'ve been, or entirely imagined. Perhaps a quiet beach with gentle waves, a serene forest with dappled sunlight, a mountain meadow with wildflowers, or a cozy sanctuary. Make it as vivid as possible using all your senses: What do you see? What colors and light? What do you hear—birds, water, wind? What do you smell and feel on your skin? What emotions arise in this place? Spend time here, exploring and deepening the experience. This is your refuge.',
      },
      {
        title: 'Return Gently & Benefits',
        content: 'When you feel complete, take a moment to appreciate this inner sanctuary—knowing you can return here anytime you need peace or clarity. Slowly begin to bring your awareness back to your physical body. Notice the surface beneath you, the temperature of the air, sounds in the room. Wiggle your fingers and toes gently. Take a deep, nourishing breath. When you\'re ready, slowly open your eyes and take a moment to reorient yourself before moving.\n\nBenefits: Visualization practice reduces stress and promotes deep relaxation, enhances creativity and problem-solving abilities, improves focus and mental clarity, supports goal achievement and positive mindset, and can aid in physical healing and pain management through mind-body connection.',
      },
    ],
  },
  ifs: {
    steps: [
      {
        title: 'Ground Yourself',
        content: 'Sit or lie down in a comfortable position where you feel safe and supported. Keep your body relaxed and open—uncross your arms and legs if possible. You might place one hand on your heart center and one on your belly to create a sense of connection and self-compassion. Take several deep breaths, feeling your body settle. Remind yourself that this is a practice of curiosity and kindness toward all parts of yourself, without judgment or agenda.',
      },
      {
        title: 'Cultivate Self-Compassion',
        content: 'Begin by acknowledging that all parts of you—even the ones you might judge as "bad" or "difficult"—are welcome in this practice and are trying to help you in some way. Approach yourself with genuine curiosity and kindness, as you would a dear friend. Take a moment to connect with your core Self—the calm, compassionate, curious awareness that can witness all your parts without being overwhelmed by them. This is your wise, centered presence.',
      },
      {
        title: 'Meet Your Parts',
        content: 'If a particular emotion, thought pattern, or sensation feels strong right now, gently turn your attention toward it. Instead of pushing it away or getting lost in it, imagine it as a "part" of you—perhaps with an age, appearance, or voice. With curiosity and compassion, ask it: "What do you want me to know?" or "What are you trying to protect me from?" Listen with an open heart, without judgment. You might sense an answer through words, images, feelings, or just a knowing. Thank this part for sharing and for trying to help you, even if its methods are painful.',
      },
      {
        title: 'Integrate and Harmonize & Benefits',
        content: 'Recognize that you are more than any single part—you are the compassionate, spacious awareness that can hold all parts with love and understanding. Each part has a role and a story. As you acknowledge and listen to them, they can relax and trust your Self to lead. Take a moment to appreciate the complexity and wisdom of your inner system. When you\'re ready, thank all your parts for their presence and slowly return your awareness to your breath and body. Open your eyes gently when ready.\n\nBenefits: IFS meditation promotes deep self-understanding and inner harmony, heals emotional wounds and trauma by addressing root causes, reduces internal conflict and self-criticism, enhances emotional regulation and resilience, improves relationships by understanding your reactive patterns, and fosters genuine self-compassion and wholeness.',
      },
    ],
  },
};

// Export mood/energy icon mappings for use in Journal filters
export const moodIconMap: Record<MoodState, any> = {
  calm: Heart,
  happy: Smile,
  neutral: Meh,
  anxious: Frown,
  sad: Frown,
};

export const energyIconMap: Record<EnergyState, any> = {
  energized: Zap,
  balanced: BatteryCharging,
  tired: Battery,
  restless: Sparkles,
};

type ViewState = 'setup' | 'active' | 'reflection';

interface PreMeditationSearch {
  type?: string;
  fromQuiz?: boolean;
  ritualDuration?: number;
  ritualSound?: string;
  ritualVolume?: number;
  instantStart?: boolean;
}

export default function PreMeditationPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as PreMeditationSearch;
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(search.ritualDuration || 15);
  const [selectedMusic, setSelectedMusic] = useState(search.ritualSound || 'soothing');
  const [volume, setVolume] = useState(search.ritualVolume || 50);
  const [viewState, setViewState] = useState<ViewState>(search.instantStart ? 'active' : 'setup');
  const { theme, setTheme } = useTheme();
  
  // Audio management
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reflection state
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedMoods, setSelectedMoods] = useState<MoodState[]>([]);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyState | null>(null);
  const [personalNotes, setPersonalNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showEnergyQuestion, setShowEnergyQuestion] = useState(false);
  const [showNotesSection, setShowNotesSection] = useState(false);
  
  const meditationType = search.type || 'mindfulness';
  const fromQuiz = search.fromQuiz || false;
  const { data: meditationTypes } = useMeditationTypes();
  const { data: progressStats } = useProgressStats();
  const recordSession = useRecordSession();
  const createJournalEntry = useCreateJournalEntry();
  const saveRitual = useSaveRitual();

  // Timer hook - initialize with current duration
  const timer = useMeditationTimer({
    durationMinutes: duration,
    onComplete: handleMeditationComplete,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset timer when duration changes in setup
  useEffect(() => {
    if (viewState === 'setup') {
      timer.seekTime(duration * 60);
    }
  }, [duration, viewState]);

  // Handle instant start from ritual
  useEffect(() => {
    if (search.instantStart && mounted && viewState === 'active') {
      handleStartMeditation();
    }
  }, [search.instantStart, mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }
    };
  }, []);

  const getMeditationName = () => {
    const typeMap: Record<string, string> = {
      mindfulness: 'Mindfulness',
      metta: 'Metta',
      visualization: 'Visualization',
      ifs: 'IFS',
    };
    return typeMap[meditationType] || 'Mindfulness';
  };

  const getAmbientSoundName = (soundId: string) => {
    const soundMap: Record<string, string> = {
      temple: 'Temple',
      'singing-bowl': 'Singing Bowl',
      rain: 'Rain',
      ocean: 'Ocean',
      soothing: 'Soothing',
      birds: 'Birds',
      crickets: 'Crickets',
    };
    return soundMap[soundId] || 'Soothing';
  };

  const getGuideSteps = () => {
    return detailedGuides[meditationType]?.steps || detailedGuides.mindfulness.steps;
  };

  const getDurationText = () => {
    if (duration <= 10) return `${duration}-minute quick reset`;
    if (duration <= 20) return `${duration}-minute gentle session`;
    if (duration <= 40) return `${duration}-minute deep practice`;
    return `${duration}-minute extended journey`;
  };

  const getMusicFile = (musicId: string): string => {
    const musicMap: Record<string, string> = {
      temple: '/assets/Temple.mp3',
      'singing-bowl': '/assets/Singing bowl.mp3',
      rain: '/assets/Rain.mp3',
      ocean: '/assets/Ocean.mp3',
      soothing: '/assets/Soothing.mp3',
      birds: '/assets/Birds.mp3',
      crickets: '/assets/Crickets.mp3',
    };
    return musicMap[musicId] || '/assets/Soothing.mp3';
  };

  const stopAllAudio = () => {
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = '';
      audioRef.current = null;
    }
  };

  const fadeOutAndStop = () => {
    if (!audioRef.current) return;

    const fadeStep = 0.02;
    const fadeInterval = 50;

    fadeIntervalRef.current = setInterval(() => {
      if (audioRef.current && audioRef.current.volume > fadeStep) {
        audioRef.current.volume = Math.max(0, audioRef.current.volume - fadeStep);
      } else {
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
        stopAllAudio();
      }
    }, fadeInterval);
  };

  const handleStartMeditation = () => {
    timer.seekTime(duration * 60);
    setViewState('active');

    const audio = new Audio(getMusicFile(selectedMusic));
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch((error) => {
      console.log('Audio autoplay prevented:', error);
    });
    audioRef.current = audio;
  };

  function handleMeditationComplete() {
    fadeOutAndStop();

    const monthlyMinutes = progressStats ? Number(progressStats.monthlyMinutes) : 0;
    const currentStreak = progressStats ? Number(progressStats.currentStreak) : 0;
    
    recordSession.mutate({
      minutes: duration,
      monthlyMinutes,
      currentStreak,
    });

    setTimeout(() => {
      stopAllAudio();
      setViewState('reflection');
      setCurrentQuestion(0);
      setSelectedMoods([]);
      setSelectedEnergy(null);
      setPersonalNotes('');
      setIsFavorite(false);
      setShowEnergyQuestion(false);
      setShowNotesSection(false);
    }, 1500);
  }

  const handleTogglePause = () => {
    timer.togglePause();
    if (timer.isPaused) {
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.log('Audio play prevented:', error);
        });
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handleTimeSeek = (value: number[]) => {
    timer.seekTime(value[0]);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleMoreDetails = () => {
    navigate({
      to: '/knowledge',
      search: { category: meditationType, scrollToContent: true },
    });
  };

  const handleSaveRitual = async () => {
    try {
      await saveRitual.mutateAsync({
        meditationType: meditationType as MeditationType,
        duration: BigInt(duration),
        ambientSound: selectedMusic,
        ambientSoundVolume: BigInt(volume),
        timestamp: BigInt(Date.now() * 1000000),
      });
      toast.success('Ritual saved successfully!');
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const handleBackToSetup = () => {
    stopAllAudio();
    timer.seekTime(duration * 60);
    setViewState('setup');
  };

  const handleMoodToggle = (mood: MoodState) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
    );
  };

  const handleNextQuestion = () => {
    if (currentQuestion === 0 && selectedMoods.length > 0) {
      setShowEnergyQuestion(true);
      setCurrentQuestion(1);
    } else if (currentQuestion === 1 && selectedEnergy) {
      setShowNotesSection(true);
      setCurrentQuestion(2);
    }
  };

  const handleSaveReflection = async () => {
    try {
      await createJournalEntry.mutateAsync({
        meditationType: meditationType as MeditationType,
        duration: BigInt(duration),
        mood: selectedMoods,
        energy: selectedEnergy!,
        reflection: personalNotes,
        timestamp: BigInt(Date.now() * 1000000),
        isFavorite,
      });

      toast.success('Reflection saved!');
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted) {
    return null;
  }

  // Setup view
  if (viewState === 'setup') {
    return (
      <PageBackgroundShell variant="premed">
        <div className="relative min-h-screen">
          {/* Desktop-only theme toggle in top-right */}
          <div className="fixed top-6 right-6 z-50 hidden md:block">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>

          {/* Mobile-only hamburger menu (replaces theme toggle on mobile) */}
          <div className="fixed top-6 right-6 z-50 md:hidden">
            <HamburgerMenu />
          </div>

          {/* Back button */}
          <div className="fixed top-6 left-6 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate({ to: '/dashboard' })}
              className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-3 text-foreground">
                {getMeditationName()} Meditation
              </h1>
              <p className="text-lg text-muted-foreground">{getDurationText()}</p>
            </div>

            {fromQuiz && (
              <div className="mb-8 p-4 bg-accent-cyan/10 border border-accent-cyan/20 rounded-lg text-center">
                <p className="text-sm text-foreground">
                  <CheckCircle2 className="inline-block w-4 h-4 mr-2 text-accent-cyan" />
                  Based on your quiz responses, we recommend starting with {getMeditationName()}.
                </p>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Left column: Duration & Music */}
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <span>Duration</span>
                  </h3>
                  <div className="space-y-4">
                    <Slider
                      value={[duration]}
                      onValueChange={(value) => setDuration(value[0])}
                      min={5}
                      max={60}
                      step={5}
                      className="w-full"
                    />
                    <div className="text-center">
                      <span className="text-3xl font-bold text-accent-cyan">{duration}</span>
                      <span className="text-lg text-muted-foreground ml-2">minutes</span>
                    </div>
                  </div>
                </div>

                <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                  <h3 className="text-lg font-semibold mb-4">Ambient Sound</h3>
                  <AmbientMusicCarousel
                    selectedMusic={selectedMusic}
                    onSelectMusic={setSelectedMusic}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSaveRitual}
                    disabled={saveRitual.isPending}
                    variant="outline"
                    className="flex-1"
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
                  <Button
                    onClick={handleMoreDetails}
                    variant="outline"
                    className="flex-1"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    More Details
                  </Button>
                </div>
              </div>

              {/* Right column: Guide */}
              <div className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50">
                <h3 className="text-lg font-semibold mb-4">Meditation Guide</h3>
                <MeditationGuideStepper steps={getGuideSteps()} />
              </div>
            </div>

            <div className="text-center">
              <Button
                onClick={handleStartMeditation}
                size="lg"
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-white px-12 py-6 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <Play className="mr-2 h-5 w-5" />
                Begin Meditation
              </Button>
            </div>
          </div>
        </div>
      </PageBackgroundShell>
    );
  }

  // Active meditation view
  if (viewState === 'active') {
    return (
      <PageBackgroundShell variant="premed">
        <div className="relative min-h-screen flex items-center justify-center">
          {/* Back button */}
          <div className="fixed top-6 left-6 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBackToSetup}
              className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
              aria-label="Back to setup"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex flex-col items-center gap-8 px-4">
            {/* Wave fill indicator */}
            <div className="relative">
              <MeditationWaveFillIndicator
                progress={timer.progress}
                width={320}
                height={480}
              />
              
              {/* Timer text overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-6xl md:text-7xl font-bold text-foreground drop-shadow-lg">
                  {formatTime(timer.timeRemaining)}
                </div>
                <div className="text-sm text-muted-foreground mt-2">
                  {getMeditationName()} • {getAmbientSoundName(selectedMusic)}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6 w-full max-w-md">
              <Button
                onClick={handleTogglePause}
                size="lg"
                className="bg-accent-cyan hover:bg-accent-cyan/90 text-white rounded-full w-16 h-16 p-0"
              >
                {timer.isPaused ? (
                  <Play className="h-6 w-6" />
                ) : (
                  <Pause className="h-6 w-6" />
                )}
              </Button>

              {/* Volume control */}
              <div className="w-full space-y-2">
                <label className="text-sm text-muted-foreground">Volume</label>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => handleVolumeChange(value[0])}
                  min={0}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Time seek control */}
              <div className="w-full space-y-2">
                <label className="text-sm text-muted-foreground">Seek</label>
                <Slider
                  value={[timer.timeRemaining]}
                  onValueChange={handleTimeSeek}
                  min={0}
                  max={duration * 60}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </PageBackgroundShell>
    );
  }

  // Reflection view
  return (
    <PageBackgroundShell variant="premed">
      <div className="relative min-h-screen">
        <div className="fixed top-6 left-6 z-50">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate({ to: '/dashboard' })}
            className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background/90"
            aria-label="Back to dashboard"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-foreground">Reflection</h1>
            <p className="text-lg text-muted-foreground">
              Take a moment to reflect on your {duration}-minute {getMeditationName()} session
            </p>
          </div>

          <div className="bg-card/50 backdrop-blur-sm p-8 rounded-xl border border-border/50 space-y-8">
            {/* Question 1: Mood */}
            {currentQuestion >= 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">How are you feeling right now?</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {(['calm', 'happy', 'neutral', 'anxious', 'sad'] as MoodState[]).map((mood) => {
                    const Icon = moodIconMap[mood];
                    const isSelected = selectedMoods.includes(mood);
                    return (
                      <button
                        key={mood}
                        onClick={() => handleMoodToggle(mood)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-accent-cyan' : ''}`} />
                        <span className="text-sm capitalize">{mood}</span>
                      </button>
                    );
                  })}
                </div>
                {!showEnergyQuestion && (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={selectedMoods.length === 0}
                    className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-white"
                  >
                    Continue
                  </Button>
                )}
              </div>
            )}

            {/* Question 2: Energy */}
            {showEnergyQuestion && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">What's your energy level?</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['energized', 'balanced', 'tired', 'restless'] as EnergyState[]).map((energy) => {
                    const Icon = energyIconMap[energy];
                    const isSelected = selectedEnergy === energy;
                    return (
                      <button
                        key={energy}
                        onClick={() => setSelectedEnergy(energy)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border hover:border-accent-cyan/50'
                        }`}
                      >
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? 'text-accent-cyan' : ''}`} />
                        <span className="text-sm capitalize">{energy}</span>
                      </button>
                    );
                  })}
                </div>
                {!showNotesSection && (
                  <Button
                    onClick={handleNextQuestion}
                    disabled={!selectedEnergy}
                    className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-white"
                  >
                    Continue
                  </Button>
                )}
              </div>
            )}

            {/* Question 3: Notes */}
            {showNotesSection && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Notes (Optional)</h3>
                <Textarea
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Any insights, observations, or thoughts from your practice..."
                  className="min-h-[120px]"
                />

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="favorite"
                    checked={isFavorite}
                    onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                  />
                  <Label htmlFor="favorite" className="flex items-center gap-2 cursor-pointer">
                    <Heart className="h-4 w-4" />
                    Mark as Favorite
                  </Label>
                </div>

                <Button
                  onClick={handleSaveReflection}
                  disabled={createJournalEntry.isPending}
                  className="w-full bg-accent-cyan hover:bg-accent-cyan/90 text-white"
                >
                  {createJournalEntry.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageBackgroundShell>
  );
}
