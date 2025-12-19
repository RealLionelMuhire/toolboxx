# 🚀 Simple Alternative to WebSockets: Server-Sent Events (SSE)

## Why SSE Instead of WebSockets?

### **SSE is Perfect for Notifications Because:**
- ✅ **One-way communication** (server → client) - exactly what you need
- ✅ **Much simpler** than WebSockets (no handshake, no binary protocols)
- ✅ **Auto-reconnects** if connection drops
- ✅ **Works over HTTP** (no special server required)
- ✅ **Built into browsers** (EventSource API)
- ✅ **Easy to scale** (can use CDN/proxy)

### **WebSockets Only Needed When:**
- ❌ You need **bi-directional** real-time communication (chat apps, gaming)
- ❌ You need **binary data** streaming
- ❌ You have **thousands** of concurrent users

---

## 📊 Comparison

| Feature | Current (Polling) | SSE | WebSocket |
|---------|------------------|-----|-----------|
| **Complexity** | 🟢 Simple | 🟢 Simple | 🔴 Complex |
| **Real-time** | 🟡 30-60s delay | 🟢 Instant | 🟢 Instant |
| **Server Load** | 🟡 Medium | 🟢 Low | 🟢 Low |
| **Auto-reconnect** | ❌ Manual | ✅ Built-in | ❌ Manual |
| **Scaling** | 🟡 Medium | 🟢 Good | 🔴 Harder |
| **Infrastructure** | None | None | Redis/Message Queue |
| **Implementation Time** | ✅ Done | 2-3 hours | 2-3 days |

---

## 🚀 How to Implement SSE (Easy!)

### **Step 1: Create SSE API Route**

```typescript
// src/app/api/notifications/stream/route.ts

import { NextRequest } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const runtime = 'nodejs'; // Important for streaming
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }

  // Create SSE response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // Poll for updates every 10 seconds
      const interval = setInterval(async () => {
        try {
          const payload = await getPayload({ config });
          
          // Check for new payments (example)
          const recentPayments = await payload.find({
            collection: 'transactions',
            where: {
              tenant: { equals: userId },
              createdAt: { 
                greater_than: new Date(Date.now() - 30000).toISOString() 
              }
            },
            limit: 10
          });

          // Send new payments as SSE
          if (recentPayments.docs.length > 0) {
            recentPayments.docs.forEach(payment => {
              const message = JSON.stringify({
                type: 'payment',
                data: {
                  id: payment.id,
                  amount: payment.amount,
                  currency: payment.currency,
                  from: payment.phoneNumber
                }
              });
              
              controller.enqueue(encoder.encode(`data: ${message}\n\n`));
            });
          }

          // Send heartbeat to keep connection alive
          controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 10000); // Check every 10 seconds

      // Cleanup on disconnect
      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

---

### **Step 2: Create SSE Hook**

```typescript
// src/hooks/use-sse-notifications.ts

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { notificationService } from '@/lib/notifications/browser-notifications';

interface UseSSENotificationsOptions {
  userId?: string;
  enabled?: boolean;
  onPayment?: (payment: any) => void;
  onOrder?: (order: any) => void;
  onMessage?: (message: any) => void;
}

export function useSSENotifications({
  userId,
  enabled = true,
  onPayment,
  onOrder,
  onMessage
}: UseSSENotificationsOptions = {}) {
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);

  const connect = useCallback(() => {
    if (!userId || !enabled) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    console.log('[SSE] Connecting...');
    
    // Create new EventSource
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
    eventSourceRef.current = eventSource;

    // Handle messages
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'connected':
            console.log('[SSE] Connected successfully');
            reconnectAttempts.current = 0;
            break;
            
          case 'payment':
            console.log('[SSE] New payment:', data.data);
            
            // Show notification
            notificationService.showPaymentNotification(
              `${data.data.currency} ${data.data.amount}`,
              data.data.id
            );
            
            // Callback
            onPayment?.(data.data);
            break;
            
          case 'order':
            console.log('[SSE] Order update:', data.data);
            notificationService.showOrderNotification(
              data.data.orderId,
              data.data.status,
              data.data.id
            );
            onOrder?.(data.data);
            break;
            
          case 'message':
            console.log('[SSE] New message:', data.data);
            notificationService.showChatNotification(
              data.data.sender,
              data.data.text,
              data.data.conversationId
            );
            onMessage?.(data.data);
            break;
        }
      } catch (error) {
        console.error('[SSE] Error parsing message:', error);
      }
    };

    // Handle errors
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      eventSource.close();
      
      // Exponential backoff reconnection
      const backoffTime = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
      reconnectAttempts.current++;
      
      console.log(`[SSE] Reconnecting in ${backoffTime}ms (attempt ${reconnectAttempts.current})`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, backoffTime);
    };

    // Handle connection open
    eventSource.onopen = () => {
      console.log('[SSE] Connection opened');
    };

  }, [userId, enabled, onPayment, onOrder, onMessage]);

  // Connect on mount
  useEffect(() => {
    if (enabled && userId) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      if (eventSourceRef.current) {
        console.log('[SSE] Disconnecting...');
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect, enabled, userId]);

  return {
    isConnected: eventSourceRef.current?.readyState === EventSource.OPEN,
    reconnect: connect
  };
}
```

---

### **Step 3: Replace NotificationProvider**

```typescript
// src/components/notification-provider.tsx

'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@/trpc/client';
import { useSSENotifications } from '@/hooks/use-sse-notifications'; // NEW!

interface NotificationProviderProps {
  children: React.ReactNode;
  enabled?: boolean;
  useSSE?: boolean; // NEW: Toggle between SSE and polling
}

