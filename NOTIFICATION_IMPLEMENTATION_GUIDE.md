# 🔔 Notification System - Complete Implementation Guide

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation Details](#implementation-details)
- [How It Works](#how-it-works)
- [Current Features](#current-features)
- [Usage Guide](#usage-guide)
- [Testing & Debugging](#testing--debugging)
- [Suggestions & Improvements](#suggestions--improvements)
- [Troubleshooting](#troubleshooting)

---

## Overview

ToolBoxx implements a **dual-layer notification system** that provides both immediate browser notifications and persistent web push notifications:

### **Two Notification Systems**

1. **Browser Notifications** (Phase 1 - Active)
   - Real-time notifications while browser is open
   - Client-side polling for changes
   - No server infrastructure needed
   - Works immediately after permission granted

2. **Web Push Notifications** (Phase 2 - Active)
   - Background notifications via Service Worker
   - Works even when browser is closed
   - Requires VAPID keys and server-side push
   - Full PWA support

---

## Architecture

### **High-Level Flow**

```
┌─────────────────────────────────────────────────────────────────┐
│                        APPLICATION EVENTS                        │
│  • Payment received (MoMo transaction)                          │
│  • New chat message                                             │
│  • Order status change                                          │
│  • Product low stock alert                                      │
└───────────────────────┬─────────────────────────────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                               │
        ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│ BROWSER          │           │ WEB PUSH         │
│ NOTIFICATIONS    │           │ NOTIFICATIONS    │
│ (Client-side)    │           │ (Server + SW)    │
└──────────────────┘           └──────────────────┘
        │                               │
        ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│ User sees alert  │           │ Push to device   │
│ (browser open)   │           │ (always works)   │
└──────────────────┘           └──────────────────┘
```

### **Component Structure**

```
src/
├── lib/notifications/
│   ├── browser-notifications.ts    # Browser notification service
│   ├── web-push.ts                 # Web push client service
│   └── notification-types.ts       # TypeScript types
│
├── hooks/
│   ├── use-notification-permission.ts  # Permission management
│   ├── use-payment-notifications.ts    # Auto-detect payments
│   ├── use-chat-notifications.ts       # Auto-detect messages
│   ├── use-order-notifications.ts      # Auto-detect orders
│   └── use-web-push.ts                 # Web push subscription
│
├── components/
│   ├── notification-provider.tsx       # Global provider
│   ├── notification-prompt.tsx         # Permission UI
│   ├── notification-indicator.tsx      # Status bell icon
│   ├── web-push-subscription.tsx       # Push settings UI
│   └── auto-push-subscriber.tsx        # Auto-subscribe component
│
├── app/api/push/
│   ├── subscribe/route.ts              # Save/delete subscriptions
│   └── send/route.ts                   # Send push notifications
│
└── collections/
    └── PushSubscriptions.ts            # Database schema

public/
└── sw.js                               # Service Worker
```

---

## Implementation Details

### **1. Browser Notifications**

#### **Core Service (Singleton Pattern)**

```typescript
// src/lib/notifications/browser-notifications.ts

class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  
  // Check if browser supports notifications
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
  
  // Request user permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    return await Notification.requestPermission();
  }
  
  // Show generic notification
  async show(options: NotificationOptions): Promise<void> {
    if (!this.isEnabled()) return;
    
    const notification = new Notification(options.title, {
      body: options.message,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: options.id,
      data: { url: options.url }
    });
    
    notification.onclick = () => {
      window.focus();
      window.location.href = options.url || '/';
      notification.close();
    };
  }
  
  // Specialized notification methods
  async showPaymentNotification(amount: string, txnId: string) {...}
  async showChatNotification(sender: string, message: string) {...}
  async showOrderNotification(orderId: string, status: string) {...}
}

export const notificationService = BrowserNotificationService.getInstance();
```

#### **Auto-Detection Hooks**

```typescript
// src/hooks/use-payment-notifications.ts

export function usePaymentNotifications({ enabled = false, playSound = false }) {
  const lastCheckedRef = useRef<Date>(new Date());
  
  // Query payments every 30 seconds
  const { data: payments } = useQuery({
    queryKey: ['payments', 'recent'],
    queryFn: async () => {
      const response = await fetch(`/api/trpc/payments.list?...`);
      return response.json();
    },
    refetchInterval: 30000, // 30 seconds
    enabled,
  });
  
  useEffect(() => {
    if (!payments?.docs) return;
    
    // Filter for new payments since last check
    const newPayments = payments.docs.filter(p => 
      new Date(p.createdAt) > lastCheckedRef.current
    );
    
    // Show notification for each new payment
    newPayments.forEach(payment => {
      const amount = formatCurrency(payment.amount, payment.currency);
      notificationService.showPaymentNotification(amount, payment.id);
      
      if (playSound) {
        const audio = new Audio('/sounds/payment.mp3');
        audio.play().catch(console.error);
      }
    });
    
    lastCheckedRef.current = new Date();
  }, [payments, playSound]);
}
```

#### **Global Provider**

```typescript
// src/components/notification-provider.tsx

export function NotificationProvider({ children, enabled = true }) {
  const { data: session } = useQuery({...});
  
  const isTenant = session?.user?.roles?.includes('tenant');
  const isCustomer = session?.user?.roles?.includes('client');
  
  // Enable notifications based on user role
  usePaymentNotifications({ 
    enabled: enabled && isTenant,
    playSound: true 
  });
  
  useChatNotifications({ 
    enabled: enabled && !!session?.user,
    playSound: true 
  });
  
  useOrderNotifications({ 
    enabled: enabled && isCustomer,
    playSound: true 
  });
  
  return <>{children}</>;
}
```

---

### **2. Web Push Notifications**

#### **Service Worker**

```javascript
// public/sw.js

const SW_VERSION = '1.1.0';

// Install - activate immediately
self.addEventListener('install', (event) => {
  console.log(`[SW ${SW_VERSION}] Installing...`);
  self.skipWaiting();
});

// Activate - claim all clients
self.addEventListener('activate', (event) => {
  console.log(`[SW ${SW_VERSION}] Activating...`);
  event.waitUntil(
    self.clients.claim().then(() => {
      // Clean up old caches
      return caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      );
    })
  );
});

// Handle push events
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/badge-72x72.png',
    tag: data.tag || 'default',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Focus existing window if found
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
```

#### **Client-Side Service**

```typescript
// src/lib/notifications/web-push.ts

export class WebPushService {
  private registration: ServiceWorkerRegistration | null = null;
  
  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) return null;
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('Service Worker registered:', registration);
      this.registration = registration;
      return registration;
    } catch (error) {
      console.error('SW registration failed:', error);
      return null;
    }
  }
  
  // Subscribe to push
  async subscribe(userId: string): Promise<PushSubscription | null> {
    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;
    
    // Ensure SW is registered
    if (!this.registration) {
      this.registration = await this.registerServiceWorker();
    }
    if (!this.registration) return null;
    
    // Check for existing subscription
    let subscription = await this.registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
      const convertedKey = this.urlBase64ToUint8Array(vapidPublicKey);
      
      subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }
    
    // Save to server
    await this.saveSubscription(subscription, userId);
    return subscription;
  }
  
  // Save to database
  private async saveSubscription(sub: PushSubscription, userId: string) {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: {
          endpoint: sub.endpoint,
          keys: {
            p256dh: this.arrayBufferToBase64(sub.getKey('p256dh')!),
            auth: this.arrayBufferToBase64(sub.getKey('auth')!)
          }
        },
        userId
      })
    });
    
    if (!response.ok) throw new Error('Failed to save subscription');
  }
}

export const webPushService = WebPushService.getInstance();
```

#### **Database Schema**

```typescript
// src/collections/PushSubscriptions.ts

export const PushSubscriptions: CollectionConfig = {
  slug: 'push-subscriptions',
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true
    },
    {
      name: 'endpoint',
      type: 'text',
      required: true,
      unique: true  // Prevent duplicate subscriptions
    },
    {
      name: 'keys',
      type: 'group',
      fields: [
        { name: 'p256dh', type: 'text', required: true },
        { name: 'auth', type: 'text', required: true }
      ]
    },
    {
      name: 'userAgent',
      type: 'text',
      admin: { readOnly: true }
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      index: true
    }
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles?.includes('super-admin')) return true;
      return { user: { equals: user.id } };
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.roles?.includes('super-admin')) return true;
      return { user: { equals: user.id } };
    }
  }
};
```

#### **Server-Side Push API**

```typescript
// src/app/api/push/send/route.ts

import webpush from 'web-push';

// Configure VAPID
webpush.setVapidDetails(
  process.env.NEXT_PUBLIC_APP_URL || 'mailto:admin@toolboxx.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, notification } = await req.json();
  
  // Get user's active subscriptions
  const subscriptions = await payload.find({
    collection: 'push-subscriptions',
    where: {
      and: [
        { user: { equals: userId } },
        { isActive: { equals: true } }
      ]
    }
  });
  
  if (subscriptions.docs.length === 0) {
    return NextResponse.json(
      { error: 'No active subscriptions found' },
      { status: 404 }
    );
  }
  
  // Prepare notification payload
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.body,
    icon: notification.icon || '/icon-192x192.png',
    data: {
      url: notification.data?.url || '/',
      type: notification.data?.type || 'general',
      timestamp: Date.now()
    }
  });
  
  // Send to all user's devices
  const results = await Promise.all(
    subscriptions.docs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payload
        );
        return { success: true, endpoint: sub.endpoint };
      } catch (error: any) {
        // Mark inactive if subscription expired
        if (error.statusCode === 404 || error.statusCode === 410) {
          await payload.update({
            collection: 'push-subscriptions',
            id: sub.id,
            data: { isActive: false }
          });
        }
        return { success: false, endpoint: sub.endpoint };
      }
    })
  );
  
  return NextResponse.json({
    success: true,
    results
  });
}
```

---

## How It Works

### **User Journey: Browser Notifications**

```
1. User logs into ToolBoxx
   ↓
2. NotificationProvider mounts in layout
   ↓
3. Checks user role (tenant/customer/admin)
   ↓
4. Enables relevant notification hooks:
   • Tenant → Payment notifications (30s polling)
   • Customer → Order notifications (30s polling)
   • All users → Chat notifications (30s polling)
   ↓
5. Hooks continuously check for new data
   ↓
6. When new item found:
   • Check if created after last check
   • Show browser notification
   • Play sound (optional)
   • Update last check timestamp
   ↓
7. User clicks notification → Navigate to relevant page
```

### **User Journey: Web Push Notifications**

```
1. User sees notification prompt or indicator
   ↓
2. Clicks "Enable Notifications"
   ↓
3. Browser shows permission dialog → User allows
   ↓
4. Service Worker registers (/sw.js)
   ↓
5. Subscribe to browser's Push Manager:
   • Generate subscription with VAPID key
   • Get unique endpoint URL
   • Get encryption keys (p256dh, auth)
   ↓
6. Send subscription to server:
   POST /api/push/subscribe
   {
     subscription: { endpoint, keys },
     userId: "user-123"
   }
   ↓
7. Server saves to MongoDB (push-subscriptions collection)
   ↓
8. Subscription active! Now when events occur:
   ↓
9. Backend calls:
   POST /api/push/send
   {
     userId: "user-123",
     notification: {
       title: "New Payment",
       body: "RWF 50,000 received",
       data: { url: "/verify-payments" }
     }
   }
   ↓
10. Server:
    • Fetches user's subscriptions
    • Uses web-push library to send
    • Push service (FCM/Mozilla) delivers to device
    ↓
11. Service Worker receives 'push' event
    ↓
12. Shows notification via self.registration.showNotification()
    ↓
13. User clicks → Service Worker opens URL
```

### **Subscription Lifecycle**

```
┌─────────────────────────────────────────────────────────┐
│ SUBSCRIPTION STATES                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. INITIAL STATE                                       │
│     • No subscription                                   │
│     • Permission: default                               │
│     • isActive: N/A                                     │
│                                                         │
│  2. PERMISSION REQUESTED                                │
│     • User sees browser dialog                          │
│     • Can allow/block/dismiss                           │
│                                                         │
│  3. SUBSCRIBED & ACTIVE                                 │
│     • Subscription saved in DB                          │
│     • isActive: true                                    │
│     • Receiving notifications                           │
│                                                         │
│  4. EXPIRED/INVALID (Auto-detected)                     │
│     • Push service returns 404/410                      │
│     • Server marks isActive: false                      │
│     • User needs to re-subscribe                        │
│                                                         │
│  5. MANUALLY UNSUBSCRIBED                               │
│     • User clicks "Disable"                             │
│     • Subscription deleted from DB                      │
│     • Can re-subscribe anytime                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Current Features

### ✅ **Implemented**

| Feature | Status | Description |
|---------|--------|-------------|
| **Browser Notifications** | ✅ Active | Real-time alerts while browser open |
| **Web Push (PWA)** | ✅ Active | Background notifications via Service Worker |
| **Payment Notifications** | ✅ Active | Auto-detect new MoMo transactions |
| **Chat Notifications** | ✅ Active | New message alerts |
| **Order Notifications** | ✅ Active | Order status change alerts |
| **Permission UI** | ✅ Active | User-friendly prompts and indicators |
| **Role-based Filtering** | ✅ Active | Tenants see payments, customers see orders |
| **Sound Support** | ✅ Active | Optional audio alerts |
| **Click Navigation** | ✅ Active | Click to open relevant page |
| **Multi-device Support** | ✅ Active | Same user, multiple devices |
| **Auto-cleanup** | ✅ Active | Mark expired subscriptions inactive |
| **Database Persistence** | ✅ Active | MongoDB via PayloadCMS |

### 🎯 **Notification Types**

```typescript
// Payment Notification (Tenants only)
{
  type: 'payment',
  title: '💰 New Payment Received',
  body: 'RWF 50,000 from 0781234567',
  url: '/verify-payments',
  sound: '/sounds/payment.mp3'
}

// Order Notification (Customers only)
{
  type: 'order',
  title: '📦 Order Update',
  body: 'Order #1234 is now shipped',
  url: '/orders/1234',
  sound: '/sounds/order.mp3'
}

// Chat Notification (All users)
{
  type: 'message',
  title: '💬 New Message',
  body: 'John: Hey, is this available?',
  url: '/messages/conversation-id',
  sound: '/sounds/message.mp3'
}

// Product Alert (Tenants)
{
  type: 'product',
  title: '⚠️ Low Stock Alert',
  body: 'Hammer - Only 5 left in stock',
  url: '/products/product-id',
  sound: '/sounds/alert.mp3'
}
```

---

## Usage Guide

### **Quick Setup (Recommended)**

```tsx
// Step 1: Add to your root layout
// src/app/(app)/layout.tsx

import { NotificationProvider } from '@/components/notification-provider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider>
      {children}
    </NotificationProvider>
  );
}
```

```tsx
// Step 2: Add notification prompt to dashboard
// src/app/(app)/my-store/page.tsx

import { NotificationPrompt } from '@/components/notification-prompt';

export default function MyStorePage() {
  return (
    <div>
      <NotificationPrompt />
      {/* Rest of your page */}
    </div>
  );
}
```

```tsx
// Step 3 (Optional): Add notification indicator to header
// src/components/header.tsx

import { NotificationIndicator } from '@/components/notification-indicator';
import { useUser } from '@/hooks/use-user';

export function Header() {
  const user = useUser();
  
  return (
    <header>
      <NotificationIndicator userId={user?.id} />
      {/* Other header content */}
    </header>
  );
}
```

**That's it! ✅ Notifications now work automatically.**

---

### **Advanced Usage**

#### **Manual Notification Trigger**

```typescript
import { notificationService } from '@/lib/notifications/browser-notifications';

// Show custom notification
await notificationService.show({
  type: 'general',
  title: 'Custom Alert',
  message: 'Something important happened!',
  url: '/custom-page',
  id: 'unique-notification-id'
});

// Or use specific methods
await notificationService.showPaymentNotification('RWF 100,000', 'txn-456');
await notificationService.showChatNotification('Alice', 'Hello!', 'conv-789');
```

#### **Send Web Push from Backend**

```typescript
// In your API route or server action
import { getPayload } from 'payload';

export async function notifyUser(userId: string, message: string) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/push/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      notification: {
        title: 'Important Update',
        body: message,
        icon: '/icon-192x192.png',
        data: {
          url: '/dashboard',
          type: 'general'
        }
      }
    })
  });
  
  return response.json();
}

