export interface WordData {
  phonetic?: string;
  audioUrl?: string;
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
    
    // Extract phonetic
    let phonetic = entry.phonetic;
    if (!phonetic && entry.phonetics && entry.phonetics.length > 0) {
      const phoneticEntry = entry.phonetics.find((p: any) => p.text);
      if (phoneticEntry) {
        phonetic = phoneticEntry.text;
      }
    }

    // Extract audio url
    let audioUrl = '';
    if (entry.phonetics && entry.phonetics.length > 0) {
      // Prioritize US, then UK, then any audio
      const usAudio = entry.phonetics.find((p: any) => p.audio && p.audio.includes('-us.mp3'));
      const ukAudio = entry.phonetics.find((p: any) => p.audio && p.audio.includes('-uk.mp3'));
      const anyAudio = entry.phonetics.find((p: any) => p.audio);
      
      if (usAudio) audioUrl = usAudio.audio;
      else if (ukAudio) audioUrl = ukAudio.audio;
      else if (anyAudio) audioUrl = anyAudio.audio;
    }

    return {
      phonetic,
      audioUrl
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
