import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Moon, Sun, ArrowLeft, Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging } from 'lucide-react';
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
import { useMeditationTypes, useRecordSession, useSaveJournalEntry } from '../hooks/useQueries';
import type { MeditationType, MoodState, EnergyState } from '../backend';

const detailedGuides: Record<string, { steps: Array<{ title: string; content: string }> }> = {
  mindfulness: {
    steps: [
      {
        title: 'Find Your Posture',
        content: 'Sit comfortably with your back straight but not rigid. You can sit on a chair with feet flat on the floor or cross-legged on a cushion. Rest your hands gently on your lap or knees.',
      },
      {
        title: 'Begin with Breath Awareness',
        content: 'Close your eyes gently or maintain a soft downward gaze. Bring your attention to your natural breath. Notice the sensation of air entering and leaving your nostrils.',
      },
      {
        title: 'Anchor in the Present',
        content: 'When your mind wanders—and it will—gently acknowledge the thought without judgment and return your focus to your breath. This is the practice.',
      },
      {
        title: 'Transition Mindfully',
        content: 'When ready to end, slowly deepen your breath, gently move your fingers and toes, and open your eyes. Take a moment to notice how you feel.',
      },
    ],
  },
  metta: {
    steps: [
      {
        title: 'Settle into Comfort',
        content: 'Sit in a comfortable position with your spine upright. Place your hands over your heart or rest them gently on your lap. Maintain a gentle, soft expression.',
      },
      {
        title: 'Begin with Yourself',
        content: 'Start by directing loving-kindness toward yourself. Silently repeat: "May I be happy. May I be healthy. May I be safe. May I live with ease."',
      },
      {
        title: 'Extend to Others',
        content: 'Bring to mind someone you care about deeply. Visualize them clearly and direct the same phrases toward them with warmth and compassion.',
      },
      {
        title: 'Rest in Loving-Kindness',
        content: 'Conclude by resting in the warm feeling of universal compassion. Notice any shifts in your emotional state before gently opening your eyes.',
      },
    ],
  },
  visualization: {
    steps: [
      {
        title: 'Create Your Sacred Space',
        content: 'Find a quiet, comfortable space where you won\'t be disturbed. You can sit or lie down—whatever helps you relax most deeply. Close your eyes gently.',
      },
      {
        title: 'Deepen Your Relaxation',
        content: 'Take several slow, deep breaths. With each exhale, release tension from your body. Feel yourself becoming heavier and more relaxed.',
      },
      {
        title: 'Build Your Mental Sanctuary',
        content: 'Begin to visualize a peaceful place—perhaps a beach, forest, mountain, or garden. Make it as vivid as possible. Notice the colors, the light, the details.',
      },
      {
        title: 'Return Gently',
        content: 'When ready, slowly bring your awareness back to your physical body. Wiggle your fingers and toes, take a deep breath, and open your eyes.',
      },
    ],
  },
  ifs: {
    steps: [
      {
        title: 'Ground Yourself',
        content: 'Sit or lie down in a comfortable position. Keep your body relaxed and open. You might place one hand on your heart and one on your belly.',
      },
      {
        title: 'Cultivate Self-Compassion',
        content: 'Begin by acknowledging that all parts of you are welcome in this practice. Approach yourself with curiosity and kindness, not judgment.',
      },
      {
        title: 'Meet Your Parts',
        content: 'If a particular emotion or thought feels strong, imagine it as a "part" of you. Ask it: "What do you want me to know?" Listen with an open heart.',
      },
      {
        title: 'Integrate and Harmonize',
        content: 'Recognize that you are more than any single part—you are the compassionate awareness that can hold all parts with love. Rest in this wholeness.',
      },
    ],
  },
};

type ViewState = 'setup' | 'active' | 'reflection';

