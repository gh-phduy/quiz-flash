'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, X, Loader2 } from 'lucide-react';
import { getNotifications, respondToEditRequest, markNotificationAsRead } from '@/actions/collaboration';
import { formatDistanceToNow } from 'date-fns';
import { UserAvatar } from '@/components/shared/user-avatar';
import { toast } from 'sonner';

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

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setIsFetching(true);
    const data = await getNotifications();
    setNotifications((data as any) || []);
    setIsFetching(false);
  };

  const handleRespond = async (notif: Notification, accept: boolean) => {
    setLoading(true);
    const res = await respondToEditRequest(notif.id, accept);
    if (res?.error) {
      toast.error(res.error);
    } else {
      toast.success(accept ? 'Accepted edit request' : 'Declined edit request');
    }
    await fetchNotifications();
    setLoading(false);
  };

  const handleMarkAsRead = async (notifId: string) => {
    setLoading(true);
    await markNotificationAsRead(notifId);
    await fetchNotifications();
    setLoading(false);
  };

  const unreadCount = notifications.filter(n => n.status === 'pending' || n.status === 'unread').length;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background text-foreground font-sans pb-24">
      <main className="mx-auto max-w-4xl px-4 py-10 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-[#4255ff]/10 flex items-center justify-center">
            <Bell className="w-6 h-6 text-[#4255ff]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            <p className="text-muted-foreground mt-1">
              {unreadCount > 0 
                ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}.` 
                : "You're all caught up!"}
            </p>
          </div>
        </div>

        {/* List */}
        <div className="bg-card border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          {isFetching ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[#4255ff]" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-24 px-6 flex flex-col items-center">
              <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                <Bell className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No notifications yet</h2>
              <p className="text-muted-foreground max-w-md">
                When someone requests to edit your flashcard sets or interacts with your content, you'll see it here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  className={`p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 transition-colors ${
                    notif.status === 'pending' || notif.status === 'unread' 
                      ? 'bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer' 
                      : 'opacity-75 hover:opacity-100 bg-transparent hover:bg-white/[0.02]'
                  }`}
                  onClick={() => {
                    if (notif.status === 'unread') handleMarkAsRead(notif.id);
                  }}
                >
                  <div className="flex gap-4">
                    <UserAvatar 
                      src={notif.sender?.avatar_url} 
                      alt="Avatar" 
                      fallbackSeed={notif.sender?.id || 'default'} 
                      className="w-12 h-12 rounded-full bg-gray-700 shrink-0 border border-white/10"
                    />
                    <div className="flex flex-col justify-center">
                      <div className="text-base text-foreground leading-snug">
                        <span className="font-bold text-white">
                          {notif.sender?.full_name || (notif.sender?.email ? notif.sender.email.split('@')[0] : 'Someone')}
                        </span>
                        {notif.type === 'EDIT_REQUEST' && ' wants to edit your set '}
                        {notif.type === 'EDIT_ACCEPTED' && ' accepted your edit request for '}
                        {notif.type === 'EDIT_REJECTED' && ' rejected your edit request for '}
                        <span className="font-bold text-[#b892ff]">"{notif.set?.title}"</span>
                      </div>
                      <span className="text-sm text-muted-foreground mt-1.5 font-medium flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4255ff]/50" />
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  
                  {notif.type === 'EDIT_REQUEST' && notif.status === 'pending' && (
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <button 
                        disabled={loading}
                        onClick={(e) => { e.stopPropagation(); handleRespond(notif, false); }}
                        className="flex-1 sm:flex-none bg-background hover:bg-red-500/10 text-muted-foreground hover:text-red-400 border border-white/10 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                      <button 
                        disabled={loading}
                        onClick={(e) => { e.stopPropagation(); handleRespond(notif, true); }}
                        className="flex-1 sm:flex-none bg-[#4255ff]/20 text-[#9fa6ff] hover:bg-[#4255ff]/40 border border-[#4255ff]/20 px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" /> Accept
                      </button>
                    </div>
                  )}

                  {notif.type === 'EDIT_REQUEST' && notif.status !== 'pending' && (
                    <div className="sm:ml-auto px-4 py-2 rounded-lg bg-background border border-white/5 text-sm font-semibold text-muted-foreground">
                      {notif.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </div>
                  )}
                  
                  {notif.type !== 'EDIT_REQUEST' && notif.status === 'unread' && (
                    <div className="flex items-center gap-3 sm:ml-auto">
                      <button 
                        disabled={loading}
                        onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                        className="bg-[#4255ff]/20 text-[#9fa6ff] hover:bg-[#4255ff]/40 border border-[#4255ff]/20 px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition"
                      >
                        <Check className="w-4 h-4" /> Mark as read
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
