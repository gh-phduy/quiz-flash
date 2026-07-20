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
  const allData = [
    { name: 'Level 5 (Weakest)', level: 5, value: breakdown[5], color: '#4255ff' },
    { name: 'Level 4', level: 4, value: breakdown[4], color: '#6b7bff' },
    { name: 'Level 3', level: 3, value: breakdown[3], color: '#9fa6ff' },
    { name: 'Level 2', level: 2, value: breakdown[2], color: '#b892ff' },
    { name: 'Level 1 (Strongest)', level: 1, value: breakdown[1], color: '#d8b4ff' },
  ];

  const data = allData.filter(item => item.value > 0);
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[#b892ff]/10 rounded-full blur-[100px] -z-10" />
      
      <div className="flex flex-col gap-2 mb-2">
        <h3 className="text-xl font-bold text-white">Weakness Analysis</h3>
        <p className="text-xs text-muted-foreground font-semibold">Distribution of vocabulary by weakness levels for High-Intensity Training.</p>
      </div>

      <div className="flex-1 w-full relative mt-4 flex items-center justify-center">
        {total > 0 ? (
          <div className="flex flex-col items-center justify-center w-full gap-6 md:gap-8 px-2">
            
            {/* Chart Section */}
            <div className="relative w-[180px] h-[180px] md:w-[220px] md:h-[220px] flex-shrink-0">
              <PieChart width={220} height={220} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-[0.8] md:scale-100 origin-center">
                <Pie
                  data={data}
                  cx={110}
                  cy={110}
                  innerRadius={70}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ filter: `drop-shadow(0px 0px 8px ${entry.color}80)` }} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
              {/* Center Text */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl md:text-4xl font-bold text-white">{total}</span>
                <span className="text-[9px] md:text-[10px] text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Cards</span>
              </div>
            </div>
            
            {/* Legend Section */}
            <div className="flex flex-col justify-center space-y-3.5 w-full max-w-[240px] shrink-1">
              {allData.map((item) => (
                <div key={item.level} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3.5 h-3.5 rounded-full transition-transform group-hover:scale-125 shrink-0"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}80` }}
                    />
                    <span className="text-sm font-semibold text-muted-foreground group-hover:text-white transition-colors truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="min-w-[36px] flex items-center justify-center bg-white/5 px-2 py-1 rounded-md border border-white/5 shrink-0 ml-3">
                    <span className="text-sm font-bold text-white">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>

          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-muted-foreground text-sm font-semibold">No data available</span>
          </div>
        )}
      </div>
    </div>
  );
}
