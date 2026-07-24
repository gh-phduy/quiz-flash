import React from 'react';
import { getOxfordSetsSummary } from '@/actions/oxford';
import OxfordDashboard from './oxford-dashboard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Oxford Vocabulary Analytics | QuizFlash',
  description: 'Track Oxford CEFR vocabulary mastery (A1 - C1), spaced repetition metrics, accuracy rates, and weak word analytics.',
};

export const revalidate = 0; // Always fetch fresh review analytics on page visit

export default async function OxfordPage() {
  const analytics = await getOxfordSetsSummary();

  return <OxfordDashboard analytics={analytics} />;
}
