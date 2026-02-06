import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMeditationTimerOptions {
  durationMinutes: number;
  onComplete: () => void;
}

interface UseMeditationTimerReturn {
  timeRemaining: number;
  totalTime: number;
  isPaused: boolean;
  progress: number;
  togglePause: () => void;
  seekTime: (seconds: number) => void;
  formatTime: (seconds: number) => string;
}

export function useMeditationTimer({
  durationMinutes,
  onComplete,
}: UseMeditationTimerOptions): UseMeditationTimerReturn {
  const totalSeconds = durationMinutes * 60;
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasCompletedRef = useRef(false);

  // Reset timer when duration changes
  useEffect(() => {
    setTimeRemaining(totalSeconds);
    hasCompletedRef.current = false;
  }, [totalSeconds]);

  // Calculate progress (0 to 1)
  const progress = totalSeconds > 0 ? (totalSeconds - timeRemaining) / totalSeconds : 0;

  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          return 0;
        }
        return next;
      });
    }, 1000);
  }, [clearTimer]);

  // Handle completion when time reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      clearTimer();
      onComplete();
    }
  }, [timeRemaining, onComplete, clearTimer]);

  // Start/stop timer based on pause state
  useEffect(() => {
    if (!isPaused && timeRemaining > 0 && !hasCompletedRef.current) {
      startTimer();
    } else {
      clearTimer();
    }

    return () => {
      clearTimer();
    };
  }, [isPaused, timeRemaining, startTimer, clearTimer]);

  const togglePause = useCallback(() => {
    setIsPaused((prev) => !prev);
  }, []);

  const seekTime = useCallback((seconds: number) => {
    const clampedSeconds = Math.max(0, Math.min(totalSeconds, seconds));
    setTimeRemaining(clampedSeconds);
    hasCompletedRef.current = false;
  }, [totalSeconds]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    totalTime: totalSeconds,
    isPaused,
    progress,
    togglePause,
    seekTime,
    formatTime,
  };
}
