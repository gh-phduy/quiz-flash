'use client';

import React from 'react';
import { format, subDays, startOfWeek, addDays, getDay, isSameDay } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface ActivityData {
  study_date: string;
  points_earned: number;
  words_learned: number;
}

interface ActivityGraphProps {
  data: ActivityData[];
}

export function ActivityGraph({ data }: ActivityGraphProps) {
  // Generate last 365 days
  const today = new Date();
  const startDate = startOfWeek(subDays(today, 364)); // Start from the beginning of the week 364 days ago
  
  const days = [];
  let currentDate = startDate;
  
  while (currentDate <= today) {
    days.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }

  // Create a map for fast lookup
  const activityMap = new Map(
    data.map(d => [d.study_date, d])
  );

  const getIntensity = (points: number) => {
    if (points === 0) return 0;
    if (points < 500) return 1;
    if (points < 1500) return 2;
    if (points < 3000) return 3;
    return 4;
  };

  const getColor = (intensity: number) => {
    switch (intensity) {
      case 0: return 'bg-white/5';
      case 1: return 'bg-[#4255ff]/40';
      case 2: return 'bg-[#4255ff]';
      case 3: return 'bg-[#6d7bff]';
      case 4: return 'bg-[#b892ff]';
      default: return 'bg-white/5';
    }
  };

  // Group into weeks (columns)
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];
  
  days.forEach((day, i) => {
    currentWeek.push(day);
    if (getDay(day) === 6 || i === days.length - 1) { // Saturday ends the week
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const monthLabels: { text: string; index: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, i) => {
    // Lấy tháng của ngày đầu tiên trong tuần
    const month = week[0].getMonth();
    // Tránh việc nhãn tháng bị dính sát nhau nếu tuần đầu và tuần thứ 2 khác tháng (ví dụ 30/11 và 1/12)
    if (month !== lastMonth && (i === 0 || i - (monthLabels[monthLabels.length - 1]?.index || -5) > 3)) {
      monthLabels.push({ text: format(week[0], 'MMM'), index: i });
      lastMonth = month;
    }
  });

  return (
    <div className="w-full bg-[#0a092d]/50 border border-white/10 rounded-xl p-6">
      <h3 className="text-xl font-bold text-white mb-4">Study Streak</h3>
      
      <div className="flex justify-center w-full overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <div className="flex">
          {/* Day Labels (Left Axis) */}
          <div className="flex flex-col gap-1 text-[10px] text-muted-foreground pr-2 font-medium justify-end pb-[2px]">
            <div className="h-3 flex items-center justify-end opacity-0">Sun</div>
            <div className="h-3 flex items-center justify-end">Mon</div>
            <div className="h-3 flex items-center justify-end opacity-0">Tue</div>
            <div className="h-3 flex items-center justify-end">Wed</div>
            <div className="h-3 flex items-center justify-end opacity-0">Thu</div>
            <div className="h-3 flex items-center justify-end">Fri</div>
            <div className="h-3 flex items-center justify-end opacity-0">Sat</div>
          </div>

          <div className="flex flex-col">
            {/* Month Labels (Top Axis) */}
            <div className="relative h-5 text-[10px] text-muted-foreground font-medium mb-1">
              {monthLabels.map((label, idx) => (
                <div 
                  key={idx} 
                  className="absolute bottom-0"
                  style={{ left: `${label.index * 16}px` }} // w-3 (12px) + gap-1 (4px) = 16px
                >
                  {label.text}
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {weeks.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1">
                  {/* Fill empty days at the start of the first week if needed */}
                  {wIndex === 0 && week.length < 7 && getDay(week[0]) !== 0 && 
                    Array.from({ length: getDay(week[0]) }).map((_, i) => (
                      <div key={`empty-start-${i}`} className="w-3 h-3 rounded-sm opacity-0" />
                    ))
                  }
                  
                  {week.map((day, dIndex) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayData = activityMap.get(dateStr);
                    const points = dayData?.points_earned || 0;
                    const words = dayData?.words_learned || 0;
                    const intensity = getIntensity(points);
                    const isToday = isSameDay(day, today);

                    return (
                      <TooltipProvider key={dIndex} delay={0}>
                        <Tooltip>
                          <TooltipTrigger render={<div />}>
                            <div 
                              className={`w-3 h-3 rounded-sm transition-transform hover:scale-125 hover:ring-1 hover:ring-white/50 cursor-pointer ${getColor(intensity)} ${isToday ? 'ring-1 ring-[#b892ff]' : ''}`}
                            />
                          </TooltipTrigger>
                          <TooltipContent className="shadow-xl font-semibold">
                            <p>{format(day, 'MMM d, yyyy')}</p>
                            <p className="text-xs text-muted-foreground">
                              {points > 0 ? `${points} points` : 'No activity'}
                            </p>
                            {words > 0 && <p className="text-xs text-[#b892ff]">{words} words learned</p>}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-xs font-semibold text-muted-foreground justify-end w-full max-w-[872px] mx-auto pr-2">
        <span>Less</span>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(level => (
            <div key={level} className={`w-3 h-3 rounded-sm ${getColor(level)}`} />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
