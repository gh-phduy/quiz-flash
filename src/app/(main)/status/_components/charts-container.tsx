'use client';

import dynamic from 'next/dynamic';

const WeaknessChart = dynamic(() => import('./weakness-chart'), { ssr: false });
const MasteryChart = dynamic(() => import('./mastery-chart'), { ssr: false });
const UpcomingReviews = dynamic(() => import('./upcoming-reviews'), { ssr: false });

interface WeaknessBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface MasteryBreakdown {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

interface ChartsContainerProps {
  weaknessBreakdown: WeaknessBreakdown;
  masteryBreakdown: MasteryBreakdown;
  upcomingReviews: any[];
}

export default function ChartsContainer({ 
  weaknessBreakdown, 
  masteryBreakdown, 
  upcomingReviews 
}: ChartsContainerProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 h-full">
        <WeaknessChart breakdown={weaknessBreakdown} />
      </div>
      <div className="lg:col-span-4 h-full">
        <MasteryChart breakdown={masteryBreakdown} />
      </div>
      <div className="lg:col-span-4 h-full">
        <UpcomingReviews data={upcomingReviews} />
      </div>
    </div>
  );
}
