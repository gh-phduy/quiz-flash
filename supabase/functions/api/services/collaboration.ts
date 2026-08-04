
import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

// ========== LIBRARY ACTIONS ==========

export async function saveSetToLibrary(supabase: SupabaseClient, userId: string, setId: string) {
    
  
  const { error } = await supabase
    .from('user_saved_sets')
    .insert([{ user_id: userId, set_id: setId }]);

  if (error) {
    // If it's a unique constraint violation, it's already saved, which is fine
    if (error.code !== '23505') {
      return { error: error.message };
    }
  }

      return { success: true };
}

export async function unsaveSetFromLibrary(supabase: SupabaseClient, userId: string, setId: string) {
    
  
  const { error } = await supabase
    .from('user_saved_sets')
    .delete()
    .eq('user_id', userId)
    .eq('set_id', setId);

  if (error) {
    return { error: error.message };
  }

      return { success: true };
}

export async function checkIsSetSaved(supabase: SupabaseClient, userId: string, setId: string) {
    
  if (!userId) return false;

  const { data, error } = await supabase
    .from('user_saved_sets')
    .select('id')
    .eq('user_id', userId)
    .eq('set_id', setId)
    .single();

  if (error || !data) return false;
  return true;
}

// ========== COLLABORATION ACTIONS ==========

export async function requestEditAccess(supabase: SupabaseClient, userId: string, setId: string) {
    
  if (!userId) return { error: 'You must be logged in to request access.' };

  // 1. Get the set to find the owner
  const { data: set, error: setError } = await supabase
    .from('sets')
    .select('user_id, title')
    .eq('id', setId)
    .single();

  if (setError || !set) return { error: 'Set not found.' };

  if (set.user_id === userId) {
    return { error: 'You are the owner of this set.' };
  }

  // 2. Check if already a collaborator
  const { data: collab } = await supabase
    .from('set_collaborators')
    .select('id')
    .eq('set_id', setId)
    .eq('user_id', userId)
    .single();
  
  if (collab) {
    return { error: 'You already have edit access to this set.' };
  }

  // 3. Check if there's already a pending request
  const { data: existingRequest } = await supabase
    .from('notifications')
    .select('id')
    .eq('set_id', setId)
    .eq('sender_id', userId)
    .eq('recipient_id', set.user_id)
    .eq('type', 'EDIT_REQUEST')
    .eq('status', 'pending')
    .single();

  if (existingRequest) {
    return { error: 'You have already requested access. Please wait for the owner to respond.' };
  }

  // 4. Create the notification
  const { error: notifError } = await supabase
    .from('notifications')
    .insert([{
      recipient_id: set.user_id,
      sender_id: userId,
      set_id: setId,
      type: 'EDIT_REQUEST',
      status: 'pending'
    }]);

  if (notifError) {
    return { error: notifError.message };
  }

  return { success: true };
}

export async function respondToEditRequest(supabase: SupabaseClient, userId: string, notificationId: string, accept: boolean) {
    
  if (!userId) return { error: 'Unauthorized.' };

  // 1. Get the notification
  const { data: notification, error: getError } = await supabase
    .from('notifications')
    .select('*, set:sets(title)')
    .eq('id', notificationId)
    .single();

  if (getError || !notification) return { error: 'Notification not found.' };

  if (notification.recipient_id !== userId) {
    return { error: 'Unauthorized. This notification belongs to someone else.' };
  }

  // 2. Update notification status
  const newStatus = accept ? 'accepted' : 'rejected';
  const { error: updateError } = await supabase
    .from('notifications')
    .update({ status: newStatus })
    .eq('id', notificationId);

  if (updateError) return { error: updateError.message };

  // 3. If accepted, add to set_collaborators
  if (accept) {
    const { error: collabError } = await supabase
      .from('set_collaborators')
      .insert([{
        set_id: notification.set_id,
        user_id: notification.sender_id
      }]);

    if (collabError && collabError.code !== '23505') {
      return { error: collabError.message };
    }
  }

  // 4. Send a response notification back to the requester
  await supabase
    .from('notifications')
    .insert([{
      recipient_id: notification.sender_id,
      sender_id: userId,
      set_id: notification.set_id,
      type: accept ? 'EDIT_ACCEPTED' : 'EDIT_REJECTED',
      status: 'unread'
    }]);

    return { success: true };
}

export async function getNotifications(supabase: SupabaseClient, userId: string) {
    
  if (!userId) return [];

  const { data, error } = await supabase
    .from('notifications')
    .select(`
      id,
      type,
      status,
      created_at,
      set_id,
      sender_id,
      set:sets ( title )
    `)
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }

  if (!data || data.length === 0) return [];

  // Fetch senders' profiles
  const senderIds = [...new Set(data.map(n => n.sender_id))].filter(Boolean);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, email')
    .in('id', senderIds);

  const notificationsWithSenders = data.map(n => ({
    ...n,
    sender: profiles?.find(p => p.id === n.sender_id) || null
  }));

  return notificationsWithSenders;
}

export async function markNotificationAsRead(supabase: SupabaseClient, userId: string, notificationId: string) {
    
  if (!userId) return { error: 'Unauthorized.' };

  const { error } = await supabase
    .from('notifications')
    .update({ status: 'read' })
    .eq('id', notificationId)
    .eq('recipient_id', userId)
    .eq('status', 'unread');

  if (error) return { error: error.message };
  return { success: true };
}

export async function checkCollaboratorStatus(supabase: SupabaseClient, userId: string, setId: string) {
      
  if (!userId) return { isOwner: false, isCollaborator: false, pendingRequest: false };

  const { data: set } = await supabase
    .from('sets')
    .select('user_id')
    .eq('id', setId)
    .single();

  if (!set) return { isOwner: false, isCollaborator: false, pendingRequest: false };

  if (set.user_id === userId) {
    return { isOwner: true, isCollaborator: true, pendingRequest: false };
  }

  const { data: collab } = await supabase
    .from('set_collaborators')
    .select('id')
    .eq('set_id', setId)
    .eq('user_id', userId)
    .single();

  if (collab) {
    return { isOwner: false, isCollaborator: true, pendingRequest: false };
  }

  const { data: pending } = await supabase
    .from('notifications')
    .select('id')
    .eq('set_id', setId)
    .eq('sender_id', userId)
    .eq('type', 'EDIT_REQUEST')
    .eq('status', 'pending')
    .single();

  return { isOwner: false, isCollaborator: false, pendingRequest: !!pending };
}
