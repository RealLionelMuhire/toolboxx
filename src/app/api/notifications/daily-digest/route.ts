/**
 * Daily Notification Digest API Route
 * Sends daily summary notifications to users who have enabled notifications
 * 
 * This endpoint should be called once per day via:
 * - External cron service (e.g., cron-job.org, EasyCron)
 * - Railway/Render cron jobs
 * - Vercel Cron Jobs
 * 
 * Security: Protected by API key in Authorization header
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { createNotification, notifyWeeklySummary, notifyInactiveUser } from '@/lib/notifications/notification-manager';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60 seconds for execution

export async function POST(req: NextRequest) {
  try {
    // Verify API key for security
    const authHeader = req.headers.get('authorization');
    const apiKey = process.env.CRON_SECRET || process.env.PAYLOAD_SECRET;
    
    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await getPayload({ config });
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    console.log('[Daily Digest] Starting daily notification digest...');

    // Get all users who have push subscriptions (notifications enabled)
    const subscriptionsResult = await payload.find({
      collection: 'push-subscriptions',
      limit: 1000,
      where: {
        isActive: {
          equals: true,
        },
      },
    });

    const userIdsWithNotifications = new Set(
      subscriptionsResult.docs.map(sub => 
        typeof sub.user === 'string' ? sub.user : sub.user?.id
      ).filter(Boolean)
    );

    console.log(`[Daily Digest] Found ${userIdsWithNotifications.size} users with notifications enabled`);

    let notificationsSent = 0;
    const results: { userId: string; type: string; success: boolean }[] = [];

    // For each user with notifications enabled
    for (const userId of userIdsWithNotifications) {
      if (!userId) continue;

      try {
        // Get user details
        const user = await payload.findByID({
          collection: 'users',
          id: userId,
        });

        if (!user) continue;

        const isTenant = user.roles?.includes('tenant');
        const isCustomer = user.roles?.includes('client');
        
        console.log(`[Daily Digest] Processing user ${userId}: Tenant=${isTenant}, Customer=${isCustomer}`);


        // For tenants: Check for pending transactions and send daily summary
        if (isTenant && user.tenants && user.tenants.length > 0) {
          const tenantId = typeof user.tenants[0] === 'string' ? user.tenants[0] : user.tenants[0]?.id;

          if (!tenantId) continue;

          // Check for unverified transactions
          const unverifiedTransactions = await payload.find({
            collection: 'transactions',
            where: {
              tenant: { equals: tenantId },
              status: { in: ['pending', 'awaiting_verification'] },
            },
            limit: 10,
          });
          
          console.log(`[Daily Digest] User ${userId}: Found ${unverifiedTransactions.totalDocs} unverified transactions`);

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
            if (success) notificationsSent++;
          }

          // On Monday (1), send weekly summary
          if (dayOfWeek === 1) {
            // Get last week's sales data
            const lastWeek = new Date(today);
            lastWeek.setDate(lastWeek.getDate() - 7);

            const orders = await payload.find({
              collection: 'orders',
              where: {
                tenant: { equals: tenantId },
                createdAt: { greater_than_equal: lastWeek.toISOString() },
              },
              limit: 1000,
            });

            const totalSales = orders.docs.reduce((sum, order) => sum + ((order as any).totalPrice || 0), 0);
            const totalOrders = orders.totalDocs;

            // Get top product
            const productCounts: Record<string, number> = {};
            orders.docs.forEach(order => {
              const productId = typeof order.product === 'string' ? order.product : order.product?.id;
              if (productId) {
                productCounts[productId] = (productCounts[productId] || 0) + 1;
              }
            });

            const topProductId = Object.entries(productCounts)
              .sort((a, b) => b[1] - a[1])[0]?.[0];

            let topProductName = 'N/A';
            if (topProductId) {
              try {
                const topProduct = await payload.findByID({
                  collection: 'products',
                  id: topProductId,
                });
                topProductName = topProduct?.name || 'N/A';
              } catch (e) {
                console.error('Error fetching top product:', e);
              }
            }

            const success = await notifyWeeklySummary(
              userId,
              totalSales,
              totalOrders,
              topProductName
            );

            results.push({ userId, type: 'weekly-summary', success });
            if (success) notificationsSent++;
          }
        }

        // For customers: Check for pending orders
        if (isCustomer) {
          const pendingOrders = await payload.find({
            collection: 'orders',
            where: {
              buyer: { equals: userId },
              status: { 
                in: ['pending', 'processing', 'shipped'] 
              },
            },
            limit: 10,
          });
          
          console.log(`[Daily Digest] User ${userId}: Found ${pendingOrders.totalDocs} pending orders`);

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
            if (success) notificationsSent++;
          }
        }

        // Check for unread messages
        const unreadMessages = await payload.find({
          collection: 'messages',
          where: {
            receiver: { equals: userId },
            read: { equals: false },
          },
          limit: 100,
        });
        
        console.log(`[Daily Digest] User ${userId}: Found ${unreadMessages.totalDocs} unread messages`);

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
          if (success) notificationsSent++;
        }

        // Send daily engagement notification to ALL users with notifications enabled
        // This keeps users engaged and reminds them to check the app
        const dailyNotifications = [
          {
            title: "Good Morning!",
            message: "Check out today's featured products and trending deals!",
            url: "/",
          },
          {
            title: "New Arrivals Today",
            message: "Fresh products just added! Be the first to check them out.",
            url: "/products",
          },
          {
            title: "Hot Deals Alert",
            message: "Don't miss out on today's special offers and discounts!",
            url: "/",
          },
          {
            title: "Discover Something New",
            message: "Explore trending products and top-rated stores today!",
            url: "/",
          },
          {
            title: "Daily Update",
            message: "See what's popular and what your favorite stores are offering!",
            url: "/",
          },
          {
            title: "Your Daily Picks",
            message: "Handpicked products and deals just for you!",
            url: "/",
          },
          {
            title: "Start Your Day Right",
            message: "Browse new products and connect with sellers today!",
            url: "/",
          },
        ];

        // Select a different notification based on day of week
        const notificationIndex = dayOfWeek % dailyNotifications.length;
        const dailyNotification = dailyNotifications[notificationIndex]!;
        
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
        if (success) notificationsSent++;
        console.log(`[Daily Digest] Sent daily engagement notification to ${userId}`);

      } catch (userError) {
        console.error(`[Daily Digest] Error processing user ${userId}:`, userError);
        results.push({ userId, type: 'error', success: false });
      }
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
    console.error('[Daily Digest] Error:', error);
    return NextResponse.json(
      { error: 'Failed to send daily digest', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
