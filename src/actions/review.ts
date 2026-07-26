'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { GameModeType } from '@/lib/sm2';

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

export async function recordCardReview(
  cardId: string, 
  quality: number, 
  mode?: GameModeType
) {
  try {
    const result = await fetchFromBackend('/review/record', {
      method: 'POST',
      body: JSON.stringify({ cardId, quality, mode })
    });
    
    if (result.success !== false) {
      // Revalidate paths that might show review data
      revalidatePath('/study');
      revalidatePath('/status');
      revalidatePath('/dashboard');
      revalidatePath('/leaderboard');
    }
    return result;
  } catch (error) {
    console.error('Error calling recordCardReview API:', error);
    return { success: false, error: 'Failed to record review via API' };
  }
}

export async function recordBulkCardReviews(
  reviews: Array<{ cardId: string; quality: number; mode?: GameModeType }>
) {
  try {
    const result = await fetchFromBackend('/review/record-bulk', {
      method: 'POST',
      body: JSON.stringify({ reviews })
    });

    revalidatePath('/status');
    revalidatePath('/study');
    return result;
  } catch (error) {
    console.error('Error calling recordBulkCardReviews API:', error);
    return { success: false, error: 'Failed to record bulk reviews via API' };
  }
}

export async function resetUserProgress() {
  try {
    const result = await fetchFromBackend('/review/reset', {
      method: 'POST'
    });

    revalidatePath('/status');
    revalidatePath('/study');
    return result;
  } catch (error) {
    console.error('Error calling resetUserProgress API:', error);
    return { success: false, error: 'Failed to reset progress via API' };
  }
}

export async function getStatusDashboard(targetUserId?: string) {
  try {
    const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
    return await fetchFromBackend(`/review/status${query}`, {
      method: 'GET'
    });
  } catch (error) {
    console.error('Error calling getStatusDashboard API:', error);
    return { success: false, error: 'Failed to fetch status dashboard via API' };
  }
}

export async function getUpcomingReviews(targetUserId?: string) {
  try {
    const query = targetUserId ? `?targetUserId=${targetUserId}` : '';
    return await fetchFromBackend(`/review/upcoming${query}`, {
      method: 'GET'
    });
  } catch (error) {
    console.error('Error calling getUpcomingReviews API:', error);
    return { success: false, error: 'Failed to fetch upcoming reviews via API' };
  }
}

export async function getDueCardsToReview() {
  try {
    return await fetchFromBackend('/review/due', {
      method: 'GET'
    });
  } catch (error) {
    console.error('Error calling getDueCardsToReview API:', error);
    return { success: false, error: 'Failed to fetch due cards via API' };
  }
}

export async function testReviewSingleCard(targetCardId?: string) {
  return { success: false, error: 'Not implemented in API yet' };
}

export async function testUpdateRepetitionsToTwo() {
  return { success: false, error: 'Not implemented in API yet' };
}
