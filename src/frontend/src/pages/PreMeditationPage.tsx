import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, ExternalLink } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useNavigate, useSearch } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MeditationGuideStepper from '../components/MeditationGuideStepper';
import PageBackgroundShell from '../components/PageBackgroundShell';
import StandardPageNav from '../components/StandardPageNav';
import { useMeditationTimer } from '../hooks/useMeditationTimer';
import { useMeditationTypes, useRecordSession, useSaveJournalEntry, useSaveRitual } from '../hooks/useQueries';
import { useProgressStats } from '../hooks/useQueries';
import type { MeditationType, MoodState, EnergyState } from '../backend';
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
  const navigate = useNavigate();
  const search = useSearch({ from: '/pre-meditation' }) as PreMeditationSearch;
  const [mounted, setMounted] = useState(false);
  const [duration, setDuration] = useState(search.ritualDuration || 15);
  const [selectedMusic, setSelectedMusic] = useState(search.ritualSound || 'soothing');
  const [volume, setVolume] = useState(search.ritualVolume || 50);
  const [viewState, setViewState] = useState<ViewState>(search.instantStart ? 'active' : 'setup');
  
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
  const saveJournalEntry = useSaveJournalEntry();
  const saveRitual = useSaveRitual();

  // Timer hook
  const timer = useMeditationTimer({
    durationMinutes: duration,
    onComplete: handleMeditationComplete,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

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
    setViewState('active');

    // Start audio
    const audio = new Audio(getMusicFile(selectedMusic));
    audio.loop = true;
    audio.volume = volume / 100;
    audio.play().catch((error) => {
      console.log('Audio autoplay prevented:', error);
    });
    audioRef.current = audio;
  };

  function handleMeditationComplete() {
    // Fade out ambient music smoothly and stop completely
    fadeOutAndStop();

    // Record the session immediately with proper parameters
    const monthlyMinutes = progressStats ? Number(progressStats.monthlyMinutes) : 0;
    const currentStreak = progressStats ? Number(progressStats.currentStreak) : 0;
    
    recordSession.mutate({
      minutes: duration,
      monthlyMinutes,
      currentStreak,
    });

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
  }

  const handleTogglePause = () => {
    timer.togglePause();
    if (timer.isPaused) {
      // Resuming
      if (audioRef.current) {
        audioRef.current.play().catch((error) => {
          console.log('Audio play prevented:', error);
        });
      }
    } else {
      // Pausing
      if (audioRef.current) {
        audioRef.current.pause();
      }
    }
  };

  const handleTimeSeek = (value: number[]) => {
    timer.seekTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
  };

  const handleBackToDashboard = () => {
    stopAllAudio();
    navigate({ to: '/dashboard' });
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
    if (selectedMoods.length === 0 || !selectedEnergy) {
      toast.error('Please answer all required questions');
      return;
    }

    try {
      await saveJournalEntry.mutateAsync({
        meditationType: meditationType as MeditationType,
        duration,
        mood: selectedMoods,
        energy: selectedEnergy,
        reflection: personalNotes,
        isFavorite,
      });

      toast.success('Reflection saved successfully!');
      
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1000);
    } catch (error: any) {
      const message = getCloudSyncErrorMessage(error);
      toast.error(message);
    }
  };

  // SETUP VIEW
  if (viewState === 'setup') {
    return (
      <PageBackgroundShell>
        <StandardPageNav />
        <main className="relative z-10 min-h-screen px-3 sm:px-4 py-16 sm:py-20">
          <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            {/* Header */}
            <div className="text-center space-y-3">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-accent-cyan-tinted">
                {getMeditationName()} Meditation
              </h1>
              <p className="text-base sm:text-lg text-description-gray">
                Prepare your practice
              </p>
            </div>

            {/* Guide Stepper */}
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/30">
              <MeditationGuideStepper steps={getGuideSteps()} />
              <div className="mt-4 text-center">
                <Button
                  onClick={handleMoreDetails}
                  variant="ghost"
                  size="sm"
                  className="text-accent-cyan hover:text-accent-cyan/80 hover:bg-accent-cyan/10"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  More details
                </Button>
              </div>
            </div>

            {/* Duration Selection */}
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/30 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base sm:text-lg font-semibold text-foreground">Duration</Label>
                <span className="text-xl sm:text-2xl font-bold text-accent-cyan">{duration} min</span>
              </div>
              <Slider
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
                min={5}
                max={60}
                step={5}
                className="w-full"
              />
              <p className="text-xs sm:text-sm text-description-gray text-center">{getDurationText()}</p>
            </div>

            {/* Ambient Music Selection */}
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-6 border border-border/30 space-y-4">
              <Label className="text-base sm:text-lg font-semibold text-foreground block text-center">
                Ambient Sound
              </Label>
              <AmbientMusicCarousel
                selectedMusic={selectedMusic}
                onSelectMusic={setSelectedMusic}
                volume={volume}
                onVolumeChange={setVolume}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
              <Button
                onClick={handleStartMeditation}
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark shadow-glow hover:shadow-glow-strong transition-all duration-300 hover:scale-105"
              >
                <Play className="w-5 h-5 mr-2" />
                Begin Meditation
              </Button>
              <Button
                onClick={handleBackToDashboard}
                variant="outline"
                size="lg"
                className="w-full sm:w-auto px-6 sm:px-10 py-5 sm:py-6 text-base sm:text-lg font-bold rounded-full border-2 border-accent-cyan/60 text-accent-cyan hover:bg-accent-cyan hover:text-primary-dark transition-all duration-300"
              >
                Back to Dashboard
              </Button>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // ACTIVE MEDITATION VIEW
  if (viewState === 'active') {
    const glowIntensity = Math.min(timer.progress * 1.5, 1);
    const circumference = 2 * Math.PI * 140;
    const strokeDashoffset = circumference * (1 - timer.progress);

    return (
      <PageBackgroundShell>
        <StandardPageNav />
        <main className="relative z-10 min-h-screen flex flex-col items-center justify-center px-3 sm:px-4 py-8">
          <div className="max-w-2xl mx-auto w-full space-y-8 sm:space-y-12">
            {/* Session Info */}
            <div className="text-center space-y-2">
              <h2 className="text-xl sm:text-2xl font-semibold text-accent-cyan-tinted">
                {getMeditationName()} Session
              </h2>
              <p className="text-sm sm:text-base text-description-gray">
                {getAmbientSoundName(selectedMusic)} • {duration} minutes
              </p>
            </div>

            {/* Circular Timer */}
            <div className="flex items-center justify-center">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80">
                {/* Background circle */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="140"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    className="text-border/30"
                  />
                  {/* Progress circle with glow */}
                  <circle
                    cx="50%"
                    cy="50%"
                    r="140"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    className="text-accent-cyan transition-all duration-1000 ease-linear"
                    style={{
                      filter: `drop-shadow(0 0 ${4 + glowIntensity * 8}px oklch(0.75 0.15 195))`,
                    }}
                  />
                </svg>

                {/* Timer display */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl sm:text-6xl font-bold text-accent-cyan-tinted tabular-nums">
                    {timer.formatTime(timer.timeRemaining)}
                  </div>
                  <div className="text-sm sm:text-base text-description-gray mt-2">
                    {timer.isPaused ? 'Paused' : 'Remaining'}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-6">
              {/* Play/Pause Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleTogglePause}
                  size="lg"
                  variant="outline"
                  className="rounded-full w-16 h-16 sm:w-20 sm:h-20 border-2 border-accent-cyan/60 hover:border-accent-cyan hover:bg-accent-cyan/10 transition-all duration-300"
                >
                  {timer.isPaused ? (
                    <Play className="w-7 h-7 sm:w-9 sm:h-9 text-accent-cyan" />
                  ) : (
                    <Pause className="w-7 h-7 sm:w-9 sm:h-9 text-accent-cyan" />
                  )}
                </Button>
              </div>

              {/* Volume Control */}
              <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/30">
                <Label className="text-sm font-medium text-foreground mb-3 block">Volume</Label>
                <Slider
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              {/* Time Seek */}
              <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-5 border border-border/30">
                <Label className="text-sm font-medium text-foreground mb-3 block">Seek Time</Label>
                <Slider
                  value={[timer.timeRemaining]}
                  onValueChange={handleTimeSeek}
                  min={0}
                  max={timer.totalTime}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </main>
      </PageBackgroundShell>
    );
  }

  // REFLECTION VIEW
  return (
    <PageBackgroundShell>
      <StandardPageNav />
      <main className="relative z-10 min-h-screen px-3 sm:px-4 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-accent-cyan-tinted">Session Complete</h1>
            <p className="text-base sm:text-lg text-description-gray">
              Take a moment to reflect on your practice
            </p>
          </div>

          {/* Mood Question */}
          {currentQuestion === 0 && (
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-border/30 space-y-5 animate-slide-in-right">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">How are you feeling?</h3>
              <p className="text-sm text-description-gray">Select all that apply</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { mood: 'calm' as MoodState, icon: Smile, label: 'Calm', color: 'text-green-500' },
                  { mood: 'happy' as MoodState, icon: Smile, label: 'Happy', color: 'text-yellow-500' },
                  { mood: 'neutral' as MoodState, icon: Meh, label: 'Neutral', color: 'text-gray-500' },
                  { mood: 'anxious' as MoodState, icon: Frown, label: 'Anxious', color: 'text-orange-500' },
                  { mood: 'sad' as MoodState, icon: Frown, label: 'Sad', color: 'text-blue-500' },
                ].map(({ mood, icon: Icon, label, color }) => (
                  <button
                    key={mood}
                    onClick={() => handleMoodToggle(mood)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                      ${
                        selectedMoods.includes(mood)
                          ? 'border-accent-cyan bg-accent-cyan/10 scale-105'
                          : 'border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                      }
                    `}
                  >
                    <Icon className={`w-8 h-8 sm:w-10 sm:h-10 mb-2 ${color}`} />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleNextQuestion}
                disabled={selectedMoods.length === 0}
                size="lg"
                className="w-full px-6 py-5 text-base font-bold rounded-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          )}

          {/* Energy Question */}
          {showEnergyQuestion && currentQuestion === 1 && (
            <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-border/30 space-y-5 animate-slide-in-right">
              <h3 className="text-lg sm:text-xl font-semibold text-foreground">What's your energy level?</h3>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {[
                  { energy: 'tired' as EnergyState, icon: Battery, label: 'Tired' },
                  { energy: 'balanced' as EnergyState, icon: BatteryCharging, label: 'Balanced' },
                  { energy: 'energized' as EnergyState, icon: Zap, label: 'Energized' },
                  { energy: 'restless' as EnergyState, icon: Sparkles, label: 'Restless' },
                ].map(({ energy, icon: Icon, label }) => (
                  <button
                    key={energy}
                    onClick={() => setSelectedEnergy(energy)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-300
                      ${
                        selectedEnergy === energy
                          ? 'border-accent-cyan bg-accent-cyan/10 scale-105'
                          : 'border-border/50 hover:border-accent-cyan/50 hover:bg-accent-cyan/5'
                      }
                    `}
                  >
                    <Icon className="w-8 h-8 sm:w-10 sm:h-10 mb-2 text-accent-cyan" />
                    <span className="text-sm font-medium text-foreground">{label}</span>
                  </button>
                ))}
              </div>
              <Button
                onClick={handleNextQuestion}
                disabled={!selectedEnergy}
                size="lg"
                className="w-full px-6 py-5 text-base font-bold rounded-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </Button>
            </div>
          )}

          {/* Notes Section */}
          {showNotesSection && currentQuestion === 2 && (
            <div className="space-y-5 animate-slide-in-right">
              <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-border/30 space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-foreground">Personal Notes (Optional)</h3>
                <Textarea
                  value={personalNotes}
                  onChange={(e) => setPersonalNotes(e.target.value)}
                  placeholder="Any insights, thoughts, or observations from your practice..."
                  className="min-h-[120px] resize-none bg-background/50 border-border/50 focus:border-accent-cyan"
                />
              </div>

              <div className="bg-card/40 backdrop-blur-sm rounded-2xl p-5 sm:p-6 border border-border/30">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="favorite"
                    checked={isFavorite}
                    onCheckedChange={(checked) => setIsFavorite(checked as boolean)}
                    className="border-accent-cyan/50 data-[state=checked]:bg-accent-cyan data-[state=checked]:border-accent-cyan"
                  />
                  <Label
                    htmlFor="favorite"
                    className="text-base font-medium text-foreground cursor-pointer flex items-center gap-2"
                  >
                    <Heart className="w-5 h-5 text-accent-cyan" />
                    Mark as Favorite
                  </Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handleSaveReflection}
                  disabled={saveJournalEntry.isPending}
                  size="lg"
                  className="w-full px-6 py-5 text-base font-bold rounded-full bg-accent-cyan hover:bg-accent-cyan/90 text-primary-dark shadow-glow hover:shadow-glow-strong transition-all duration-300"
                >
                  {saveJournalEntry.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save & Continue'
                  )}
                </Button>
                <Button
                  onClick={handleSaveRitual}
                  disabled={saveRitual.isPending}
                  variant="outline"
                  size="lg"
                  className="w-full px-6 py-5 text-base font-bold rounded-full border-2 border-accent-cyan/60 text-accent-cyan hover:bg-accent-cyan hover:text-primary-dark transition-all duration-300"
                >
                  {saveRitual.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Save as Ritual
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </PageBackgroundShell>
  );
}
