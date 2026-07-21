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
    // Look for known clear male voices across different platforms
    // Google: "Google UK English Male"
    // Windows: "Microsoft David", "Microsoft Mark"
    // Apple/macOS: "Daniel", "Alex", "Fred"
    const maleVoiceNames = ['Google UK English Male', 'David', 'Mark', 'Daniel', 'Alex', 'Fred'];
    
    let preferredVoice = englishVoices.find(v => 
      maleVoiceNames.some(name => v.name.includes(name))
    );

    // Fallback if no specific male voice is found
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
