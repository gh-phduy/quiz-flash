import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface VoiceState {
  selectedVoiceURI: string | null;
  rate: number;
  pitch: number;
  volume: number;
  isOpen: boolean;

  setSelectedVoiceURI: (voiceURI: string | null) => void;
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
      rate: 0.95,
      pitch: 1.0,
      volume: 1.0,
      isOpen: false,

      setSelectedVoiceURI: (selectedVoiceURI) => set({ selectedVoiceURI }),
      setRate: (rate) => set({ rate }),
      setPitch: (pitch) => set({ pitch }),
      setVolume: (volume) => set({ volume }),
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleIsOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      resetToDefault: () =>
        set({
          selectedVoiceURI: 'uk_female',
          rate: 0.95,
          pitch: 1.0,
          volume: 1.0,
        }),
    }),
    {
      name: 'quiz-flash-voice-settings',
      partialize: (state) => ({
        selectedVoiceURI: state.selectedVoiceURI,
        rate: state.rate,
        pitch: state.pitch,
        volume: state.volume,
      }),
    }
  )
);
