'use server';

import { createClient } from '@/utils/supabase/server';

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
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