'use client';

import React from 'react';
import { Menu } from 'lucide-react';
import { useSidebarStore } from '@/store/useSidebarStore';

export default function SidebarToggle() {
  const { toggleExpanded } = useSidebarStore();

  return (
    <button 
      onClick={toggleExpanded}
      className="text-foreground hover:text-muted-foreground flex items-center justify-center transition-colors w-10 h-10 rounded-xl hover:bg-white/5 -ml-1 cursor-pointer"
      aria-label="Toggle Sidebar"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
