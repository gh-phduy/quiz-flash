import { useVoiceStore } from '@/store/useVoiceStore';

// Preload voices to prevent empty voices array on first call
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function playAudio(
  audioUrl?: string | null,
  textToSpeak?: string | null,
  volumeOverride?: number,
  accent?: 'US' | 'UK'
) {
  fallbackToSpeechSynthesis(textToSpeak, volumeOverride, accent);
}

export function fallbackToSpeechSynthesis(
  text?: string | null,
  volumeOverride?: number,
  accent?: 'US' | 'UK'
) {
  if (!text) return;
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const storeSettings = useVoiceStore.getState();
  const utterance = new SpeechSynthesisUtterance(text);

  const targetAccent = accent || storeSettings.preferredAccent || 'US';
  let selectedURI = storeSettings.selectedVoiceURI || 'us_female';
  if (targetAccent === 'US') {
    selectedURI = storeSettings.usVoiceURI || 'us_female';
  } else if (targetAccent === 'UK') {
    selectedURI = storeSettings.ukVoiceURI || 'uk_female';
  }
  const voices = window.speechSynthesis.getVoices();

  let targetPitch = 1.0;
  let targetLang = 'en-GB';
  let targetVoice: SpeechSynthesisVoice | undefined;

  const getVoiceByKeywords = (keywords: string[], langPrefix?: string) => {
    return voices.find((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      const matchLang = langPrefix ? lang.startsWith(langPrefix) : true;
      return matchLang && keywords.some((kw) => name.includes(kw));
    });
  };

  switch (selectedURI) {
    case 'uk_female':
    case 'google_tts_en-GB':
      targetLang = 'en-GB';
      targetPitch = 1.25;
      targetVoice =
        getVoiceByKeywords(['hazel', 'female', 'victoria', 'google uk english female', 'georgia'], 'en') ||
        voices.find((v) => v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk')) ||
        voices[0];
      break;

    case 'uk_male':
    case 'google_tts_en-GB_male':
      targetLang = 'en-GB';
      targetPitch = 0.78;
      targetVoice =
        getVoiceByKeywords(['george', 'male', 'daniel', 'oliver', 'google uk english male'], 'en') ||
        voices.find((v) => v.lang.toLowerCase().includes('gb') || v.lang.toLowerCase().includes('uk')) ||
        voices[0];
      break;

    case 'us_female':
    case 'google_tts_en-US':
      targetLang = 'en-US';
      targetPitch = 1.22;
      targetVoice =
        getVoiceByKeywords(['zira', 'female', 'samantha', 'google us english'], 'en') ||
        voices.find((v) => v.lang.toLowerCase().includes('us')) ||
        voices[0];
      break;

    case 'david':
      targetLang = 'en-US';
      targetPitch = 1.0;
      targetVoice = getVoiceByKeywords(['david']) || voices[0];
      break;

    case 'mark':
      targetLang = 'en-US';
      targetPitch = 0.82;
      targetVoice = getVoiceByKeywords(['mark']) || voices[0];
      break;

    default:
      targetVoice = voices.find((v) => v.voiceURI === selectedURI);
      break;
  }

  if (targetVoice) {
    utterance.voice = targetVoice;
    utterance.lang = targetVoice.lang || targetLang;
  } else {
    utterance.lang = targetLang;
  }

  utterance.rate = storeSettings.rate ?? 0.95;
  utterance.pitch = (storeSettings.pitch ?? 1.0) * targetPitch;

  const targetVolume =
    volumeOverride !== undefined ? volumeOverride : storeSettings.volume ?? 1.0;
  utterance.volume = Math.max(0, Math.min(1, targetVolume));

  window.speechSynthesis.speak(utterance);
}
