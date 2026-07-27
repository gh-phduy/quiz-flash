export interface WordData {
  phonetic?: string;
  phoneticUk?: string;
  partOfSpeech?: string;
  audioUrl?: string;
  audioUrlUk?: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function fetchWordData(word: string, retries = 3): Promise<WordData | null> {
  if (!word || word.trim() === '') return null;
  
  // Clean up word (e.g. remove trailing punctuation)
  const cleanWord = word.trim().replace(/[.,!?]$/, '');
  
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    
    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        // Rate limited, wait 1s and retry
        await sleep(1000);
        return fetchWordData(word, retries - 1);
      }
      return null;
    }

    const data = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const entry = data[0];
    
    let phoneticUs = entry.phonetic || '';
    let phoneticUk = '';
    let audioUrlUs = '';
    let audioUrlUk = '';

    if (entry.phonetics && Array.isArray(entry.phonetics)) {
      for (const p of entry.phonetics) {
        const audio = p.audio || '';
        const text = p.text || '';

        if (audio.includes('-us') || audio.includes('en-us') || audio.includes('/us/')) {
          if (!audioUrlUs && audio) audioUrlUs = audio;
          if (!phoneticUs && text) phoneticUs = text;
        } else if (audio.includes('-uk') || audio.includes('en-uk') || audio.includes('/uk/')) {
          if (!audioUrlUk && audio) audioUrlUk = audio;
          if (!phoneticUk && text) phoneticUk = text;
        } else {
          if (!phoneticUs && text) phoneticUs = text;
          if (!audioUrlUs && audio) audioUrlUs = audio;
        }
      }
    }

    // Extract part of speech
    let partOfSpeech = entry.meanings?.[0]?.partOfSpeech || '';

    return {
      phonetic: phoneticUs || undefined,
      phoneticUk: phoneticUk || undefined,
      partOfSpeech: partOfSpeech || undefined,
      audioUrl: audioUrlUs || audioUrlUk || undefined,
      audioUrlUk: audioUrlUk || undefined
    };
  } catch (error) {
    if (retries > 0) {
      await sleep(1000);
      return fetchWordData(word, retries - 1);
    }
    console.error('Error fetching word data:', error);
    return null;
  }
}
