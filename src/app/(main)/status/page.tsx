import React from 'react';
import { getStatusDashboard } from '@/actions/review';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export const revalidate = 0; // Fresh stats on each load

export default async function StatusPage() {
  const dashboard = await getStatusDashboard();

  if (!dashboard || !dashboard.profile?.id) {
    return (
      <div className="w-full max-w-7xl mx-auto py-20 px-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-white mb-4">Not Logged In</h1>
        <p className="text-muted-foreground font-semibold mb-8">Please log in to view your learning statistics and SM-2 algorithm insights.</p>
        <Link 
          href="/login" 
          className="px-6 py-3 bg-gradient-to-r from-[#4255ff] to-[#6b7bff] text-white font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
        >
          Login Now
        </Link>
      </div>
    );
  }

  redirect(`/status/${dashboard.profile.id}`);
}