export function NotificationProvider({ 
  children, 
  enabled = true,
  useSSE = false // Default to polling for backward compatibility
}: NotificationProviderProps) {
  const trpc = useTRPC();

  const { data: session } = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 30000,
  });

  const isLoggedIn = !!session?.user;
  const userId = session?.user?.id;

  // NEW: Use SSE if enabled
  if (useSSE && isLoggedIn) {
    useSSENotifications({
      userId,
      enabled: enabled && isLoggedIn,
      onPayment: (payment) => {
        console.log('Payment received:', payment);
        // Optional: Trigger React Query invalidation
        // trpc.payments.list.invalidate();
      },
      onOrder: (order) => {
        console.log('Order updated:', order);
      },
      onMessage: (message) => {
        console.log('New message:', message);
      }
    });
  } else {
    // Keep existing polling hooks as fallback
    const isTenant = session?.user?.roles?.includes('tenant');
    const isCustomer = session?.user?.roles?.includes('client');

    usePaymentNotifications({ 
      enabled: enabled && isLoggedIn && isTenant,
      playSound: true 
    });
    
    useChatNotifications({ 
      enabled: enabled && isLoggedIn,
      playSound: true 
    });
    
    useOrderNotifications({ 
      enabled: enabled && isLoggedIn && isCustomer,
      playSound: true 
    });
  }

  return <>{children}</>;
}
```

---

### **Step 4: Enable SSE in Layout**

```tsx
// src/app/(app)/layout.tsx

import { NotificationProvider } from '@/components/notification-provider';

export default function AppLayout({ children }) {
  return (
    <NotificationProvider 
      useSSE={true}  // Enable SSE (set to false to use polling)
    >
      {children}
    </NotificationProvider>
  );
}
```

---

## 🎯 Migration Strategy

### **Phase 1: Keep Polling (Current - Works!)**
```tsx
<NotificationProvider useSSE={false}>
```
- ✅ Already implemented
- ✅ Stable and tested
- ✅ Works fine for current scale

### **Phase 2: Test SSE Alongside (Safe)**
```tsx
<NotificationProvider useSSE={true}>
```
- Test with a few users
- Monitor server load
- Compare reliability

### **Phase 3: Switch Based on Feature Flag**
```tsx
const useSSE = process.env.NEXT_PUBLIC_USE_SSE === 'true';

<NotificationProvider useSSE={useSSE}>
```
- Easy to toggle
- Can rollback instantly
- A/B test performance

---

## 🔍 When to Switch to SSE

**Switch when you experience:**
1. **Server load issues** from polling (>100 concurrent users)
2. **Need faster updates** (< 10 second latency)
3. **Battery drain complaints** on mobile (polling drains battery)
4. **Bandwidth concerns** (polling wastes requests)

**Stick with polling if:**
- ✅ Current system works fine
- ✅ User base < 100 concurrent users
- ✅ 30-60s delay is acceptable
- ✅ You want simplicity

---

## 🚫 Skip WebSockets Unless...

**Only implement WebSockets if you need:**
1. **Bi-directional real-time** (client ↔ server continuous communication)
2. **Binary data streaming** (video, audio, files)
3. **Sub-second latency** required
4. **Gaming, collaborative editing, or live streaming**

**Why WebSockets are harder:**
- Need message queue (Redis, RabbitMQ)
- Complex state management
- Manual reconnection logic
- Harder to scale (sticky sessions)
- CORS complexities
- More infrastructure costs

---

## 💡 My Recommendation

### **For ToolBoxx, I recommend:**

1. **Short term (Now):** ✅ Keep polling - it works!
2. **Medium term (3-6 months):** Consider SSE if user base grows
3. **Long term (1+ years):** Only consider WebSockets if you add real-time chat

### **Implementation Priority:**

```
Priority 1 (Do Now):
✅ Fix any bugs in current polling system
✅ Optimize polling intervals (30-60s is fine)
✅ Add notification preferences UI

Priority 2 (Next Quarter):
🟡 Implement SSE (if > 100 concurrent users)
🟡 Add notification history
🟡 Add analytics

Priority 3 (Future):
⚪ WebSockets (only if adding real-time features)
⚪ Advanced scaling (load balancers, etc.)
```

---

## 📊 Performance Comparison

### **Current Polling (30s interval, 100 users)**
- Requests/minute: 200 (100 users × 2 requests)
- Server load: Low-Medium
- Latency: 0-30s
- Bandwidth: ~5 KB/user/minute
- **Total: ~500 KB/minute**

### **SSE (100 users)**
- Requests/minute: 100 (persistent connections)
- Server load: Low
- Latency: < 1s
- Bandwidth: ~2 KB/user/minute (heartbeats)
- **Total: ~200 KB/minute**

### **WebSockets (100 users)**
- Requests/minute: 100 (persistent connections)
- Server load: Low-Medium (more complex)
- Latency: < 100ms
- Bandwidth: ~1 KB/user/minute
- **Total: ~100 KB/minute**
- **BUT: Much more complex to implement and maintain**

---

## ✅ Conclusion

**For your ToolBoxx project:**

1. **Keep current polling system** - it's working fine!
2. **Consider SSE** when you hit 100+ concurrent users or need < 10s updates
3. **Skip WebSockets** - unnecessary complexity for your use case

**SSE gives you 90% of WebSocket benefits with 10% of the complexity!**

---

## 🔗 Resources

- [MDN: EventSource API](https://developer.mozilla.org/en-US/docs/Web/API/EventSource)
- [Next.js Streaming](https://nextjs.org/docs/app/building-your-application/routing/route-handlers#streaming)
- [SSE vs WebSockets](https://ably.com/topic/server-sent-events-vs-websockets)

---

**Last Updated:** December 19, 2025
