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
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    const storeSettings = useVoiceStore.getState();
    const targetVolume = volumeOverride !== undefined ? volumeOverride : storeSettings.volume ?? 1.0;
    audio.volume = Math.max(0, Math.min(1, targetVolume));
    
    // Play native audio, fallback to TTS if it fails or gets blocked
    audio.play().catch((err) => {
      console.warn('Native audio failed to play, falling back to TTS:', err);
      fallbackToSpeechSynthesis(textToSpeak, volumeOverride, accent);
    });
  } else {
    fallbackToSpeechSynthesis(textToSpeak, volumeOverride, accent);
  }
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

  // Helper: find voice by name keywords, optionally filtered by lang prefix
  const getVoiceByKeywords = (keywords: string[], langPrefix?: string) => {
    return voices.find((v) => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      const matchLang = langPrefix ? lang.startsWith(langPrefix) : true;
      return matchLang && keywords.some((kw) => name.includes(kw));
    });
  };

  // Helper: find voice by exact lang code (e.g. 'en-US', 'en-GB')
  // Prefers Google voices or voices marked as 'default', as they tend to be higher quality
  const getVoiceByExactLang = (langCode: string) => {
    const langLower = langCode.toLowerCase();
    const exactMatches = voices.filter((v) => v.lang.toLowerCase().replace('_', '-') === langLower);
    if (exactMatches.length === 0) return undefined;
    // Prefer Google TTS voices (higher quality on Android)
    const googleVoice = exactMatches.find((v) => v.name.toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;
    // Prefer default voice
    const defaultVoice = exactMatches.find((v) => v.default);
    if (defaultVoice) return defaultVoice;
    return exactMatches[0];
  };

  // Helper: find any English voice that is NOT Indian English
  // This prevents falling back to en-IN which sounds very different from en-US/en-GB
  const getAnyEnglishVoiceExceptIndian = () => {
    const nonIndian = voices.filter((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      return lang.startsWith('en') && !lang.includes('in');
    });
    if (nonIndian.length === 0) return undefined;
    // Prefer US or GB English
    const usOrGb = nonIndian.find((v) => {
      const lang = v.lang.toLowerCase().replace('_', '-');
      return lang === 'en-us' || lang === 'en-gb';
    });
    if (usOrGb) return usOrGb;
    // Prefer Google voice among non-Indian English
    const googleVoice = nonIndian.find((v) => v.name.toLowerCase().includes('google'));
    if (googleVoice) return googleVoice;
    return nonIndian[0];
  };

  // Helper: last resort - any English voice at all (including en-IN)
  const getAnyEnglishVoice = () => {
    return voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('en'));
  };

  switch (selectedURI) {
    case 'uk_female':
    case 'google_tts_en-GB':
      targetLang = 'en-GB';
      targetPitch = 1.25;
      targetVoice =
        // 1. Try known desktop voice names
        getVoiceByKeywords(['hazel', 'female', 'victoria', 'google uk english female', 'georgia'], 'en') ||
        // 2. Try exact en-GB match (works on mobile)
        getVoiceByExactLang('en-GB') ||
        // 3. Any English voice except Indian
        getAnyEnglishVoiceExceptIndian() ||
        // 4. Any English voice at all
        getAnyEnglishVoice();
      break;

    case 'uk_male':
    case 'google_tts_en-GB_male':
      targetLang = 'en-GB';
      targetPitch = 0.78;
      targetVoice =
        getVoiceByKeywords(['george', 'male', 'daniel', 'oliver', 'google uk english male'], 'en') ||
        getVoiceByExactLang('en-GB') ||
        getAnyEnglishVoiceExceptIndian() ||
        getAnyEnglishVoice();
      break;

    case 'us_female':
    case 'google_tts_en-US':
      targetLang = 'en-US';
      targetPitch = 1.22;
      targetVoice =
        getVoiceByKeywords(['zira', 'female', 'samantha', 'google us english'], 'en') ||
        getVoiceByExactLang('en-US') ||
        getAnyEnglishVoiceExceptIndian() ||
        getAnyEnglishVoice();
      break;

    case 'david':
      targetLang = 'en-US';
      targetPitch = 1.0;
      targetVoice =
        getVoiceByKeywords(['david']) ||
        getVoiceByExactLang('en-US') ||
        getAnyEnglishVoiceExceptIndian() ||
        getAnyEnglishVoice();
      break;

    case 'mark':
      targetLang = 'en-US';
      targetPitch = 0.82;
      targetVoice =
        getVoiceByKeywords(['mark']) ||
        getVoiceByExactLang('en-US') ||
        getAnyEnglishVoiceExceptIndian() ||
        getAnyEnglishVoice();
      break;

    default:
      targetVoice =
        voices.find((v) => v.voiceURI === selectedURI) ||
        getVoiceByExactLang(targetLang) ||
        getAnyEnglishVoiceExceptIndian() ||
        getAnyEnglishVoice();
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

  // Safari / iOS PWA fix:
  // Calling cancel() immediately before speak() causes speak() to be ignored.
  // We check if it's currently speaking/pending.
  if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
    window.speechSynthesis.cancel();
    // Using a tiny timeout allows the cancel event to clear before speaking again
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 50);
  } else {
    window.speechSynthesis.speak(utterance);
  }
}
