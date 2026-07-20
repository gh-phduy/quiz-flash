'use client';

import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';

interface MasteryBreakdown {
  new: number;
  learning: number;
  reviewing: number;
  mastered: number;
}

interface MasteryChartProps {
  breakdown: MasteryBreakdown;
}

export default function MasteryChart({ breakdown }: MasteryChartProps) {
  const total = breakdown.new + breakdown.learning + breakdown.reviewing + breakdown.mastered;

  const data = [
    { subject: 'New', A: breakdown.new, fullMark: total || 1 },
    { subject: 'Learning', A: breakdown.learning, fullMark: total || 1 },
    { subject: 'Reviewing', A: breakdown.reviewing, fullMark: total || 1 },
    { subject: 'Mastered', A: breakdown.mastered, fullMark: total || 1 },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a092d]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{data.subject}</p>
          <p className="text-muted-foreground text-sm">
            Count: <span className="text-white">{data.A} cards</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#4255ff]/10 rounded-full blur-[100px] -z-10" />
      
      <div className="flex flex-col gap-2 mb-2">
        <h3 className="text-xl font-bold text-white">Mastery Radar</h3>
        <p className="text-xs text-muted-foreground font-semibold">Evaluate your overall memorization performance across all stages.</p>
      </div>

      <div className="flex-1 w-full min-h-[250px] relative mt-4">
        {total > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
              <PolarGrid stroke="rgba(255,255,255,0.1)" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 'bold' }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
              <Radar
                name="Mastery"
                dataKey="A"
                stroke="#4255ff"
                fill="#4255ff"
                fillOpacity={0.4}
              />
              <Tooltip content={<CustomTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-semibold">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
}
