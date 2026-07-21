// Preload voices to prevent empty voices array on first call
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

export function playAudio(audioUrl?: string | null, textToSpeak?: string | null) {
  // Ignore audioUrl (dictionary APIs have different speakers, causing inconsistent voices).
  // Force SpeechSynthesis for a single, consistent voice.
  fallbackToSpeechSynthesis(textToSpeak);
}

function fallbackToSpeechSynthesis(text?: string | null) {
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
  
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  if (englishVoices.length > 0) {
    // Prioritize clear US Male voices as requested previously, or clear standard US voices
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

    // Fallback if no specific voice is found
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
