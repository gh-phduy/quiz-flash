export function playAudio(audioUrl?: string | null, textToSpeak?: string | null) {
  // If there's an audio URL from the dictionary, play it directly
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(e => {
        console.warn('Failed to play audio URL, falling back to synthesis:', e);
        fallbackToSpeechSynthesis(textToSpeak);
      });
      return;
    } catch (e) {
      console.warn('Error creating Audio object, falling back to synthesis:', e);
      fallbackToSpeechSynthesis(textToSpeak);
      return;
    }
  }

  // Otherwise, use Web Speech API
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
  
  // Try to find a natural-sounding English voice
  const voices = window.speechSynthesis.getVoices();
  const englishVoices = voices.filter(v => v.lang.startsWith('en'));
  
  if (englishVoices.length > 0) {
    // Prefer Google US English or standard US English
    const preferredVoice = englishVoices.find(v => v.name.includes('Google') || v.name.includes('Siri')) 
      || englishVoices.find(v => v.lang === 'en-US') 
      || englishVoices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
  }

  window.speechSynthesis.speak(utterance);
}
