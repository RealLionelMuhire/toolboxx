import { NextRequest } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint for real-time notifications
 * Usage: EventSource('/api/notifications/stream?userId=xxx')
 */
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId parameter', { status: 400 });
  }

  console.log(`[SSE] New connection for user: ${userId}`);

  const encoder = new TextEncoder();
  let lastPaymentCheck = new Date();
  let lastOrderCheck = new Date();
  let lastMessageCheck = new Date();
  let isClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const safeEnqueue = (data: Uint8Array) => {
        if (!isClosed) {
          try {
            controller.enqueue(data);
          } catch {
            // Stream already closed
          }
        }
      };

      safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`));

      const intervalId = setInterval(async () => {
        if (isClosed) return;
        try {
          const payload = await getPayload({ config });
          const now = new Date();

          try {
            const recentPayments = await payload.find({
              collection: 'transactions',
              where: {
                and: [
                  { tenant: { equals: userId } },
                  { createdAt: { greater_than: lastPaymentCheck.toISOString() } }
                ]
              },
              limit: 10,
              sort: '-createdAt'
            });
            if (recentPayments.docs.length > 0) {
              for (const payment of recentPayments.docs) {
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'payment', data: { id: payment.id, amount: (payment as any).amount, currency: (payment as any).currency || 'RWF', phoneNumber: (payment as any).phoneNumber, status: payment.status, createdAt: payment.createdAt } })}\n\n`));
              }
              lastPaymentCheck = now;
            }
          } catch (e) { console.error('[SSE] payments:', e); }

          try {
            const recentOrders = await payload.find({
              collection: 'orders',
              where: {
                and: [
                  { orderedBy: { equals: userId } },
                  { updatedAt: { greater_than: lastOrderCheck.toISOString() } }
                ]
              },
              limit: 10,
              sort: '-updatedAt'
            });
            if (recentOrders.docs.length > 0) {
              for (const order of recentOrders.docs) {
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'order', data: { id: order.id, orderId: (order as any).orderId || order.id, status: order.status, total: (order as any).total, updatedAt: order.updatedAt } })}\n\n`));
              }
              lastOrderCheck = now;
            }
          } catch (e) { console.error('[SSE] orders:', e); }

          try {
            const recentMessages = await payload.find({
              collection: 'messages',
              where: {
                and: [
                  {
                    or: [
                      { sender: { equals: userId } },
                      { recipient: { equals: userId } }
                    ]
                  },
                  { createdAt: { greater_than: lastMessageCheck.toISOString() } }
                ]
              },
              limit: 10,
              sort: '-createdAt'
            });
            for (const message of recentMessages.docs) {
              const m = message as any;
              if (m.recipient === userId && m.sender !== userId) {
                safeEnqueue(encoder.encode(`data: ${JSON.stringify({ type: 'message', data: { id: message.id, sender: typeof m.sender === 'object' ? m.sender?.name || 'Unknown' : m.sender, text: m.text || m.content || '', conversationId: m.conversation, createdAt: message.createdAt } })}\n\n`));
              }
            }
            lastMessageCheck = now;
          } catch (e) { console.error('[SSE] messages:', e); }

          safeEnqueue(encoder.encode(`: heartbeat ${now.toISOString()}\n\n`));
        } catch (e) { console.error('[SSE] loop:', e); }
      }, 10000);

      // Don't call controller.close() - races with enqueue (nodejs/node#62036).
      // isClosed + clearInterval stops writes; runtime cleans up when connection drops.
      req.signal.addEventListener('abort', () => {
        isClosed = true;
        clearInterval(intervalId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
