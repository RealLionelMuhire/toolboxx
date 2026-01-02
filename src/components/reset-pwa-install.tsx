/**
 * Reset PWA Install Dismissal
 * Helper component to reset the PWA install prompt dismissal
 * This allows the install dialog to show again
 */

'use client';

import { useEffect } from 'react';

export function ResetPWAInstall() {
  useEffect(() => {
    // Function to reset PWA install prompt
    (window as any).resetPWAInstall = () => {
      localStorage.removeItem('pwa-install-dismissed');
      localStorage.removeItem('pwa-install-dismissed-time');
      console.log('✅ PWA install prompt reset! Refresh the page to see the install dialog again.');
      window.location.reload();
    };

    console.log('💡 To show the PWA install dialog again, run: resetPWAInstall()');
  }, []);

  return null;
}
