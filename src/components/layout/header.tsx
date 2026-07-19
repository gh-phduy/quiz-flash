import React from 'react';
import { Menu, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import UserMenu from './user-menu';
import SidebarToggle from './sidebar-toggle';
import { Pacifico } from 'next/font/google';

const pacifico = Pacifico({ weight: '400', subsets: ['latin'] });

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="flex h-[56px] items-center justify-between px-4 bg-background border-b border-border shrink-0 z-50 relative">
      {/* Left */}
      <div className="flex items-center gap-5 shrink-0">
        <SidebarToggle />
        <Link href="/" className={`${pacifico.className} text-[24px] bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text hover:brightness-125 transition-all drop-shadow-[0_2px_10px_rgba(184,146,255,0.3)] pr-4`}>
          Quiz Flash
        </Link>
      </div>

      {/* Center Search (Absolute Centered) */}
      <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-full max-w-xl px-4 pointer-events-none">
        <div className="flex items-center bg-secondary rounded-full px-4 py-2 w-full border border-transparent focus-within:border-ring transition-colors pointer-events-auto">
          <Search className="h-4 w-4 text-muted-foreground mr-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Search for a question" 
            className="bg-transparent border-none outline-none text-[15px] text-foreground placeholder-muted-foreground w-full"
          />
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center justify-end gap-4 shrink-0">
        {user ? (
          <>
            <Link href="/create-set" className="h-10 w-10 rounded-full bg-[#4255ff] flex items-center justify-center hover:bg-[#5b6aff] transition-colors shrink-0 mr-1">
              <Plus className="h-6 w-6 text-foreground" />
            </Link>
            
            <UserMenu user={user} />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-bold text-foreground hover:text-muted-foreground transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-bold text-[#0a092d] bg-[#ffcd1f] rounded-[4px] hover:bg-[#e5b81c] transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
