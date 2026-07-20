'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { getNotifications, respondToEditRequest, markNotificationAsRead } from '@/actions/collaboration';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/shared/user-avatar';
import { useSidebarStore } from '@/store/useSidebarStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface Notification {
  id: string;
  type: string;
  status: string;
  created_at: string;
  set_id: string;
  set: { title: string };
  sender: {
    id: string;
    full_name: string;
    email: string;
    avatar_url: string;
  };
}

export default function NotificationsPopover() {
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { isExpanded } = useSidebarStore();

  useEffect(() => {
    fetchNotifications();
    // In a real app, you might want to set up Supabase realtime here
  }, []);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications((data as any) || []);
  };

  const unreadCount = notifications.filter(n => n.status === 'pending' || n.status === 'unread').length;

  return (
    <div className="relative group flex items-center w-full">
      <Link 
        href="/notifications"
        prefetch={true}
        className={`w-full h-11 rounded-xl flex items-center px-1 transition-colors ${
          pathname === '/notifications'
            ? 'bg-card text-[#9fa6ff]'
            : 'text-foreground hover:bg-card'
        }`}
      >
        <div className="w-[40px] flex items-center justify-center shrink-0 relative">
          <Bell className="w-[22px] h-[22px]" strokeWidth={2.5} />
          {unreadCount > 0 && (
            <div className="absolute top-0 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-background shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
          )}
        </div>
        <span className="sidebar-text hidden opacity-0 text-[15px] font-semibold whitespace-nowrap ml-2">
          Notifications
        </span>
      </Link>

      {!isExpanded && (
        <span className="absolute left-full ml-3 px-3 py-1.5 bg-white text-[#0a092d] text-sm font-semibold rounded-lg whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-150 shadow-xl z-50">
          Notifications {unreadCount > 0 ? `(${unreadCount})` : ''}
        </span>
      )}
    </div>
  );
}
