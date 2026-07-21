'use server';

import { createClient } from '@/utils/supabase/server';

const calculateRank = (points: number): string => {
  if (points < 500) return 'Iron';
  if (points < 1200) return 'Bronze';
  if (points < 2500) return 'Silver';
  if (points < 5000) return 'Gold';
  if (points < 10000) return 'Platinum';
  if (points < 15000) return 'Emerald';
  if (points < 25000) return 'Diamond';
  if (points < 50000) return 'Master';
  if (points < 100000) return 'Grandmaster';
  return 'Challenger';
};

export async function recordPoints(pointsToAdd: number) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('points, current_streak, highest_streak, last_active_date')
      .eq('id', user.id)
      .single();

    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const lastActive = profile.last_active_date ? new Date(profile.last_active_date).toISOString().split('T')[0] : null;
      
      let newStreak = profile.current_streak || 0;
      let newHighest = profile.highest_streak || 0;

      if (lastActive !== today) {
        if (!lastActive) {
          newStreak = 1;
        } else {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (lastActive === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1; // reset
          }
        }
        if (newStreak > newHighest) newHighest = newStreak;
      }

      const newPoints = (profile.points || 0) + pointsToAdd;
      const newRank = calculateRank(newPoints);

      await supabase
        .from('profiles')
        .update({
          points: newPoints,
          current_rank: newRank,
          current_streak: newStreak,
          highest_streak: newHighest,
          last_active_date: new Date().toISOString()
        })
        .eq('id', user.id);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error in recordPoints:', error);
    return { success: false };
  }
}

export async function recordStudyActivity(setId: string, pointsToAdd: number, wordsInSet: number = 0, mode: string = 'flashcards') {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { data, error } = await supabase.rpc('record_study_activity', {
      p_user_id: user.id,
      p_set_id: setId,
      p_points_to_add: pointsToAdd,
      p_words_in_set: wordsInSet,
      p_mode: mode
    });

    if (error) {
      console.error('RPC Error:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error recording study activity:', error);
    return { success: false, error: 'Internal server error' };
  }
}
