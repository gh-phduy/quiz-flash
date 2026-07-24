import React from 'react';
import SetAnalyticsDashboard from './set-analytics-dashboard';
import { Metadata } from 'next';
import { createClient } from '@/utils/supabase/server';

export const metadata: Metadata = {
  title: 'Set Analytics | QuizFlash',
  description: 'Track vocabulary mastery, spaced repetition metrics, accuracy rates, and weak word analytics across all your sets.',
};

export const revalidate = 0; // Always fetch fresh data on page visit

export default async function SetAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let createdSets: any[] = [];
  let savedSets: any[] = [];
  
  if (user) {
    const [
      { data: setsData },
      { data: userSavedSets }
    ] = await Promise.all([
      // Fetch created sets
      supabase
        .from('sets')
        .select('*, cards(count)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
        
      // Fetch saved sets
      supabase
        .from('user_saved_sets')
        .select('set_id, sets(*, cards(count))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
    ]);

    if (setsData) createdSets = setsData;
    
    if (userSavedSets && Array.isArray(userSavedSets)) {
      const rawSavedSets = userSavedSets.map((s: any) => {
        const setObj = Array.isArray(s.sets) ? s.sets[0] : s.sets;
        return setObj;
      }).filter(Boolean);

      if (rawSavedSets.length > 0) {
        const savedUserIds = [...new Set(rawSavedSets.map((s: any) => s.user_id))].filter(Boolean);
        const { data: savedProfiles } = await supabase
          .from('profiles')
          .select('id, email, avatar_url, full_name')
          .in('id', savedUserIds);

        savedSets = rawSavedSets.map((setObj: any) => ({
          ...setObj,
          author: savedProfiles?.find((p: any) => p.id === setObj.user_id) || null
        }));
      }
    }
  } else {
    // If not logged in, maybe we show public sets? Or just empty?
    // User is required to login to have library, so it will be empty
  }

  return (
    <SetAnalyticsDashboard 
      isLoggedIn={!!user}
      userId={user?.id}
      createdSets={createdSets}
      savedSets={savedSets}
    />
  );
}
