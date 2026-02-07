// Singleton ambient audio manager to ensure only one audio instance exists globally
class AmbientAudioManager {
  private audio: HTMLAudioElement | null = null;
  private currentSoundId: string | null = null;

  play(soundPath: string, soundId: string, volume: number = 0.5, loop: boolean = true): void {
    // If already playing the same sound, just adjust volume
    if (this.audio && this.currentSoundId === soundId) {
      this.audio.volume = volume;
      return;
    }

    // Stop any existing audio
    this.stop();

    // Create new audio instance
    this.audio = new Audio(soundPath);
    this.audio.loop = loop;
    this.audio.volume = volume;
    this.currentSoundId = soundId;

    this.audio.play().catch((err) => {
      console.error('Audio play error:', err);
    });
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  resume(): void {
    if (this.audio) {
      this.audio.play().catch((err) => {
        console.error('Audio resume error:', err);
      });
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      this.audio = null;
      this.currentSoundId = null;
    }
  }

  fadeOut(duration: number = 1000, callback?: () => void): void {
    if (!this.audio) {
      callback?.();
      return;
    }

    const startVolume = this.audio.volume;
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = startVolume / steps;

    let currentStep = 0;
    const fadeInterval = setInterval(() => {
      currentStep++;
      if (this.audio && currentStep < steps) {
        this.audio.volume = Math.max(0, startVolume - volumeStep * currentStep);
      } else {
        clearInterval(fadeInterval);
        this.stop();
        callback?.();
      }
    }, stepDuration);
  }

  isPlaying(): boolean {
    return this.audio !== null && !this.audio.paused;
  }

  getCurrentSoundId(): string | null {
    return this.currentSoundId;
  }
}

// Export singleton instance
export const ambientAudioManager = new AmbientAudioManager();
