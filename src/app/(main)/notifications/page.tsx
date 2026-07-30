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
    <div className="w-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6 font-sans pb-24">
      {/* Gamer Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 sm:mb-10 gap-6 p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-r from-[#0c0d28]/95 via-[#0d0c2b]/85 to-[#130f3a]/90 backdrop-blur-2xl border border-[#b892ff]/30 shadow-[0_0_50px_rgba(66,85,255,0.18)] relative overflow-hidden group">
        
        {/* Background Cyberpunk Ambient Glows */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-[#4255ff]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-[#b892ff]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Left: Section Info */}
        <div className="relative z-10 space-y-2 min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            {unreadCount > 0 ? `${unreadCount} Unread Inbox` : 'All Caught Up'}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-lg leading-tight">
            Notifications <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#9fa6ff] via-[#b892ff] to-[#ff92d0]">Inbox</span>
          </h1>
          <p className="font-semibold text-sm sm:text-base text-slate-300 max-w-lg leading-relaxed">
            Stay updated on set edit requests & collaboration updates from peers.
          </p>
        </div>

        {/* Right Icon Accent */}
        <div className="relative z-10 shrink-0 hidden sm:flex">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-[#4255ff]/15 border border-[#4255ff]/30 flex items-center justify-center text-[#9fa6ff] shadow-[0_0_30px_rgba(66,85,255,0.3)]">
            <Bell className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
        </div>
      </div>

      {/* Notifications List Container */}
      <div className="bg-[#0c0d28]/70 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-2xl relative z-10">
        {isFetching ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[#b892ff]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20 px-6 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-950/60 border border-white/10 rounded-3xl flex items-center justify-center mb-5 shadow-inner">
              <Bell className="w-9 h-9 text-slate-500" />
            </div>
            <h2 className="text-xl font-extrabold text-white mb-2">Inbox Clear!</h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              When someone requests to edit your flashcard sets or responds to your collaboration invites, notifications will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  notif.status === 'pending' || notif.status === 'unread' 
                    ? 'bg-[#07061d]/90 border-[#b892ff]/40 shadow-[0_0_20px_rgba(184,146,255,0.1)] hover:border-[#b892ff]/70' 
                    : 'bg-slate-950/40 border-white/5 opacity-85 hover:opacity-100 hover:border-white/15'
                }`}
                onClick={() => {
                  if (notif.status === 'unread') handleMarkAsRead(notif.id);
                }}
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <UserAvatar 
                    src={notif.sender?.avatar_url} 
                    alt="Avatar" 
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-slate-900 shrink-0 border-2 border-[#b892ff]/40 shadow-md"
                  />
                  <div className="flex flex-col justify-center min-w-0">
                    <div className="text-xs sm:text-sm text-slate-200 leading-snug">
                      <span className="font-extrabold text-white">
                        {notif.sender?.full_name || (notif.sender?.email ? notif.sender.email.split('@')[0] : 'Someone')}
                      </span>
                      {notif.type === 'EDIT_REQUEST' && ' wants to edit your set '}
                      {notif.type === 'EDIT_ACCEPTED' && ' accepted your edit request for '}
                      {notif.type === 'EDIT_REJECTED' && ' rejected your edit request for '}
                      <span className="font-extrabold text-[#b892ff]">"{notif.set?.title}"</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#b892ff]" />
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                
                {notif.type === 'EDIT_REQUEST' && notif.status === 'pending' && (
                  <div className="flex items-center gap-2.5 shrink-0 mt-2 sm:mt-0 w-full sm:w-auto">
                    <button 
                      disabled={loading}
                      onClick={(e) => { e.stopPropagation(); handleRespond(notif, false); }}
                      className="flex-1 sm:flex-none bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                    <button 
                      disabled={loading}
                      onClick={(e) => { e.stopPropagation(); handleRespond(notif, true); }}
                      className="flex-1 sm:flex-none bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:opacity-95 px-4 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                )}

                {notif.type === 'EDIT_REQUEST' && notif.status !== 'pending' && (
                  <div className="shrink-0 mt-1 sm:mt-0">
                    <div className={`px-3.5 py-1.5 rounded-xl border text-xs font-extrabold flex items-center gap-1.5 ${
                      notif.status === 'accepted'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                    }`}>
                      {notif.status === 'accepted' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      <span>{notif.status === 'accepted' ? 'Accepted' : 'Declined'}</span>
                    </div>
                  </div>
                )}
                
                {notif.type !== 'EDIT_REQUEST' && notif.status === 'unread' && (
                  <div className="shrink-0 mt-2 sm:mt-0">
                    <button 
                      disabled={loading}
                      onClick={(e) => { e.stopPropagation(); handleMarkAsRead(notif.id); }}
                      className="w-full sm:w-auto bg-[#4255ff]/20 text-[#9fa6ff] hover:bg-[#4255ff]/40 border border-[#4255ff]/30 px-3.5 py-1.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark as read
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
