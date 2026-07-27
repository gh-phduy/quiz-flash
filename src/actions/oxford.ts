'use server';

import { createClient } from '@/utils/supabase/server';

export interface OxfordWordStats {
  id: string;
  setId: string;
  setTitle: string;
  term: string;
  definition: string;
  phonetic?: string | null;
  phoneticUk?: string | null;
  audioUrl?: string | null;
  partOfSpeech?: string | null;
  cefrLevel?: string | null;
  masteryLevel: 'new' | 'learning' | 'reviewing' | 'mastered';
  weaknessLevel: number;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  repetitions: number;
  intervalDays: number;
  nextReviewDate?: string | null;
  lastReviewedAt?: string | null;
  modeStats?: Record<string, { total: number; correct: number }>;
}

export interface OxfordSetSummary {
  id: string;
  title: string;
  description: string;
  cefrLevel: string;
  totalCards: number;
  masteredCount?: number;
  reviewingCount?: number;
  learningCount?: number;
  unstudiedCount?: number;
  masteryPercentage?: number;
  totalReviews?: number;
  correctCount?: number;
  incorrectCount?: number;
  accuracy?: number;
  weakCount?: number;
}

export interface OxfordSetAnalytics extends OxfordSetSummary {
  masteredCount: number;
  reviewingCount: number;
  learningCount: number;
  unstudiedCount: number;
  masteryPercentage: number;
  totalReviews: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  weakCount: number;
  allCards: OxfordWordStats[];
  weakCards: OxfordWordStats[];
}

export interface OxfordSummaryAnalytics {
  isLoggedIn: boolean;
  userId?: string;
  userName?: string;
  userEmail?: string;
  totalOxfordSets: number;
  totalOxfordWords: number;
  sets: OxfordSetSummary[];
}

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

export async function getOxfordSetsSummary(targetUserId?: string) {
  const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
  return await fetchFromBackend(`/oxford/summary${query}`, { method: 'GET' });
}

export async function getSetDetailsAnalytics(setId: string, targetUserId?: string) {
  const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
  return await fetchFromBackend(`/oxford/details/${setId}${query}`, { method: 'GET' });
}

export async function getOxfordAnalytics(targetUserId?: string) {
  const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
  return await fetchFromBackend(`/oxford/analytics${query}`, { method: 'GET' });
}
