'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDisplayName(newName: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Update in profiles table
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: newName })
      .eq('id', user.id);

    if (error) {
      console.error('Database update error:', error);
      throw error;
    }

    // Update auth user metadata so it syncs across the app
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: newName, name: newName }
    });

    if (authError) {
      console.error('Auth update error:', authError);
    }

    revalidatePath('/status');
    revalidatePath('/leaderboard');
    revalidatePath('/user/[id]', 'page');
    
    return { success: true };
  } catch (error) {
    console.error('Error updating display name:', error);
    return { success: false, error: 'Failed to update display name' };
  }
}