export default function PreMeditationPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as { type?: string; fromQuiz?: boolean };
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(15);
  const [selectedMusic, setSelectedMusic] = useState('soothing');
  const [volume, setVolume] = useState(50);
  const [viewState, setViewState] = useState<ViewState>('setup');
  
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

  useEffect(() => {
    setMounted(true);
  }, []);

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
      question: 'How are you feeling right now? (Select all that apply)',
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
        return prev.filter((m) => m !== mood);
      } else {
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

  const handleSaveAndContinue = () => {
    // Save to journal using backend/local storage with multiple moods and energy state
    saveJournalEntry.mutate({
      meditationType: meditationType as MeditationType,
      duration: BigInt(duration),
      mood: selectedMoods.length > 0 ? selectedMoods : ['neutral' as MoodState],
      energy: selectedEnergy || ('balanced' as EnergyState),
      reflection: personalNotes,
      isFavorite,
    });

    navigate({ to: '/dashboard' });
  };

  // Render based on view state
  if (viewState === 'active') {
    const progress = ((totalTime - timeRemaining) / totalTime) * 100;
    const breatheScale = 1 + Math.sin(Date.now() / 2000) * 0.05;

    return (
      <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#040f13] to-background">
        <div className="fixed top-0 left-0 w-96 h-96 opacity-5 pointer-events-none">
          <LotusCanvas />
        </div>
        <div className="fixed bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
          <LotusCanvas />
        </div>

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
            <div className="relative">
              <svg
                width="320"
                height="320"
                viewBox="0 0 320 320"
                className="transform transition-transform duration-1000"
                style={{ transform: `scale(${breatheScale})` }}
              >
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
                  style={{
                    filter: 'drop-shadow(0 0 20px oklch(0.7 0.15 195 / 0.5))',
                  }}
                />
                <circle
                  cx="160"
                  cy="160"
                  r="120"
                  fill="oklch(0.7 0.15 195 / 0.05)"
                  className="animate-glow-pulse"
                />
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#040f13] to-background">
        <div className="fixed top-0 left-0 w-96 h-96 opacity-5 pointer-events-none">
          <LotusCanvas />
        </div>
        <div className="fixed bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
          <LotusCanvas />
        </div>

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
                    return (
                      <div
                        key={option.value}
                        className={`relative flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent-cyan bg-accent-cyan/10'
                            : 'border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                        }`}
                        onClick={() => handleMoodToggle(option.value)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleMoodToggle(option.value)}
                          id={option.value}
                        />
                        <IconComponent className="w-6 h-6 text-accent-cyan flex-shrink-0" />
                        <Label
                          htmlFor={option.value}
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
                        <IconComponent className="w-6 h-6 text-accent-cyan flex-shrink-0" />
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
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#040f13] to-background">
      <div className="fixed top-0 left-0 w-96 h-96 opacity-5 pointer-events-none">
        <LotusCanvas />
      </div>
      <div className="fixed bottom-0 right-0 w-96 h-96 opacity-5 pointer-events-none">
        <LotusCanvas />
      </div>

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

          <div className="space-y-6 pt-2">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-8">Meditation Guide</h2>
            <div className="space-y-8">
              {getGuideSteps().map((step, index) => (
                <div key={index} className="flex gap-4 items-start">
                  <div 
                    className="flex-shrink-0 w-12 h-12 rounded-full bg-accent-cyan/20 border-2 border-accent-cyan flex items-center justify-center"
                    style={{
                      boxShadow: '0 0 12px oklch(0.7 0.15 195 / 0.4)',
                    }}
                  >
                    <span className="text-accent-cyan font-bold text-lg">{index + 1}</span>
                  </div>
                  
                  <div className="flex-1 space-y-2 pt-1">
                    <h3 className="text-lg sm:text-xl font-semibold text-accent-cyan">{step.title}</h3>
                    <p className="text-sm sm:text-base text-selected-element-light dark:text-guide-text leading-relaxed">{step.content}</p>
                  </div>
                </div>
              ))}
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
