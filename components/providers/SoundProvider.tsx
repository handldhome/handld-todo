'use client';

import { createContext, useContext, useCallback, useRef } from 'react';
import { useSettingsStore } from '@/lib/stores/settingsStore';

interface SoundContextType {
  playComplete: () => void;
  playDelete: () => void;
}

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const { soundEnabled } = useSettingsStore();
  const audioContextRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playComplete = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Create a pleasant "ding" sound for completion
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Two-tone chime (G5 to C6)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(784, now); // G5
      oscillator.frequency.setValueAtTime(1047, now + 0.1); // C6

      // Envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }, [soundEnabled, getAudioContext]);

  const playDelete = useCallback(() => {
    if (!soundEnabled) return;

    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;

      // Create a soft "swoosh" sound for deletion
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      oscillator.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);

      // Descending tone (A4 to E4)
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now); // A4
      oscillator.frequency.exponentialRampToValueAtTime(330, now + 0.15); // E4

      // Low-pass filter for softer sound
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, now);
      filter.frequency.exponentialRampToValueAtTime(500, now + 0.15);

      // Envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (e) {
      // Silently fail if audio isn't available
    }
  }, [soundEnabled, getAudioContext]);

  return (
    <SoundContext.Provider value={{ playComplete, playDelete }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const context = useContext(SoundContext);
  if (context === undefined) {
    throw new Error('useSound must be used within a SoundProvider');
  }
  return context;
}
