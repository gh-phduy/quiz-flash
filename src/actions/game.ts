
'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

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

export async function generateGameSession(setId: string, totalCardsToLearn: number = 20) {
  return await fetchFromBackend('/game/session', { method: 'POST', body: JSON.stringify({ setId, totalCardsToLearn }) });
}
export async function checkNewCardsForSession(cardIds: string[]) {
  const res = await fetchFromBackend('/game/check-new', { method: 'POST', body: JSON.stringify({ cardIds }) });
  return res.data || [];
}
export async function updateGameScores(correctCardIds: string[], incorrectCardIds: string[] = []) {
  return await fetchFromBackend('/game/scores', { method: 'POST', body: JSON.stringify({ correctCardIds, incorrectCardIds }) });
}
export async function logGameSession(params: any) {
  return await fetchFromBackend('/game/log', { method: 'POST', body: JSON.stringify(params) });
}
  