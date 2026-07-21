// Preload voices to prevent empty voices array on first call
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function playAudio(audioUrl?: string | null, textToSpeak?: string | null, volume: number = 1.0) {
  fallbackToSpeechSynthesis(textToSpeak, volume);
}

function fallbackToSpeechSynthesis(text?: string | null, volume: number = 1.0) {
  if (!text) return;
  if (!('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis API not supported in this browser.');
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95; // Slightly slower for clear pronunciation
  utterance.pitch = 1.0;
  utterance.volume = Math.max(0, Math.min(1, volume));
  
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  if (englishVoices.length > 0) {
    const preferredVoiceNames = [
      'Google US English', // Chrome
      'Microsoft David', // Windows US Male
      'Microsoft Mark', // Windows US Male
      'Alex', // macOS US Male
      'Fred', // macOS US Male
      'Daniel' // macOS UK Male (fallback)
    ];
    
    let preferredVoice = englishVoices.find(v => 
      preferredVoiceNames.some(name => v.name.includes(name))
    );

    if (!preferredVoice) {
      preferredVoice = englishVoices.find(v => v.lang === 'en-US' && v.name.toLowerCase().includes('male'))
        || englishVoices.find(v => v.lang === 'en-US') 
        || englishVoices[0];
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}
