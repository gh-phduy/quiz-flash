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
  Menu
} from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from '@/components/ui/sheet';

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
      <SheetContent side="left" className="w-[280px] p-0 border-r border-border bg-background">
        <SheetHeader className="p-4 border-b border-white/5 text-left sr-only">
          <SheetTitle>Navigation Menu</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col py-4 px-2 h-full overflow-y-auto">
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

          <div className="w-full flex justify-center my-4">
            <div className="w-[80%] h-px bg-border"></div>
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

          <div className="w-full flex justify-center my-4">
            <div className="w-[80%] h-px bg-border"></div>
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
