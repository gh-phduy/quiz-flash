'use server';

import { createClient } from '@/utils/supabase/server';

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api';
};

async function fetchFromBackend(endpoint: string, options: RequestInit = {}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return { success: false, error: 'Not authenticated' };
  }

  const backendUrl = getBackendUrl();
  const response = await fetch(`${backendUrl}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    }
  });

  return await response.json();
}

export async function saveSetToLibrary(setId: string) {
  return await fetchFromBackend('/collab/save', { method: 'POST', body: JSON.stringify({ setId }) });
}

export async function unsaveSetFromLibrary(setId: string) {
  return await fetchFromBackend('/collab/unsave', { method: 'POST', body: JSON.stringify({ setId }) });
}

export async function checkIsSetSaved(setId: string) {
  return await fetchFromBackend(`/collab/saved-status/${setId}`, { method: 'GET' });
}

export async function requestEditAccess(setId: string) {
  return await fetchFromBackend('/collab/request-access', { method: 'POST', body: JSON.stringify({ setId }) });
}

export async function respondToEditRequest(notificationId: string, accept: boolean) {
  return await fetchFromBackend('/collab/respond-request', { method: 'POST', body: JSON.stringify({ notificationId, accept }) });
}

export async function getNotifications() {
  const res = await fetchFromBackend('/collab/notifications', { method: 'GET' });
  return Array.isArray(res) ? res : [];
}

export async function markNotificationAsRead(notificationId: string) {
  return await fetchFromBackend('/collab/mark-read', { method: 'POST', body: JSON.stringify({ notificationId }) });
}

export async function checkCollaboratorStatus(setId: string) {
  return await fetchFromBackend(`/collab/status/${setId}`, { method: 'GET' });
}