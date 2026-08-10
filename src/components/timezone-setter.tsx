'use client';

import { useEffect } from 'react';

export default function TimezoneSetter() {
  useEffect(() => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (timezone) {
        // Set cookie valid for 1 year, accessible everywhere
        document.cookie = `client_timezone=${timezone}; path=/; max-age=31536000; SameSite=Lax`;
      }
    } catch (e) {
      console.error('Failed to set timezone cookie:', e);
    }
  }, []);

  return null; // This component renders nothing
}
