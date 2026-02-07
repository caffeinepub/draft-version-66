import { useState, useEffect, useRef, useCallback } from 'react';

interface UseMeditationTimerOptions {
  durationMinutes: number;
  onComplete: () => void;
  autoStart?: boolean; // New option to control auto-start
}

interface UseMeditationTimerReturn {
  timeRemaining: number;
  totalTime: number;
  isPaused: boolean;
  progress: number;
  togglePause: () => void;
  start: () => void;
  reset: () => void;
  seekTime: (seconds: number) => void;
  setDuration: (minutes: number) => void;
  formatTime: (seconds: number) => string;
}

export function useMeditationTimer({
  durationMinutes,
  onComplete,
  autoStart = false,
}: UseMeditationTimerOptions): UseMeditationTimerReturn {
  const totalSeconds = durationMinutes * 60;
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [isPaused, setIsPaused] = useState(!autoStart);
  const [isStarted, setIsStarted] = useState(autoStart);
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
    if (timeRemaining === 0 && !hasCompletedRef.current && isStarted) {
      hasCompletedRef.current = true;
      clearTimer();
      onComplete();
    }
  }, [timeRemaining, onComplete, clearTimer, isStarted]);

  // Start/stop timer based on pause state and started state
  useEffect(() => {
    if (isStarted && !isPaused && timeRemaining > 0 && !hasCompletedRef.current) {
      startTimer();
    } else {
      clearTimer();
    }

    return () => {
      clearTimer();
    };
  }, [isPaused, timeRemaining, isStarted, startTimer, clearTimer]);

  const togglePause = useCallback(() => {
    if (!isStarted) {
      setIsStarted(true);
      setIsPaused(false);
    } else {
      setIsPaused((prev) => !prev);
    }
  }, [isStarted]);

  const start = useCallback(() => {
    setIsStarted(true);
    setIsPaused(false);
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(totalSeconds);
    setIsPaused(true);
    setIsStarted(false);
    hasCompletedRef.current = false;
  }, [totalSeconds, clearTimer]);

  const seekTime = useCallback((seconds: number) => {
    const clampedSeconds = Math.max(0, Math.min(totalSeconds, seconds));
    setTimeRemaining(clampedSeconds);
    hasCompletedRef.current = false;
  }, [totalSeconds]);

  const setDuration = useCallback((minutes: number) => {
    const newTotalSeconds = minutes * 60;
    // Clamp remaining time if new duration is shorter
    setTimeRemaining((prev) => Math.min(prev, newTotalSeconds));
    hasCompletedRef.current = false;
  }, []);

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
    start,
    reset,
    seekTime,
    setDuration,
    formatTime,
  };
}
