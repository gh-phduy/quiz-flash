import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic'; // Prevent static caching of auth state

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="w-full max-w-7xl mx-auto py-20 px-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
        <p className="text-muted-foreground font-semibold mb-8">Please log in to view your profile dashboard and SM-2 algorithm insights.</p>
        <Link 
          href="/login" 
          className="px-6 py-3 bg-gradient-to-r from-[#4255ff] to-[#6b7bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          Login Now
        </Link>
      </div>
    );
  }

  redirect(`/profile/${user.id}`);
}

