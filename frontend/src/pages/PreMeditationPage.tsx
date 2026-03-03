import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Smile, Meh, Frown, Zap, Battery, BatteryCharging, Sparkles, Loader2, Save } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import AmbientMusicCarousel from '../components/AmbientMusicCarousel';
import MindfulnessGuide from '../components/MindfulnessGuide';
import ReflectionPhase from '../components/ReflectionPhase';
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

// Exported so other pages (e.g. JournalPage) can reuse these icon maps
export const moodIconMap: Record<MoodState, React.ComponentType<{ className?: string }>> = {
  [MoodState.calm]: Smile,
  [MoodState.anxious]: Frown,
  [MoodState.neutral]: Meh,
  [MoodState.happy]: Heart,
  [MoodState.sad]: Frown,
};

export const energyIconMap: Record<EnergyState, React.ComponentType<{ className?: string }>> = {
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
  const selectedType = validateMeditationType(search.type) as
    | 'mindfulness'
    | 'metta'
    | 'visualization'
    | 'ifs';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Reflection phase — delegated to ReflectionPhase component
  if (phase === 'reflection') {
    return (
      <ReflectionPhase
        selectedType={selectedType}
        duration={duration}
        selectedMoods={selectedMoods}
        onMoodToggle={handleMoodToggle}
        selectedEnergy={selectedEnergy}
        onEnergySelect={setSelectedEnergy}
        reflection={reflection}
        onReflectionChange={setReflection}
        isFavorite={isFavorite}
        onFavoriteChange={setIsFavorite}
        onSave={handleSaveReflection}
        isSaving={recordSession.isPending || createJournalEntry.isPending}
        onBack={() => navigate({ to: '/dashboard' })}
      />
    );
  }

  // Setup phase
  return (
    <PageBackgroundShell variant="premed">
      <StandardPageNav showBackButton onBack={handleBackNavigation} />
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 pb-10">
        <div className="w-full max-w-lg space-y-6 animate-fade-in">
          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold text-foreground">
              {formatMeditationType(selectedType)}
            </h1>
            <p className="text-muted-foreground text-sm">Prepare your session</p>
          </div>

          {/* Combined Session Controls: Duration + Ambient Sound + Action Buttons */}
          <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur-sm p-5 space-y-6">
            {/* Duration */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Duration</h3>
              <DurationRangeInput value={duration} onChange={setDuration} />
            </div>

            {/* Divider */}
            <div className="border-t border-border/30" />

            {/* Ambient Sound */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">Ambient Sound</h3>
              <AmbientMusicCarousel
                selectedMusic={selectedMusicId}
                onSelectMusic={setSelectedMusicId}
                volume={volume}
                onVolumeChange={setVolume}
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border/30" />

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveRitual}
                disabled={saveRitual.isPending}
                className="flex items-center gap-1.5"
              >
                {saveRitual.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveRitual.isPending ? 'Saving…' : 'Save Ritual'}
              </Button>
              <Button
                className="flex-1"
                size="lg"
                onClick={handleBeginMeditation}
              >
                Begin Session
              </Button>
            </div>
          </div>

          {/* Meditation Guide — moved to bottom of the page */}
          <MindfulnessGuide meditationType={selectedType} />
        </div>
      </div>
    </PageBackgroundShell>
  );
}
