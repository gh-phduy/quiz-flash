'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface UpcomingReviewsProps {
  data: { date: string; count: number }[];
}

export default function UpcomingReviews({ data }: UpcomingReviewsProps) {
  // Format dates for display (e.g., "Jul 22")
  const formattedData = data.map(item => {
    const d = new Date(item.date);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    // Check if it's today
    const today = new Date();
    const isToday = d.toDateString() === today.toDateString();
    
    return {
      ...item,
      label: isToday ? 'Today' : label
    };
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a092d]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{label}</p>
          <p className="text-[#9fa6ff] font-mono font-bold text-lg">
            {payload[0].value} <span className="text-xs text-muted-foreground font-sans">cards due</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#9fa6ff]/10 rounded-full blur-[100px] -z-10" />
      
      <div className="flex flex-col gap-2 mb-6">
        <h3 className="text-xl font-bold text-white">Upcoming Workload</h3>
        <p className="text-xs text-muted-foreground font-semibold">Forecast of cards due for review over the next 7 days.</p>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={formattedData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#9fa6ff" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="#9fa6ff" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis 
              dataKey="label" 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              stroke="rgba(255,255,255,0.3)" 
              tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area 
              type="monotone" 
              dataKey="count" 
              stroke="#9fa6ff" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCount)" 
              activeDot={{ r: 6, fill: '#9fa6ff', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
