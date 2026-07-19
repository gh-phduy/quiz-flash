'use client';

import { useState, useRef, useEffect } from 'react';
import { Trophy, Settings, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface UserMenuProps {
  user: {
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
    };
  };
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  const email = user.email || '';
  const username = user.user_metadata?.full_name || email.split('@')[0];
  const avatarUrl = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="block h-10 w-10 rounded-full bg-gray-600 overflow-hidden border-2 border-transparent hover:border-border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-ring"
      >
        <img 
          src={avatarUrl}
          alt="Avatar" 
          className="w-full h-full object-cover"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-[280px] bg-background border border-border rounded-xl shadow-2xl z-50 text-foreground overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* User Info */}
          <div className="p-4 flex items-center gap-3 bg-background">
            <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border border-border bg-white">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] truncate">{username}</span>
              <span className="text-sm text-muted-foreground truncate">{email}</span>
            </div>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Primary Actions */}
          <div className="py-2 bg-card">
            <Link href="/achievements" className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              <Trophy className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Achievements</span>
            </Link>
            <Link href="/settings" className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              <Settings className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-semibold text-foreground">Settings</span>
            </Link>
            <button 
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer text-left" 
              onClick={() => {
                setTheme(theme === 'dark' ? 'light' : 'dark');
                setIsOpen(false);
              }}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Light mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-semibold text-foreground">Dark mode</span>
                </>
              )}
            </button>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Log out */}
          <div className="py-2 bg-background">
            <form action="/auth/signout" method="post">
              <button type="submit" className="w-full text-left px-4 py-2 hover:bg-accent transition-colors cursor-pointer text-sm font-semibold text-foreground">
                Log out
              </button>
            </form>
          </div>

          <div className="h-[1px] bg-border" />

          {/* Footer Links */}
          <div className="py-2 bg-background">
            <Link href="/privacy" className="block px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              Privacy policy
            </Link>
            <Link href="/help" className="block px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              Help and feedback
            </Link>
            <Link href="/upgrade" className="block px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent transition-colors cursor-pointer" onClick={() => setIsOpen(false)}>
              Upgrade
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
