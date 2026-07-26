'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'https://ogbwpzclxbidlnygckfz.supabase.co/functions/v1/api';
};

export async function updateDisplayName(newName: string) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return { success: false, error: 'Not authenticated' };
    }

    // Call the Backend API (Edge Function)
    const backendUrl = getBackendUrl(); // Local fallback

    const response = await fetch(`${backendUrl}/profile/display-name`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ newName })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('Backend API error:', result.error);
      return { success: false, error: result.error || 'Failed to update profile' };
    }

    revalidatePath('/status');
    revalidatePath('/leaderboard');
    revalidatePath('/user/[id]', 'page');
    
    return { success: true };
  } catch (error) {
    console.error('Error calling update display name API:', error);
    return { success: false, error: 'Failed to update display name' };
  }
}