// Example: Notify after payment confirmation
async function handlePaymentConfirmation(payment) {
  await notifyUser(
    payment.tenant.id,
    `Payment of ${payment.amount} ${payment.currency} confirmed!`
  );
}
```

#### **Conditional Notification Provider**

```tsx
// Enable only specific notification types
<NotificationProvider 
  enabled={true}
  playSound={false}  // Disable sounds
>
  {children}
</NotificationProvider>

// Or selectively enable hooks
function CustomNotificationProvider({ children }) {
  const user = useUser();
  
  // Only enable payment notifications
  usePaymentNotifications({ 
    enabled: user?.roles?.includes('tenant'),
    playSound: true 
  });
  
  return <>{children}</>;
}
```

#### **Check Subscription Status**

```typescript
import { webPushService } from '@/lib/notifications/web-push';

// Check if user is subscribed
const subscription = await webPushService.getSubscription();
if (subscription) {
  console.log('User is subscribed:', subscription.endpoint);
} else {
  console.log('User is not subscribed');
}

// Get subscription details
const isSubscribed = await webPushService.isSubscribed();
console.log('Subscribed:', isSubscribed);
```

---

## Testing & Debugging

### **Browser Console Commands**

```javascript
// 1. Check notification permission
Notification.permission
// Result: "default" | "granted" | "denied"

