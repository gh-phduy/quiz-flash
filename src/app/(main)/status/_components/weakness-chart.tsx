'use client';

import React from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface WeaknessBreakdown {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

interface WeaknessChartProps {
  breakdown: WeaknessBreakdown;
}

export default function WeaknessChart({ breakdown }: WeaknessChartProps) {
  const data = [
    { name: 'Level 5 (Weakest)', value: breakdown[5], color: '#4255ff' },
    { name: 'Level 4', value: breakdown[4], color: '#6b7bff' },
    { name: 'Level 3', value: breakdown[3], color: '#9fa6ff' },
    { name: 'Level 2', value: breakdown[2], color: '#b892ff' },
    { name: 'Level 1 (Strongest)', value: breakdown[1], color: '#d8b4ff' },
  ].filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#0a092d]/90 border border-white/10 p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="text-white font-bold mb-1">{data.name}</p>
          <p className="text-muted-foreground text-sm">
            Count: <span className="text-white">{data.value} cards</span>
          </p>
          <p className="text-muted-foreground text-sm">
            Ratio: <span className="text-white">{Math.round((data.value / total) * 100)}%</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-2xl p-6 md:p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden h-full flex flex-col">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#b892ff]/10 rounded-full blur-3xl -z-10" />
      
      <div className="flex flex-col gap-2 mb-2">
        <h3 className="text-xl font-bold text-white">Weakness Analysis</h3>
        <p className="text-xs text-muted-foreground font-semibold">Distribution of vocabulary by weakness levels for High-Intensity Training.</p>
      </div>

      <div className="flex-1 w-full min-h-[250px] relative mt-4">
        {total > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 5px ${entry.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-xs font-semibold text-muted-foreground">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%+18px)] flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{total}</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Cards</span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-semibold">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
}
