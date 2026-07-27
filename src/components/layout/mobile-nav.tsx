'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Folder, 
  Plus, 
  Search,
  Bell,
  Compass,
  Trophy,
  BarChart3,
  LineChart,
  Menu,
  X
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader, SheetClose } from '@/components/ui/sheet';

export default function MobileNav() {
  const pathname = usePathname();
  const [userId, setUserId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

  // Close the sheet when the route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const topNavItems = [
    { href: '/', icon: Home, label: 'Home', isMatch: pathname === '/' },
    { href: userId ? `/user/${userId}` : '/login', icon: Folder, label: 'Your library', isMatch: pathname.startsWith('/user') },
    { href: '/set-analytics', icon: LineChart, label: 'Set Analytics', isMatch: pathname.startsWith('/set-analytics') },
    { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', isMatch: pathname.startsWith('/leaderboard') },
    { href: '/status', icon: BarChart3, label: 'Status', isMatch: pathname.startsWith('/status') },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger 
        render={
          <button 
            className="md:hidden text-foreground hover:text-muted-foreground flex items-center justify-center transition-colors w-10 h-10 rounded-xl hover:bg-white/5 -ml-1 cursor-pointer"
            aria-label="Open Mobile Menu"
          />
        }
      >
        <Menu className="h-6 w-6" />
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background flex flex-col h-full" showCloseButton={false}>
        {/* Header section with brand logo and close button */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/10 shrink-0">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <span className="text-[20px] font-black tracking-tight bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text">
              Quiz Flash
            </span>
          </Link>
          <SheetClose 
            render={
              <button 
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 active:scale-95 transition-all cursor-pointer border border-white/5"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            } 
          />
        </div>
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>

        {/* Scrollable Content */}
        <div className="flex flex-col py-3 px-2 flex-1 overflow-y-auto">
          {/* Top Nav Items */}
          <div className="flex flex-col gap-1 w-full">
            {topNavItems.map((item, i) => (
              <Link 
                key={i}
                href={item.href}
                className={`w-full h-11 rounded-xl flex items-center px-2 transition-colors ${
                  item.isMatch 
                    ? 'bg-card text-[#9fa6ff]' 
                    : 'text-foreground hover:bg-card'
                }`}
              >
                <div className="w-8 flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5" strokeWidth={2.5} />
                </div>
                <span className="text-[15px] font-semibold ml-3">
                  {item.label}
                </span>
              </Link>
            ))}
          </div>

          <div className="w-full flex justify-center my-3">
            <div className="w-[85%] h-px bg-border"></div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <Link 
              href="/create-set"
              className={`w-full h-11 rounded-xl flex items-center px-2 transition-colors ${
                pathname === '/create-set'
                  ? 'bg-card text-[#9fa6ff]'
                  : 'text-foreground hover:bg-card'
              }`}
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                <Plus className="w-6 h-6" strokeWidth={2} />
              </div>
              <span className="text-[15px] font-semibold ml-3">
                Create
              </span>
            </Link>
          </div>

          <div className="w-full flex justify-center my-3">
            <div className="w-[85%] h-px bg-border"></div>
          </div>

          <div className="flex flex-col gap-1 w-full">
            <Link 
              href="/explore"
              className={`w-full h-11 rounded-xl flex items-center px-2 transition-colors ${
                pathname === '/explore'
                  ? 'bg-card text-[#9fa6ff]'
                  : 'text-foreground hover:bg-card'
              }`}
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" strokeWidth={2.5} />
              </div>
              <span className="text-[15px] font-semibold ml-3">
                Explore Public Sets
              </span>
            </Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
