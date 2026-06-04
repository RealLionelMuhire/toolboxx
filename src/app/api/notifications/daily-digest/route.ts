/**
 * Daily Notification Digest API Route
 * Sends daily summary notifications to users who have enabled notifications
 *
 * This endpoint should be called once per day via:
 * - External cron service (e.g., cron-job.org, EasyCron)
 * - DigitalOcean managed cron (App Platform) or system cron on Droplet
 * - Railway/Render cron jobs
 *
 * Security: Protected by API key in Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayloadSingleton } from '@/lib/payload-singleton';
import { createNotification, notifyWeeklySummary } from '@/lib/notifications/notification-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for execution

// ── Per-user processing ───────────────────────────────────────────────────────
// Extracted so it can be called inside batched Promise.all without nesting
async function processUser(
  userId: string,
  dayOfWeek: number,
  today: Date,
  payload: Awaited<ReturnType<typeof getPayloadSingleton>>
): Promise<{ userId: string; type: string; success: boolean }[]> {
  const results: { userId: string; type: string; success: boolean }[] = [];

  const user = await payload.findByID({ collection: 'users', id: userId, depth: 0 });
  if (!user) return results;

  const isTenant   = user.roles?.includes('tenant');
  const isCustomer = user.roles?.includes('client');

  // ── Tenant notifications ─────────────────────────────────────────────────
  if (isTenant && user.tenants && user.tenants.length > 0) {
    const tenantId = typeof user.tenants[0] === 'string' ? user.tenants[0] : (user.tenants[0] as any)?.id;
    if (!tenantId) return results;

    // Unverified transactions reminder
    const unverifiedTransactions = await payload.find({
      collection: 'transactions',
      where: { tenant: { equals: tenantId }, status: { in: ['pending', 'awaiting_verification'] } },
      limit: 10,
      depth: 0,
    });

    if (unverifiedTransactions.totalDocs > 0) {
      const success = await createNotification({
        userId,
        type: 'transaction',
        title: 'Pending Transactions Reminder',
        message: `You have ${unverifiedTransactions.totalDocs} unverified transaction${unverifiedTransactions.totalDocs > 1 ? 's' : ''} waiting for verification.`,
        icon: '💳',
        url: '/verify-payments',
        priority: 'high',
        sendPush: true,
      });
      results.push({ userId, type: 'pending-transactions', success });
    }

    // Weekly summary on Monday
    if (dayOfWeek === 1) {
      const lastWeek = new Date(today);
      lastWeek.setDate(lastWeek.getDate() - 7);

      const orders = await payload.find({
        collection: 'orders',
        where: { tenant: { equals: tenantId }, createdAt: { greater_than_equal: lastWeek.toISOString() } },
        limit: 1000,
        depth: 0,
      });

      const totalSales  = orders.docs.reduce((sum, order) => sum + ((order as any).totalPrice || 0), 0);
      const totalOrders = orders.totalDocs;

      const productCounts: Record<string, number> = {};
      orders.docs.forEach(order => {
        const productId = typeof order.product === 'string' ? order.product : (order.product as any)?.id;
        if (productId) productCounts[productId] = (productCounts[productId] || 0) + 1;
      });

      const topProductId = Object.entries(productCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      let topProductName = 'N/A';
      if (topProductId) {
        try {
          const topProduct = await payload.findByID({ collection: 'products', id: topProductId, depth: 0 });
          topProductName = topProduct?.name || 'N/A';
        } catch { /* ignore */ }
      }

      const success = await notifyWeeklySummary(userId, totalSales, totalOrders, topProductName);
      results.push({ userId, type: 'weekly-summary', success });
    }
  }

  // ── Customer notifications ───────────────────────────────────────────────
  if (isCustomer) {
    const pendingOrders = await payload.find({
      collection: 'orders',
      where: { buyer: { equals: userId }, status: { in: ['pending', 'processing', 'shipped'] } },
      limit: 10,
      depth: 0,
    });

    if (pendingOrders.totalDocs > 0) {
      const success = await createNotification({
        userId,
        type: 'order',
        title: 'Order Status Update',
        message: `You have ${pendingOrders.totalDocs} active order${pendingOrders.totalDocs > 1 ? 's' : ''}. Check the status!`,
        icon: '📦',
        url: '/orders',
        priority: 'normal',
        sendPush: true,
      });
      results.push({ userId, type: 'pending-orders', success });
    }
  }

  // ── Unread messages ──────────────────────────────────────────────────────
  const unreadMessages = await payload.find({
    collection: 'messages',
    where: { receiver: { equals: userId }, read: { equals: false } },
    limit: 100,
    depth: 0,
  });

  if (unreadMessages.totalDocs > 0) {
    const success = await createNotification({
      userId,
      type: 'message',
      title: 'Unread Messages',
      message: `You have ${unreadMessages.totalDocs} unread message${unreadMessages.totalDocs > 1 ? 's' : ''}.`,
      icon: '💬',
      url: '/messages',
      priority: 'normal',
      sendPush: true,
    });
    results.push({ userId, type: 'unread-messages', success });
  }

  // ── Daily engagement nudge ────────────────────────────────────────────────
  const dailyNotifications = [
    { title: 'Good Morning!',        message: "Check out today's featured products and trending deals!",     url: '/' },
    { title: 'New Arrivals Today',   message: 'Fresh products just added! Be the first to check them out.',  url: '/products' },
    { title: 'Hot Deals Alert',      message: "Don't miss out on today's special offers and discounts!",     url: '/' },
    { title: 'Discover Something New', message: 'Explore trending products and top-rated stores today!',     url: '/' },
    { title: 'Daily Update',         message: "See what's popular and what your favorite stores are offering!", url: '/' },
    { title: 'Your Daily Picks',     message: 'Handpicked products and deals just for you!',                  url: '/' },
    { title: 'Start Your Day Right', message: 'Browse new products and connect with sellers today!',          url: '/' },
  ];

  const dailyNotification = dailyNotifications[dayOfWeek % dailyNotifications.length]!;
  const success = await createNotification({
    userId,
    type: 'engagement',
    title: dailyNotification.title,
    message: dailyNotification.message,
    url: dailyNotification.url,
    priority: 'low',
    sendPush: true,
  });
  results.push({ userId, type: 'daily-engagement', success });

  return results;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Verify API key for security
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CRON_SECRET || process.env.PAYLOAD_SECRET;

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload  = await getPayloadSingleton();
    const today    = new Date();
    const dayOfWeek = today.getDay();

    console.log('[Daily Digest] Starting...');

    // ── Paginated subscription fetch (was a risky limit:1000 in one shot) ──
    const userIdsWithNotifications = new Set<string>();
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const batch = await payload.find({
        collection: 'push-subscriptions',
        limit: 100,
        page,
        depth: 0,
        where: { isActive: { equals: true } },
      });

      batch.docs.forEach(sub => {
        const id = typeof sub.user === 'string' ? sub.user : (sub.user as any)?.id;
        if (id) userIdsWithNotifications.add(id);
      });

      hasMore = batch.hasNextPage;
      page++;
    }

    console.log(`[Daily Digest] ${userIdsWithNotifications.size} users to process`);

    // ── Process users in concurrent batches of 10 ─────────────────────────
    // Sequential per-user was causing OOM + timeouts with large user bases.
    const BATCH_SIZE = 10;
    const userIdArray = Array.from(userIdsWithNotifications);
    let notificationsSent = 0;
    const results: { userId: string; type: string; success: boolean }[] = [];

    for (let i = 0; i < userIdArray.length; i += BATCH_SIZE) {
      const batch = userIdArray.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.allSettled(
        batch.map(userId => processUser(userId, dayOfWeek, today, payload))
      );

      batchResults.forEach((result, idx) => {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
          notificationsSent += result.value.filter(r => r.success).length;
        } else {
          console.error(`[Daily Digest] Error processing user ${batch[idx]}:`, result.reason);
          results.push({ userId: batch[idx]!, type: 'error', success: false });
        }
      });
    }

    console.log(`[Daily Digest] Complete. Sent ${notificationsSent} notifications.`);

    return NextResponse.json({
      success: true,
      message: 'Daily digest sent',
      stats: {
        usersProcessed: userIdsWithNotifications.size,
        notificationsSent,
        dayOfWeek,
        timestamp: today.toISOString(),
      },
      results,
    });
  } catch (error) {
    console.error('[Daily Digest] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to send daily digest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
