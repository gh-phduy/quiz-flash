import React from 'react';
import { Menu, Search, Plus } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';
import UserMenu from './user-menu';
import SidebarToggle from './sidebar-toggle';
import MobileNav from './mobile-nav';

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Đồng bộ thông tin từ user_metadata sang bảng profiles (chạy ngầm)
  if (user) {
    const meta = user.user_metadata;
    const nameToSync = meta?.full_name || meta?.name;
    const avatarToSync = meta?.avatar_url;
    
    if (nameToSync || avatarToSync) {
      const updateData: any = {};
      if (nameToSync) updateData.full_name = nameToSync;
      if (avatarToSync) updateData.avatar_url = avatarToSync;
      
      // Fire and forget
      supabase.from('profiles').update(updateData).eq('id', user.id).then(() => {});
    }
  }

  return (
    <header className="flex h-[56px] items-center justify-between px-3 md:px-4 bg-background/90 backdrop-blur-md border-b border-border shrink-0 z-50 relative">
      {/* Left */}
      <div className="flex items-center gap-2 md:gap-5 shrink-0">
        <SidebarToggle />
        <MobileNav />
        <Link href="/" className="text-[24px] md:text-[28px] font-black tracking-tight bg-gradient-to-r from-[#b892ff] via-[#6d7bff] to-[#4255ff] text-transparent bg-clip-text hover:brightness-125 transition-all drop-shadow-[0_2px_10px_rgba(184,146,255,0.3)] pr-2 md:pr-4">
          QuizFlash
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
      <div className="flex items-center justify-end gap-1.5 md:gap-4 shrink-0">
        <button className="md:hidden w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors hover:bg-white/5 rounded-xl active:scale-95">
          <Search className="h-5 w-5" />
        </button>
        {user ? (
          <>
            <Link href="/create-set" className="h-9 w-9 md:h-10 md:w-10 rounded-full bg-[#4255ff] flex items-center justify-center hover:bg-[#5b6aff] active:scale-95 transition-all shrink-0 md:mr-1 shadow-md shadow-[#4255ff]/20">
              <Plus className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
            </Link>
            
            <UserMenu user={user} />
          </>
        ) : (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link 
              href="/login?mode=login" 
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-foreground hover:text-muted-foreground transition-colors"
            >
              Log in
            </Link>
            <Link 
              href="/login?mode=signup" 
              className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-[#0a092d] bg-[#ffcd1f] rounded-[4px] hover:bg-[#e5b81c] transition-colors"
            >
              Sign up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
