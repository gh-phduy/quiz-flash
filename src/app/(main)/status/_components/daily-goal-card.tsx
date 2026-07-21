'use client';

import React from 'react';
import { Target, Flame, Calendar, CheckCircle2 } from 'lucide-react';

interface DailyGoalCardProps {
  dailyGoal?: {
    target_new_words: number;
    target_review_words: number;
    actual_new_words: number;
    actual_review_words: number;
    sessions_completed: number;
    total_study_seconds: number;
  };
}

export default function DailyGoalCard({ dailyGoal }: DailyGoalCardProps) {
  const targetNew = dailyGoal?.target_new_words || 167;
  const actualNew = dailyGoal?.actual_new_words || 0;
  const targetReview = dailyGoal?.target_review_words || 100;
  const actualReview = dailyGoal?.actual_review_words || 0;

  const newPercent = Math.min(100, Math.round((actualNew / targetNew) * 100));
  const reviewPercent = Math.min(100, Math.round((actualReview / targetReview) * 100));

  const totalMinutes = Math.round((dailyGoal?.total_study_seconds || 0) / 60);

  return (
    <div className="p-6 bg-gradient-to-br from-[#0a092d]/80 via-[#151240]/60 to-[#22104a]/40 border border-[#b892ff]/30 rounded-3xl space-y-6 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#b892ff]/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[#b892ff] text-xs font-black uppercase tracking-widest mb-1">
            <Target className="w-4 h-4" /> 5000 Words Target Tracker
          </div>
          <h2 className="text-2xl font-black text-white">Daily Target Goal</h2>
          <p className="text-xs text-muted-foreground">
            Targeting 5,000 words in 30 days (~167 new words/day)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 text-white text-xs font-bold">
            <Flame className="w-4 h-4 text-orange-400" />
            <span>{dailyGoal?.sessions_completed || 0} Sessions</span>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-2 text-white text-xs font-bold">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <span>{totalMinutes} mins studied</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* New Words Goal */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              New Words Goal
              {newPercent >= 100 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </span>
            <span className="text-xs font-mono font-bold text-[#b892ff]">
              {actualNew} / {targetNew}
            </span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#b892ff] to-[#4255ff] transition-all duration-500 rounded-full"
              style={{ width: `${newPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground flex justify-between">
            <span>Progress: {newPercent}%</span>
            <span>{Math.max(0, targetNew - actualNew)} words remaining today</span>
          </p>
        </div>

        {/* Review Words Goal */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-white flex items-center gap-2">
              Review & Reinforcement Goal
              {reviewPercent >= 100 && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-400">
              {actualReview} / {targetReview}
            </span>
          </div>
          <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500 rounded-full"
              style={{ width: `${reviewPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground flex justify-between">
            <span>Progress: {reviewPercent}%</span>
            <span>{Math.max(0, targetReview - actualReview)} cards to review</span>
          </p>
        </div>
      </div>
    </div>
  );
}
