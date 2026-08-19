'use server';

import { createClient } from '@/utils/supabase/server';

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ogbwpzclxbidlnygckfz.supabase.co/functions/v1/api';
};

async function fetchFromBackend(endpoint: string, options: RequestInit = {}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { success: false, error: 'Not authenticated' };
  }

  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  return await response.json();
}

export async function recordPoints(pointsToAdd: number) {
  return await fetchFromBackend('/study/record-points', { method: 'POST', body: JSON.stringify({ pointsToAdd }) });
}

export async function recordStudyActivity(setId: string, pointsToAdd: number, wordsInSet: number = 0, mode: string = 'flashcards') {
  return await fetchFromBackend('/study/activity', { method: 'POST', body: JSON.stringify({ setId, pointsToAdd, wordsInSet, mode }) });
}

export async function startStudySession(setId: string, mode: string) {
  return await fetchFromBackend('/study/start', { method: 'POST', body: JSON.stringify({ setId, mode }) });
}

export async function logStudySession(setId: string, durationSeconds: number, mode: string, newCardsStudied: number, reviewCardsStudied: number) {
  return await fetchFromBackend('/study/log', { method: 'POST', body: JSON.stringify({ setId, durationSeconds, mode, newCardsStudied, reviewCardsStudied }) });
}

export async function getDailyGoals(targetUserId?: string) {
  const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
  return await fetchFromBackend(`/study/goals${query}`, { method: 'GET' });
}

export async function getSetCards(setId: string) {
  try {
    const supabase = await createClient();
    const [setRes, cardsRes] = await Promise.all([
      supabase
        .from('sets')
        .select('id, title, description, is_public, user_id, created_at')
        .eq('id', setId)
        .single(),
      supabase
        .from('cards')
        .select('id, term, definition, image_url, phonetic, phonetic_uk, part_of_speech, cefr_level, audio_url, order_index')
        .eq('set_id', setId)
        .order('order_index', { ascending: true })
        .limit(500),
    ]);

    if (setRes.error) {
      return { success: false, error: setRes.error.message, set: null, cards: [] };
    }

    let author = null;
    if (setRes.data?.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .eq('id', setRes.data.user_id)
        .single();
      author = profile;
    }

    return {
      success: true,
      set: {
        ...setRes.data,
        author,
      },
      cards: cardsRes.data || [],
      error: null,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Failed to fetch set cards',
      set: null,
      cards: [],
    };
  }
}