// 2. Request permission manually
Notification.requestPermission().then(console.log)

// 3. Check Service Worker registration
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  console.log('SW state:', reg?.active?.state);
})

// 4. Check push subscription
navigator.serviceWorker.ready.then(reg => 
  reg.pushManager.getSubscription()
).then(sub => {
  if (sub) {
    console.log('✅ Subscribed:', {
      endpoint: sub.endpoint,
      expirationTime: sub.expirationTime
    });
  } else {
    console.log('❌ Not subscribed');
  }
})

// 5. Test browser notification
new Notification('Test', {
  body: 'This is a test notification',
  icon: '/icon-192x192.png'
})

// 6. Manually subscribe (replace with real user ID)
import { webPushService } from '@/lib/notifications/web-push';
webPushService.subscribe('your-user-id').then(console.log)

// 7. View all subscriptions in database
// In MongoDB or Payload admin panel:
// Collection: push-subscriptions
// Filter: { user: "user-id", isActive: true }
```

### **Chrome DevTools Debugging**

1. **Application Tab** → Service Workers
   - See registered service workers
   - Unregister/update service worker
   - View service worker status

2. **Application Tab** → Push Messaging
   - See current subscription
   - Test push notifications

3. **Console Tab**
   - View service worker logs
   - Check for errors

4. **Network Tab**
   - Monitor `/api/push/subscribe` requests
   - Monitor `/api/push/send` requests

### **Test Push Notification**

```bash
# Using curl to send test push
curl -X POST https://your-domain.com/api/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "notification": {
      "title": "Test Notification",
      "body": "This is a test push notification",
      "data": {
        "url": "/dashboard",
        "type": "general"
      }
    }
  }'
