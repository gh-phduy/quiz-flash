import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceState {
  selectedVoiceURI: string | null;
  ukVoiceURI: string;
  usVoiceURI: string;
  preferredAccent: 'US' | 'UK';
  rate: number;
  pitch: number;
  volume: number;
  isOpen: boolean;

  setSelectedVoiceURI: (voiceURI: string | null) => void;
  setUkVoiceURI: (voiceURI: string) => void;
  setUsVoiceURI: (voiceURI: string) => void;
  setPreferredAccent: (accent: 'US' | 'UK') => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  setIsOpen: (isOpen: boolean) => void;
  toggleIsOpen: () => void;
  resetToDefault: () => void;
}

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set) => ({
      selectedVoiceURI: 'uk_female',
      ukVoiceURI: 'uk_female',
      usVoiceURI: 'us_female',
      preferredAccent: 'US',
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      isOpen: false,

      setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
      setUkVoiceURI: (ukVoiceURI) => set({ ukVoiceURI }),
      setUsVoiceURI: (usVoiceURI) => set({ usVoiceURI }),
      setPreferredAccent: (preferredAccent) => set({ preferredAccent }),
      setRate: (rate) => set({ rate }),
      setPitch: (pitch) => set({ pitch }),
      setVolume: (volume) => set({ volume }),
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      resetToDefault: () =>
        set({
          selectedVoiceURI: 'uk_female',
          ukVoiceURI: 'uk_female',
          usVoiceURI: 'us_female',
          preferredAccent: 'US',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
        }),
    }),
    {
      name: 'quiz-flash-voice-settings',
      partialize: (state) => ({
        selectedVoiceURI: state.selectedVoiceURI,
        ukVoiceURI: state.ukVoiceURI,
        usVoiceURI: state.usVoiceURI,
        preferredAccent: state.preferredAccent,
        rate: state.rate,
        pitch: state.pitch,
        volume: state.volume,
      }),
    }
  )
);
