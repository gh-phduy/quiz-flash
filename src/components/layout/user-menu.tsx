'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserAvatar } from '@/components/shared/user-avatar';

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

  const email = user.email || '';
  const username = user.user_metadata?.full_name || email.split('@')[0];
  const avatarUrl = user.user_metadata?.avatar_url || null;

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
        className="relative block h-10 w-10 rounded-full bg-slate-800 overflow-hidden border-2 border-transparent hover:border-border transition-all cursor-pointer outline-none focus:ring-2 focus:ring-ring"
      >
        <UserAvatar 
          src={avatarUrl}
          alt="Avatar" 
          className="w-full h-full"
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 mt-1 w-[280px] bg-background border border-border rounded-xl shadow-2xl z-50 text-foreground overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* User Info */}
          <div className="p-4 flex items-center gap-3 bg-background">
            <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0 border border-border bg-slate-800">
              <UserAvatar src={avatarUrl} alt="Avatar" className="w-full h-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-[15px] truncate">{username}</span>
              <span className="text-sm text-muted-foreground truncate">{email}</span>
            </div>
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
        </div>
      )}
    </div>
  );
}
