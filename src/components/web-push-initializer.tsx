/**
 * Web Push Initializer
 * Service worker registration is now completely lazy - only happens when user opts in
 */

'use client';

export function WebPushInitializer() {
  // Don't initialize service worker automatically
  // It will be registered when user clicks "Enable Notifications" in the banner
  // This prevents any performance impact on initial page load
  
  return null;
}
