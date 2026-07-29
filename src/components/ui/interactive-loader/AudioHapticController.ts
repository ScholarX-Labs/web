import { UserLoaderPreferences } from './types';

class AudioHapticManager {
  private audioContext: AudioContext | null = null;
  private isInitialized = false;

  public init() {
    if (typeof window === 'undefined') return;
    if (this.isInitialized) return;
    
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('AudioContext not supported', e);
    }
  }

  public playPopSound(preferences: UserLoaderPreferences) {
    if (!preferences.soundEnabled) return;
    this.init();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, this.audioContext.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.3);
    }
  }

  public playSuccessSound(preferences: UserLoaderPreferences) {
    if (!preferences.soundEnabled) return;
    this.init();
    
    if (this.audioContext && this.audioContext.state === 'running') {
      const osc = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
      osc.frequency.setValueAtTime(554.37, this.audioContext.currentTime + 0.1);
      osc.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);
      
      osc.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.6);
    }
  }

  public triggerPopHaptic(preferences: UserLoaderPreferences) {
    if (!preferences.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15); // Light tap
    }
  }

  public triggerSuccessHaptic(preferences: UserLoaderPreferences) {
    if (!preferences.hapticsEnabled) return;
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 50, 40]); // Success pattern
    }
  }
}

export const audioHapticController = new AudioHapticManager();