```

### **Common Test Scenarios**

```typescript
// Test 1: Payment notification for tenant
usePaymentNotifications({ enabled: true, playSound: true });

// Test 2: Order notification for customer
useOrderNotifications({ enabled: true, playSound: true });

// Test 3: Chat notification for all users
useChatNotifications({ enabled: true, playSound: false });

// Test 4: Web push subscription
const { subscribe, isSubscribed } = useWebPush({ 
  userId: 'test-user-id',
  autoSubscribe: true 
});

// Test 5: Manual notification
notificationService.showPaymentNotification('RWF 50,000', 'test-123');
```

---

## Suggestions & Improvements

### **🚀 High Priority Enhancements**

#### **1. Notification Preferences UI**

**Problem:** Users can't customize what notifications they receive.

**Solution:**
```tsx
// Create: src/app/(app)/settings/notifications/page.tsx

export default function NotificationSettingsPage() {
  const [preferences, setPreferences] = useState({
    payments: { enabled: true, sound: true, push: true },
    orders: { enabled: true, sound: false, push: true },
    messages: { enabled: true, sound: true, push: true },
    products: { enabled: false, sound: false, push: false }
  });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent>
        {Object.entries(preferences).map(([type, prefs]) => (
          <div key={type}>
            <h3>{type.charAt(0).toUpperCase() + type.slice(1)}</h3>
            <Switch 
              checked={prefs.enabled}
              onCheckedChange={(enabled) => 
                updatePreference(type, 'enabled', enabled)
              }
            />
            <Switch 
              checked={prefs.sound}
              disabled={!prefs.enabled}
              onCheckedChange={(sound) => 
                updatePreference(type, 'sound', sound)
              }
            />
            <Switch 
              checked={prefs.push}
              disabled={!prefs.enabled}
              onCheckedChange={(push) => 
                updatePreference(type, 'push', push)
              }
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

**Database Schema:**
```typescript
// Add to Users collection or create NotificationPreferences collection
{
  user: 'user-id',
  preferences: {
    payments: { enabled: true, sound: true, push: true },
    orders: { enabled: true, sound: false, push: true },
    messages: { enabled: true, sound: true, push: true },
    products: { enabled: false, sound: false, push: false }
  }
}
```

#### **2. Notification History/Center**

**Problem:** Users can't see past notifications.

**Solution:**
```tsx
// Create: src/components/notification-center.tsx

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  
  return (
    <Popover>
      <PopoverTrigger>
        <Bell />
        {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      </PopoverTrigger>
      <PopoverContent>
        <ScrollArea className="h-96">
          {notifications.map(notif => (
            <NotificationItem 
              key={notif.id}
              notification={notif}
              onRead={() => markAsRead(notif.id)}
            />
          ))}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
```

**Database Collection:**
```typescript
// Create: src/collections/Notifications.ts

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  fields: [
    { name: 'user', type: 'relationship', relationTo: 'users' },
    { name: 'title', type: 'text' },
    { name: 'body', type: 'text' },
    { name: 'type', type: 'select', options: ['payment', 'order', 'message'] },
    { name: 'url', type: 'text' },
    { name: 'isRead', type: 'checkbox', defaultValue: false },
    { name: 'readAt', type: 'date' }
  ]
};
```

#### **3. Batch Notifications**

**Problem:** Multiple notifications can be overwhelming.

**Solution:**
```typescript
// Modify hooks to batch notifications

export function usePaymentNotifications({ enabled, playSound }) {
  const [pendingNotifications, setPendingNotifications] = useState([]);
  
  useEffect(() => {
    if (pendingNotifications.length === 0) return;
    
    // Wait 5 seconds to collect more
    const timer = setTimeout(() => {
      if (pendingNotifications.length === 1) {
        // Show single notification
        notificationService.showPaymentNotification(
          pendingNotifications[0].amount,
          pendingNotifications[0].id
        );
      } else {
        // Show batched notification
        notificationService.show({
          type: 'payment',
          title: `💰 ${pendingNotifications.length} New Payments`,
          message: `Total: RWF ${calculateTotal(pendingNotifications)}`,
          url: '/verify-payments'
        });
      }
      
      setPendingNotifications([]);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [pendingNotifications]);
}
```

#### **4. Smart Notification Timing**

**Problem:** Notifications at 2 AM can be annoying.

**Solution:**
```typescript
// Add quiet hours feature

function shouldShowNotification(type: string): boolean {
  const hour = new Date().getHours();
  const preferences = getUserPreferences();
  
  // Check quiet hours (e.g., 10 PM - 7 AM)
  if (hour >= 22 || hour < 7) {
    return preferences.allowQuietHours || type === 'urgent';
  }
  
  return true;
}

// Modify notification service
async show(options: NotificationOptions) {
  if (!shouldShowNotification(options.type)) {
    // Queue for later or save to notification center
    await queueNotification(options);
    return;
  }
  
  // Show immediately
  const notification = new Notification(...);
}
```

#### **5. In-App Notification Banners**

**Problem:** Web push requires permission; some users won't grant it.

**Solution:**
```tsx
// Create: src/components/in-app-notification-banner.tsx

export function InAppNotificationBanner() {
  const [notification, setNotification] = useState(null);
  
  // Subscribe to notification events
  useEffect(() => {
    const handler = (event) => {
      setNotification(event.detail);
      setTimeout(() => setNotification(null), 5000);
    };
    
    window.addEventListener('app-notification', handler);
    return () => window.removeEventListener('app-notification', handler);
  }, []);
  
  if (!notification) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <Alert>
        <AlertTitle>{notification.title}</AlertTitle>
        <AlertDescription>{notification.body}</AlertDescription>
      </Alert>
    </div>
  );
}

// Emit notification events
window.dispatchEvent(new CustomEvent('app-notification', {
  detail: { title: 'New Payment', body: 'RWF 50,000' }
}));
```

### **🔧 Medium Priority Enhancements**

#### **6. Notification Analytics**

Track notification engagement:

```typescript
// Add to database
{
  notificationId: 'notif-123',
  userId: 'user-456',
  type: 'payment',
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clicked: boolean,
  dismissed: boolean
}

// Analytics dashboard
- Delivery rate by type
- Click-through rate
- Best time to send
- Device breakdown
```

#### **7. Progressive Enhancement**

Fallback for unsupported browsers:

```typescript
function getNotificationStrategy(): 'push' | 'polling' | 'websocket' {
  if (webPushService.isSupported()) return 'push';
  if ('WebSocket' in window) return 'websocket';
  return 'polling';
}

// Use WebSocket as fallback
const ws = new WebSocket('wss://api.toolboxx.com/notifications');
ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showInAppNotification(notification);
};
```

#### **8. Notification Templates**

Reusable templates:

```typescript
const templates = {
  payment: (amount, from) => ({
    title: '💰 New Payment Received',
    body: `${amount} from ${from}`,
    url: '/verify-payments',
    icon: '/icons/payment.png'
  }),
  
  orderShipped: (orderId) => ({
    title: '📦 Order Shipped',
    body: `Your order #${orderId} is on the way!`,
    url: `/orders/${orderId}`,
    icon: '/icons/shipping.png'
  })
};
```

#### **9. A/B Testing**

Test notification effectiveness:

```typescript
// Randomly assign users to variants
const variant = user.id % 2 === 0 ? 'emoji' : 'plain';

const notification = variant === 'emoji' 
  ? { title: '💰 Payment Received!' }
  : { title: 'Payment Received' };

// Track which performs better
trackNotificationClick(notification.id, variant);
```

#### **10. Rich Notifications**

Use Notification API advanced features:

```typescript
// Action buttons
const notification = new Notification('New Order', {
  body: 'Order #1234 needs confirmation',
  actions: [
    { action: 'confirm', title: 'Confirm' },
    { action: 'view', title: 'View Details' }
  ],
  image: '/orders/1234/preview.jpg',  // Large image
  badge: '/badge.png',                 // Small badge
  vibrate: [200, 100, 200, 100, 200]  // Vibration pattern
});

// Handle actions
self.addEventListener('notificationclick', (event) => {
  if (event.action === 'confirm') {
    // Handle confirm
  } else if (event.action === 'view') {
    // Handle view
  }
});
```

### **📊 Low Priority (Nice-to-Have)**

11. **Desktop vs Mobile differentiation** - Different notification styles
12. **Notification scheduling** - Send at optimal times
13. **Notification grouping** - Stack similar notifications
14. **Email fallback** - Send email if push fails
15. **SMS fallback** - Critical notifications via SMS
16. **Notification priority levels** - Urgent vs normal vs low
17. **Custom notification sounds** - Per notification type
18. **Notification badges** - App icon badge count
19. **Undo/Snooze** - Dismiss or delay notifications
20. **Multi-language support** - Notifications in user's language

---

## Troubleshooting

### **Common Issues & Solutions**

#### **Issue 1: "Permission denied" or notifications not showing**

**Diagnosis:**
```javascript
console.log('Permission:', Notification.permission);
// If "denied" → User blocked notifications
```

**Solution:**
1. User must manually unblock in browser settings
2. Chrome: `chrome://settings/content/notifications`
3. Firefox: Site settings → Permissions → Notifications

**Prevention:**
- Don't auto-request permission on page load
- Explain benefits before requesting
- Provide visual cue of what user will get

---

#### **Issue 2: Service Worker not registering**

**Diagnosis:**
```javascript
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('Registered SWs:', regs.length);
});
```

**Possible Causes:**
- Not on HTTPS (required for SW)
- `sw.js` file not found (404)
- Browser doesn't support service workers
- Scope mismatch

**Solution:**
```javascript
// Check if SW supported
if ('serviceWorker' in navigator) {
  // Register with correct scope
  navigator.serviceWorker.register('/sw.js', { 
    scope: '/' 
  }).then(reg => {
    console.log('SW registered:', reg.scope);
  }).catch(err => {
    console.error('SW registration failed:', err);
  });
}
```

---

#### **Issue 3: Push subscription not saving to database**

**Diagnosis:**
```javascript
// Check API response
const response = await fetch('/api/push/subscribe', {
  method: 'POST',
  body: JSON.stringify({ subscription, userId })
});

console.log('Status:', response.status);
const data = await response.json();
console.log('Response:', data);
```

**Possible Causes:**
- Missing userId
- Invalid subscription format
- Database connection error
- CORS issues

**Solution:**
- Verify userId is passed correctly
- Check network tab for API errors
- Verify MongoDB connection
- Ensure user is authenticated

---

#### **Issue 4: Notifications work in dev but not production**

**Checklist:**
- [ ] VAPID keys set in production environment
- [ ] Service Worker served from root (`/sw.js`)
- [ ] HTTPS enabled (required for push)
- [ ] Correct `NEXT_PUBLIC_APP_URL` in `.env`
- [ ] Service Worker scope is `/`
- [ ] No caching issues (clear cache & hard reload)

**Debug:**
```bash
# Check environment variables
echo $NEXT_PUBLIC_VAPID_PUBLIC_KEY
echo $VAPID_PRIVATE_KEY

# Verify SW is accessible
curl https://your-domain.com/sw.js

# Check VAPID format
# Should start with "B" and be ~88 characters
```

---

#### **Issue 5: Notifications stop working after some time**

**Cause:** Push subscription expired

**Diagnosis:**
```javascript
navigator.serviceWorker.ready.then(reg =>
  reg.pushManager.getSubscription()
).then(sub => {
  console.log('Expiration:', sub?.expirationTime);
  // If expired or null → need to resubscribe
});
```

**Solution:**
- Auto-refresh subscriptions periodically
- Detect expired subscriptions on backend (404/410 errors)
- Mark as inactive and prompt user to re-subscribe

```typescript
// Add to subscription management
useEffect(() => {
  const refreshInterval = setInterval(async () => {
    const sub = await webPushService.getSubscription();
    if (!sub || (sub.expirationTime && sub.expirationTime < Date.now())) {
      // Re-subscribe
      await webPushService.subscribe(userId);
    }
  }, 60 * 60 * 1000); // Check every hour
  
  return () => clearInterval(refreshInterval);
}, [userId]);
```

---

#### **Issue 6: Notifications not showing on mobile**

**Mobile-specific considerations:**
- iOS Safari: Limited support, requires Add to Home Screen
- Android Chrome: Full support
- Some browsers: Require user interaction first

**Solution:**
```typescript
// Don't auto-subscribe immediately
// Wait for user gesture
<Button onClick={async () => {
  await webPushService.subscribe(userId);
}}>
  Enable Notifications
</Button>
```

---

#### **Issue 7: High polling frequency causing performance issues**

**Symptom:** Page feels sluggish, high network usage

**Solution:**
```typescript
// Increase polling interval
const { data } = useQuery({
  queryKey: ['payments'],
  queryFn: fetchPayments,
  refetchInterval: 60000, // Change from 30s to 60s
  // Or use intelligent polling
  refetchInterval: (data) => {
    // Poll faster if there's recent activity
    const hasRecent = data?.docs?.some(p => 
      Date.now() - new Date(p.createdAt).getTime() < 300000
    );
    return hasRecent ? 30000 : 120000; // 30s or 2min
  }
});
```

---

## Environment Setup

### **Required Environment Variables**

```bash
# .env.local

# VAPID Keys (generate using web-push)
NEXT_PUBLIC_VAPID_PUBLIC_KEY="BN3xU..."  # Public key (starts with B)
VAPID_PRIVATE_KEY="T7g2Kp..."            # Private key

# App URL (for VAPID subject)
NEXT_PUBLIC_APP_URL="https://toolboxx.com"

# Optional: Email for VAPID subject (fallback)
VAPID_EMAIL="mailto:admin@toolboxx.com"
```

### **Generate VAPID Keys**

```bash
# Install web-push CLI
npm install -g web-push

# Generate keys
web-push generate-vapid-keys

# Output:
# Public Key: BN3xU...
# Private Key: T7g2Kp...

# Add to .env
echo "NEXT_PUBLIC_VAPID_PUBLIC_KEY=\"BN3xU...\"" >> .env.local
echo "VAPID_PRIVATE_KEY=\"T7g2Kp...\"" >> .env.local
```

### **Install Dependencies**

```bash
# Web Push library (server-side)
npm install web-push

# React Query (for polling)
npm install @tanstack/react-query

# UI components (if using shadcn)
npm install @radix-ui/react-popover lucide-react
```

---

## Performance Optimization

### **1. Reduce Polling Frequency**

```typescript
// Use exponential backoff
let pollingInterval = 30000; // Start at 30s

useEffect(() => {
  const interval = setInterval(() => {
    checkForUpdates().then(hasUpdates => {
      if (hasUpdates) {
        pollingInterval = 30000; // Reset to 30s
      } else {
        // Gradually increase to max 5 minutes
        pollingInterval = Math.min(pollingInterval * 1.5, 300000);
      }
    });
  }, pollingInterval);
  
  return () => clearInterval(interval);
}, []);
```

### **2. Use WebSockets for Real-Time**

Replace polling with WebSocket connections:

```typescript
// Server (Socket.io example)
io.on('connection', (socket) => {
  socket.on('subscribe', (userId) => {
    socket.join(`user-${userId}`);
  });
});

// Emit on new payment
io.to(`user-${tenantId}`).emit('payment', paymentData);

// Client
const socket = io('wss://api.toolboxx.com');
socket.on('payment', (payment) => {
  notificationService.showPaymentNotification(payment.amount, payment.id);
});
```

### **3. Lazy Load Notification Components**

```typescript
// Dynamically import
const NotificationProvider = dynamic(
  () => import('@/components/notification-provider'),
  { ssr: false }
);
```

### **4. Debounce Notification Display**

```typescript
// Prevent notification spam
const debouncedNotify = debounce((notification) => {
  notificationService.show(notification);
}, 1000);
```

---

## Security Considerations

### **1. Validate Notification Data**

```typescript
// Server-side validation
const notificationSchema = z.object({
  title: z.string().min(1).max(100),
  body: z.string().min(1).max(200),
  data: z.object({
    url: z.string().url().optional(),
    type: z.enum(['payment', 'order', 'message', 'general'])
  })
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  
  // Validate
  const result = notificationSchema.safeParse(body.notification);
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid notification' }, { status: 400 });
  }
  
  // Continue...
}
```

### **2. Authenticate Push Requests**

```typescript
// Verify user is authenticated
const session = await getServerSession();
if (!session?.user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

// Verify user can send to this userId
if (session.user.id !== userId && !session.user.roles?.includes('admin')) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

### **3. Rate Limiting**

```typescript
// Prevent notification abuse
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const identifier = req.headers.get('x-forwarded-for') || 'anonymous';
  
  const { success } = await rateLimit.check(identifier, {
    limit: 10,      // 10 notifications
    window: 60000   // per minute
  });
  
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // Continue...
}
```

### **4. Sanitize Notification Content**

```typescript
import DOMPurify from 'dompurify';

// Prevent XSS in notifications
const sanitizedTitle = DOMPurify.sanitize(notification.title);
const sanitizedBody = DOMPurify.sanitize(notification.body);
```

---

## Conclusion

This notification system provides a robust, dual-layer approach to keeping users informed:

1. **Browser Notifications** for immediate, real-time alerts
2. **Web Push Notifications** for background, always-on notifications

**Key Strengths:**
- ✅ Role-based notification routing
- ✅ Multiple notification types
- ✅ Cross-device support
- ✅ Automatic cleanup of expired subscriptions
- ✅ User-friendly permission UI
- ✅ Comprehensive error handling

**Next Steps:**
1. Implement notification preferences UI
2. Add notification history/center
3. Set up WebSocket for real-time updates (reduce polling)
4. Add analytics to track engagement
5. Create notification templates library

For questions or issues, refer to the troubleshooting section or check the browser console for detailed error messages.

---

**Last Updated:** December 19, 2025  
**Version:** 1.0.0  
**Maintainer:** ToolBoxx Development Team
