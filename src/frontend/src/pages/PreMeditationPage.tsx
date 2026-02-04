import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Moon, Sun, ArrowLeft, Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LotusCanvas from '../components/LotusCanvas';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import SessionIndicator from '../components/SessionIndicator';
import HamburgerMenu from '../components/HamburgerMenu';
import MobileBackButton from '../components/MobileBackButton';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import { useMeditationTypes, useRecordSession, useSaveJournalEntry, useSaveRitual } from '../hooks/useQueries';
import type { MeditationType, MoodState, EnergyState } from '../backend';
import { toast } from 'sonner';

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
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as PreMeditationSearch;
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(search.ritualDuration || 15);
  const [selectedMusic, setSelectedMusic] = useState(search.ritualSound || 'soothing');
  const [volume, setVolume] = useState(search.ritualVolume || 50);
  const [viewState, setViewState] = useState<ViewState>(search.instantStart ? 'active' : 'setup');
  
  // Active meditation state
  const [isPaused, setIsPaused] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
  const recordSession = useRecordSession();
  const saveJournalEntry = useSaveJournalEntry();
  const saveRitual = useSaveRitual();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle instant start from ritual
  useEffect(() => {
    if (search.instantStart && mounted) {
      handleStartMeditation();
    }
  }, [search.instantStart, mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
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
    const sessionDuration = duration * 60;
    setTotalTime(sessionDuration);
    setTimeRemaining(sessionDuration);
    setViewState('active');

    // Start audio
    const audio = new Audio(getMusicFile(selectedMusic));
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch((error) => {
      console.log('Audio autoplay prevented:', error);
    });
    audioRef.current = audio;

    // Start timer
    startTimer();
  };

  const startTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleMeditationComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMeditationComplete = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fade out ambient music smoothly and stop completely
    fadeOutAndStop();

    // Record the session immediately
    recordSession.mutate(duration);

    // Transition to reflection after a short delay
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
  };

  const togglePause = () => {
    if (isPaused) {
      startTimer();
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.log('Audio play prevented:', error);
        });
      }
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
    setIsPaused(!isPaused);
  };

  const handleTimeSeek = (value: number[]) => {
    const newTime = value[0];
    setTimeRemaining(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleBackToDashboard = () => {
    stopAllAudio();
    navigate({ to: '/dashboard' });
  };

  const handleChangeMeditationType = () => {
    stopAllAudio();
    navigate({ to: '/dashboard' });
  };

  // Reflection handlers
  const moodQuestions = [
    {
      question: 'How are you feeling right now? (Select up to 2)',
      options: [
        { value: 'calm' as MoodState, label: 'Calm', icon: Smile },
        { value: 'happy' as MoodState, label: 'Happy', icon: Smile },
        { value: 'neutral' as MoodState, label: 'Neutral', icon: Meh },
        { value: 'anxious' as MoodState, label: 'Anxious', icon: Frown },
        { value: 'sad' as MoodState, label: 'Sad', icon: Frown },
      ],
    },
  ];

  const energyQuestion = {
    question: 'How is your energy level?',
    options: [
      { value: 'tired' as EnergyState, label: 'Tired', icon: Battery },
      { value: 'balanced' as EnergyState, label: 'Balanced', icon: Zap },
      { value: 'energized' as EnergyState, label: 'Energized', icon: BatteryCharging },
      { value: 'restless' as EnergyState, label: 'Restless', icon: Zap },
    ],
  };

  const handleMoodToggle = (mood: MoodState) => {
    setSelectedMoods((prev) => {
      if (prev.includes(mood)) {
        // Allow deselection
        return prev.filter((m) => m !== mood);
      } else {
        // Limit to 2 moods maximum
        if (prev.length >= 2) {
          return prev; // Don't add if already at limit
        }
        return [...prev, mood];
      }
    });
  };

  const handleMoodNext = () => {
    if (selectedMoods.length === 0) return;
    setShowEnergyQuestion(true);
  };

  const handleEnergyNext = () => {
    if (!selectedEnergy) return;
    setShowNotesSection(true);
  };

  const handleSaveAsRitual = async () => {
    try {
      await saveRitual.mutateAsync({
        meditationType,
        duration,
        ambientSound: selectedMusic,
        ambientSoundVolume: volume,
      });
      toast.success('Ritual saved successfully!', {
        className: 'bg-card border-2 border-accent-cyan/50 text-foreground',
      });
    } catch (error: any) {
      console.error('Error saving ritual:', error);
      
      // Check for duplicate error (explicit signal from mutation)
      if (error.message === 'DUPLICATE_RITUAL') {
        toast.error('This ritual already exists in your collection.', {
          className: 'bg-card border-2 border-destructive/50 text-foreground',
        });
      } else {
        // Generic failure for all other errors
        toast.error('Failed to save ritual. Please try again.', {
          className: 'bg-card border-2 border-destructive/50 text-foreground',
        });
      }
    }
  };

  const handleSaveAndContinue = async () => {
    // Defensively cap moods to 2 at save time
    const moodsToSave = selectedMoods.slice(0, 2);
    
    // Save to journal using backend/local storage with multiple moods and energy state
    try {
      await saveJournalEntry.mutateAsync({
        meditationType: meditationType as MeditationType,
        duration: BigInt(duration),
        mood: moodsToSave.length > 0 ? moodsToSave : ['neutral' as MoodState],
        energy: selectedEnergy || ('balanced' as EnergyState),
        reflection: personalNotes,
        isFavorite,
      });
      navigate({ to: '/dashboard' });
    } catch (error) {
      console.error('Error saving journal entry:', error);
      toast.error('Failed to save reflection. Please try again.', {
        className: 'bg-card border-2 border-destructive/50 text-foreground',
      });
    }
  };

  // Render based on view state
  if (viewState === 'active') {
    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    const breatheScale = 1 + Math.sin(Date.now() / 2000) * 0.05;

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
        <LotusCanvas variant="premed" intensity={0.7} />

        {/* Desktop Session Indicator */}
        {mounted && (
          <div className="hidden md:block">
            <SessionIndicator />
          </div>
        )}

        {/* Desktop Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-accent-cyan" />
            ) : (
              <Moon className="h-5 w-5 text-primary-dark" />
            )}
          </button>
        )}

        {/* Mobile Hamburger Menu */}
        {mounted && <HamburgerMenu />}

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6">
          <div className="flex flex-col items-center space-y-12 animate-fade-in">
            <div className="relative" style={{ padding: '30px' }}>
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className="transform transition-transform duration-1000"
                style={{ 
                  transform: `scale(${breatheScale})`,
                  overflow: 'visible',
                }}
              >
                <defs>
                  <filter id="timer-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="oklch(0.3 0.05 220)"
                  strokeWidth="8"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="140"
                  fill="none"
                  stroke="oklch(0.7 0.15 195)"
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 140}`}
                  strokeDashoffset={`${2 * Math.PI * 140 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 160 160)"
                  className="transition-all duration-1000"
                  filter="url(#timer-glow)"
                />
                <circle
                  cx="160"
                  cy="160"
                  r="120"
                  fill="oklch(0.7 0.15 195 / 0.05)"
                  className="animate-glow-pulse"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center" style={{ padding: '30px' }}>
                <div className="text-center">
                  <div className="text-6xl sm:text-7xl font-bold text-accent-cyan-tinted">
                    {formatTime(timeRemaining)}
                  </div>
                  <div className="text-lg sm:text-xl text-description-gray mt-2 capitalize">
                    {meditationType}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center space-y-6 w-full max-w-md">
              <Button
                onClick={togglePause}
                size="lg"
                className="rounded-full w-16 h-16 bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark shadow-glow hover:shadow-glow-lg transition-all duration-300"
              >
                {isPaused ? (
                  <Play className="w-8 h-8" fill="currentColor" />
                ) : (
                  <Pause className="w-8 h-8" fill="currentColor" />
                )}
              </Button>

              <div className="w-full max-[389px]:w-[85%] space-y-2">
                <label className="text-sm text-description-gray text-center block">
                  Volume: {volume}%
                </label>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="w-full max-[389px]:w-[85%] space-y-2">
                <label className="text-sm text-description-gray text-center block">
                  Seek: {formatTime(timeRemaining)} / {formatTime(totalTime)}
                </label>
                <Slider
                  value={[timeRemaining]}
                  onValueChange={handleTimeSeek}
                  min={0}
                  max={totalTime}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (viewState === 'reflection') {
    const currentQ = moodQuestions[currentQuestion];

    return (
      <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
        <LotusCanvas variant="premed" intensity={0.7} />

        {/* Desktop Session Indicator */}
        {mounted && (
          <div className="hidden md:block">
            <SessionIndicator />
          </div>
        )}

        {/* Desktop Theme Toggle */}
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5 text-accent-cyan" />
            ) : (
              <Moon className="h-5 w-5 text-primary-dark" />
            )}
          </button>
        )}

        {/* Mobile Hamburger Menu */}
        {mounted && <HamburgerMenu />}

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12">
          <div className="max-w-2xl mx-auto w-full space-y-8 animate-fade-in">
            <div className="text-center space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-cyan-tinted">
                Session Complete
              </h1>
              <p className="text-base sm:text-lg text-description-gray">
                Take a moment to reflect on your experience
              </p>
            </div>

            {!showEnergyQuestion && !showNotesSection ? (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {currentQ.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {currentQ.options.map((option) => {
                    const IconComponent = option.icon;
                    const isSelected = selectedMoods.includes(option.value);
                    const isDisabled = !isSelected && selectedMoods.length >= 2;
                    return (
                      <div
                        key={option.value}
                        className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all ${
                          isDisabled
                            ? 'border-border/30 opacity-50 cursor-not-allowed'
                            : isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10 cursor-pointer'
                            : 'border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/5 cursor-pointer'
                        }`}
                        onClick={() => !isDisabled && handleMoodToggle(option.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => !isDisabled && handleMoodToggle(option.value)}
                          id={option.value}
                          disabled={isDisabled}
                        />
                        <IconComponent className="w-6 h-6 text-accent-cyan shrink-0" />
                        <Label
                          htmlFor={option.value}
                          className={`text-base flex-1 ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} text-foreground`}
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleMoodNext}
                    disabled={selectedMoods.length === 0}
                    className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 py-3 rounded-full"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : showEnergyQuestion && !showNotesSection ? (
              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    {energyQuestion.question}
                  </h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {energyQuestion.options.map((option) => {
                    const IconComponent = option.icon;
                    const isSelected = selectedEnergy === option.value;
                    return (
                      <div
                        key={option.value}
                        className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                        }`}
                        onClick={() => setSelectedEnergy(option.value)}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-accent-cyan' : 'border-border'
                        }`}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-accent-cyan" />}
                        </div>
                        <IconComponent className="w-6 h-6 text-accent-cyan shrink-0" />
                        <Label
                          className="text-base cursor-pointer text-foreground flex-1"
                        >
                          {option.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleEnergyNext}
                    disabled={!selectedEnergy}
                    className="bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 py-3 rounded-full"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 space-y-4">
                  <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                    Personal Notes (Optional)
                  </h2>
                  <Textarea
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="How did this session feel? Any insights or observations you'd like to remember?"
                    className="min-h-[150px] bg-background/50 border-border/50 focus:border-accent-cyan resize-none"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                  <Button
                    onClick={() => setIsFavorite(!isFavorite)}
                    variant="outline"
                    size="lg"
                    className={`w-full sm:w-auto border-2 rounded-full transition-all duration-300 ${
                      isFavorite
                        ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20'
                        : 'border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10'
                    }`}
                  >
                    <Heart
                      className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-current' : ''}`}
                    />
                    {isFavorite ? 'Marked as Favorite' : 'Mark as Favorite'}
                  </Button>

                  <Button
                    onClick={handleSaveAsRitual}
                    variant="outline"
                    size="lg"
                    disabled={saveRitual.isPending}
                    className="w-full sm:w-auto border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 text-foreground font-semibold rounded-full transition-all duration-300"
                  >
                    <Sparkles className="w-5 h-5 mr-2 text-accent-cyan" />
                    Save this as my ritual
                  </Button>

                  <Button
                    onClick={handleSaveAndContinue}
                    size="lg"
                    className="w-full sm:w-auto bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300"
                    disabled={saveJournalEntry.isPending}
                  >
                    Save & Continue
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  // Setup view (default)
  return (
    <div className="relative min-h-screen overflow-hidden bg-background dark:bg-gradient-to-br dark:from-[#040f13] dark:to-background">
      <LotusCanvas variant="premed" intensity={0.7} />

      {/* Desktop Session Indicator */}
      {mounted && (
        <div className="hidden md:block">
          <SessionIndicator />
        </div>
      )}

      {/* Desktop Theme Toggle */}
      {mounted && (
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="hidden md:block fixed top-6 right-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="h-5 w-5 text-accent-cyan" />
          ) : (
            <Moon className="h-5 w-5 text-primary-dark" />
          )}
        </button>
      )}

      {/* Desktop Back Button */}
      <button
        onClick={handleBackToDashboard}
        className="hidden md:block fixed top-20 left-6 z-50 rounded-full bg-card/80 backdrop-blur-sm p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 border border-border/50"
        aria-label="Back to dashboard"
      >
        <ArrowLeft className="h-5 w-5 text-accent-cyan" />
      </button>

      {/* Mobile Back Button */}
      {mounted && <MobileBackButton show={true} />}

      {/* Mobile Hamburger Menu */}
      {mounted && <HamburgerMenu />}

      <main className="relative z-10 flex flex-col items-center justify-start min-h-screen px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-4xl mx-auto w-full space-y-4 sm:space-y-6 animate-fade-in mt-24">
          <div className="text-center space-y-2 sm:space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-cyan-tinted">
              {getMeditationName()} Meditation
            </h1>
            {fromQuiz && (
              <p className="text-base sm:text-lg text-accent-cyan-tinted font-medium">
                Recommended for you based on your current state
              </p>
            )}
          </div>

          <div className="space-y-6 pt-4">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground text-center">Meditation Guides</h2>
            <div className="bg-card/40 backdrop-blur-sm border border-border/50 rounded-2xl p-6 sm:p-8 shadow-lg">
              <MeditationGuideStepper steps={getGuideSteps()} />
            </div>
          </div>

          <div className="space-y-3 pt-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">Session Duration</h2>
              <p className="text-base sm:text-lg text-accent-cyan font-medium">{getDurationText()}</p>
            </div>
            <div className="space-y-3">
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                <span>5 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground text-center">
              Choose Ambient Sound
            </h2>
            <AmbientMusicCarousel 
              selectedMusic={selectedMusic} 
              onSelectMusic={setSelectedMusic}
              volume={volume}
              onVolumeChange={setVolume}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button
              size="lg"
              onClick={handleStartMeditation}
              className="w-full sm:w-auto bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark font-semibold px-8 py-6 text-lg rounded-full shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
            >
              Start Meditation
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleChangeMeditationType}
              className="w-full sm:w-auto border-2 border-accent-cyan/50 hover:border-accent-cyan hover:bg-accent-cyan/10 text-foreground font-semibold px-8 py-6 text-lg rounded-full transition-all duration-300"
            >
              Change Meditation Type
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
