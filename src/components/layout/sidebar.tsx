'use client';

import React, { useRef } from 'react';
import { 
  Home, 
  Folder, 
  Plus, 
  Search,
  Bell,
  Compass,
  Trophy
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useSidebarStore } from '@/store/useSidebarStore';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(useGSAP);

export default function Sidebar() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const { isExpanded } = useSidebarStore();
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        setUserId(data.user.id);
      }
    };
    fetchUser();
  }, []);

  useGSAP(() => {
    if (isExpanded) {
      gsap.to(sidebarRef.current, {
        width: 256, // w-64
        duration: 0.3,
        ease: 'power2.out',
      });
      gsap.to('.sidebar-text', {
        opacity: 1,
        x: 0,
        display: 'block',
        duration: 0.2,
        delay: 0.1,
        stagger: 0.02,
        ease: 'power2.out',
      });
      gsap.to('.sidebar-divider', {
        width: '100%',
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      gsap.to('.sidebar-text', {
        opacity: 0,
        x: -10,
        display: 'none',
        duration: 0.1,
        ease: 'power2.in',
      });
      gsap.to('.sidebar-divider', {
        width: 32,
        duration: 0.3,
        ease: 'power2.inOut',
      });
      gsap.to(sidebarRef.current, {
        width: 64, // w-16
        duration: 0.3,
        delay: 0.1,
        ease: 'power2.inOut',
      });
    }
  }, [isExpanded]);

  const topNavItems = [
    { href: '/', icon: Home, label: 'Home', isMatch: pathname === '/' },
    { href: userId ? `/user/${userId}` : '/login', icon: Folder, label: 'Your library', isMatch: pathname.startsWith('/user') },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', isMatch: pathname.startsWith('/leaderboard') },
  ];

  return (
    <aside 
      ref={sidebarRef}
      className="w-16 flex-shrink-0 flex flex-col py-4 px-2 bg-background border-r border-white/5 h-full overflow-visible z-40"
    >
      <div className="flex flex-col gap-1 w-full">
        {topNavItems.map((item, i) => (
          <div key={i} className="relative group flex items-center w-full">
            <Link 
              href={item.href}
              className={`w-full h-11 rounded-xl flex items-center px-1 transition-colors ${
                item.isMatch 
                  ? 'bg-card text-[#9fa6ff]' 
                  : 'text-foreground hover:bg-card'
              }`}
            >
              <div className="w-[40px] flex items-center justify-center shrink-0">
                <item.icon className="w-[22px] h-[22px]" strokeWidth={2.5} />
              </div>
              <span className="sidebar-text hidden opacity-0 text-[15px] font-semibold whitespace-nowrap ml-2">
                {item.label}
              </span>
            </Link>
            
            {/* Tooltip for collapsed state */}
            {!isExpanded && (
              <span className="absolute left-full ml-3 px-3 py-1.5 bg-white text-[#0a092d] text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 shadow-xl z-50">
                {item.label}
              </span>
            )}
          </div>
        ))}

        {/* Notifications */}
        <div className="relative group flex items-center w-full">
          <button className="w-full h-11 rounded-xl flex items-center px-1 transition-colors text-foreground hover:bg-card">
            <div className="w-[40px] flex items-center justify-center shrink-0">
              <Bell className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </div>
            <span className="sidebar-text hidden opacity-0 text-[15px] font-semibold whitespace-nowrap ml-2">
              Notifications
            </span>
          </button>
          {!isExpanded && (
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-white text-[#0a092d] text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 shadow-xl z-50">
              Notifications
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full flex justify-center my-3">
        <div className="w-[32px] h-px bg-border transition-all duration-300 sidebar-divider"></div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        {/* Create */}
        <div className="relative group flex items-center w-full">
          <Link 
            href="/create-set"
            className={`w-full h-11 rounded-xl flex items-center px-1 transition-colors ${
              pathname === '/create-set'
                ? 'bg-card text-[#9fa6ff]'
                : 'text-foreground hover:bg-card'
            }`}
          >
            <div className="w-[40px] flex items-center justify-center shrink-0">
              <Plus className="w-6 h-6" strokeWidth={2} />
            </div>
            <span className="sidebar-text hidden opacity-0 text-[15px] font-semibold whitespace-nowrap ml-2">
              Create
            </span>
          </Link>
          {!isExpanded && (
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-white text-[#0a092d] text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 shadow-xl z-50">
              Create
            </span>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="w-full flex justify-center my-3">
        <div className="w-[32px] h-px bg-border transition-all duration-300 sidebar-divider"></div>
      </div>

      <div className="flex flex-col gap-1 w-full">
        {/* Explore */}
        <div className="relative group flex items-center w-full">
          <Link 
            href="/explore"
            className={`w-full h-11 rounded-xl flex items-center px-1 transition-colors ${
              pathname === '/explore'
                ? 'bg-card text-[#9fa6ff]'
                : 'text-foreground hover:bg-card'
            }`}
          >
            <div className="w-[40px] flex items-center justify-center shrink-0">
              <Compass className="w-[22px] h-[22px]" strokeWidth={2.5} />
            </div>
            <span className="sidebar-text hidden opacity-0 text-[15px] font-semibold whitespace-nowrap ml-2">
              Explore Public Sets
            </span>
          </Link>
          {!isExpanded && (
            <span className="absolute left-full ml-3 px-3 py-1.5 bg-white text-[#0a092d] text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 shadow-xl z-50">
              Explore Public Sets
            </span>
          )}
        </div>
      </div>
    </aside>
  );
}
