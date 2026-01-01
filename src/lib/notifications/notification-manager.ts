/**
 * Notification Manager
 * Centralized system for creating and managing in-app notifications
 */

import { sendPushNotification } from './send-push';

export type NotificationType = 
  | 'payment'
  | 'order'
  | 'message'
  | 'product'
  | 'transaction'
  | 'system'
  | 'engagement'
  | 'promotion';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CreateNotificationOptions {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  url?: string;
  priority?: NotificationPriority;
  data?: Record<string, any>;
  expiresAt?: Date;
  sendPush?: boolean; // Whether to also send push notification
}

/**
 * Create a notification in the database and optionally send push
 */
export async function createNotification(options: CreateNotificationOptions): Promise<boolean> {
  const {
    userId,
    type,
    title,
    message,
    icon,
    url,
    priority = 'normal',
    data = {},
    expiresAt,
    sendPush = true,
  } = options;

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Create notification in database
    const response = await fetch(`${appUrl}/api/notifications/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        type,
        title,
        message,
        icon,
        url,
        priority,
        data,
        expiresAt: expiresAt?.toISOString(),
      }),
    });

    if (!response.ok) {
      console.error('Failed to create notification:', await response.text());
      return false;
    }

    const result = await response.json();
    console.log('Notification created:', result);

    // Send push notification if enabled and user has subscriptions
    if (sendPush) {
      try {
        // Map notification types to push types
        const pushType = 
          type === 'engagement' || type === 'promotion' || type === 'system' || type === 'product' || type === 'transaction'
            ? 'general'
            : type;
        
        await sendPushNotification({
          userId,
          title: icon ? `${icon} ${title}` : title,
          body: message,
          url: url || '/',
          type: pushType,
          data,
        });
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError);
        // Don't fail the whole operation if push fails
      }
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Mark notification(s) as seen
 */
export async function markNotificationsAsSeen(
  notificationIds: string[]
): Promise<boolean> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${appUrl}/api/notifications/mark-seen`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationIds }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking notifications as seen:', error);
    return false;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    const response = await fetch(`${appUrl}/api/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Predefined notification templates
 */

export async function notifyPaymentReceived(
  userId: string,
  amount: number,
  reference: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'payment',
    title: 'Payment Received!',
    message: `You received a payment of ${amount.toLocaleString()} RWF (Ref: ${reference})`,
    icon: '💰',
    url: '/verify-payments',
    priority: 'high',
    data: { amount, reference },
  });
}

export async function notifyNewOrder(
  userId: string,
  orderId: string,
  productName: string,
  orderNumber: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'order',
    title: 'New Order Received!',
    message: `You have a new order for ${productName} (Order #${orderNumber})`,
    icon: '🛒',
    url: `/my-store/orders/${orderId}`,
    priority: 'high',
    data: { orderId, productName, orderNumber },
  });
}

export async function notifyNewMessage(
  userId: string,
  senderName: string,
  conversationId: string,
  preview: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'message',
    title: `New message from ${senderName}`,
    message: preview.substring(0, 100),
    icon: '💬',
    url: `/messages?id=${conversationId}`,
    priority: 'normal',
    data: { conversationId, senderName },
  });
}

export async function notifyLowStock(
  userId: string,
  productName: string,
  productId: string,
  quantity: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'product',
    title: 'Low Stock Alert',
    message: `${productName} is running low (${quantity} left in stock)`,
    icon: '📦',
    url: `/admin/collections/products/${productId}`,
    priority: 'normal',
    data: { productId, productName, quantity },
  });
}

export async function notifyOutOfStock(
  userId: string,
  productName: string,
  productId: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'product',
    title: 'Product Out of Stock',
    message: `${productName} is now out of stock. Update inventory to continue sales.`,
    icon: '⚠️',
    url: `/admin/collections/products/${productId}`,
    priority: 'high',
    data: { productId, productName },
  });
}

export async function notifyOrderStatusChange(
  userId: string,
  orderId: string,
  orderNumber: string,
  status: string,
  productName: string
): Promise<boolean> {
  const statusMessages: Record<string, string> = {
    shipped: 'Your order has been shipped! 📦',
    delivered: 'Your order has been delivered! 🎉',
    completed: 'Your order is complete. Thank you! ✅',
    cancelled: 'Your order has been cancelled.',
  };

  const statusIcons: Record<string, string> = {
    shipped: '📦',
    delivered: '🎉',
    completed: '✅',
    cancelled: '❌',
  };

  return createNotification({
    userId,
    type: 'order',
    title: `Order #${orderNumber} ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    message: statusMessages[status] || `Order status: ${status}`,
    icon: statusIcons[status] || '📋',
    url: `/my-orders/${orderId}`,
    priority: status === 'delivered' ? 'high' : 'normal',
    data: { orderId, orderNumber, status, productName },
  });
}

export async function notifyUnverifiedTransaction(
  userId: string,
  transactionId: string,
  reference: string,
  hoursPending: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'transaction',
    title: 'Transaction Awaiting Verification',
    message: `Transaction ${reference} has been pending for ${hoursPending} hours. Please verify.`,
    icon: '⏰',
    url: `/verify-payments?transaction=${transactionId}`,
    priority: 'high',
    data: { transactionId, reference, hoursPending },
  });
}

export async function notifyWeeklySummary(
  userId: string,
  totalSales: number,
  totalOrders: number,
  topProduct: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'engagement',
    title: 'Your Weekly Summary is Ready! 📊',
    message: `${totalOrders} orders • ${totalSales.toLocaleString()} RWF • Top: ${topProduct}`,
    icon: '📈',
    url: '/my-store/analytics',
    priority: 'low',
    data: { totalSales, totalOrders, topProduct },
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
  });
}

export async function notifyInactiveUser(
  userId: string,
  daysSinceLastLogin: number
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'engagement',
    title: 'We Miss You! 👋',
    message: `It's been ${daysSinceLastLogin} days since your last visit. Check out what's new!`,
    icon: '💝',
    url: '/',
    priority: 'low',
    sendPush: true,
  });
}

export async function notifyPromotion(
  userId: string,
  title: string,
  message: string,
  url?: string
): Promise<boolean> {
  return createNotification({
    userId,
    type: 'promotion',
    title,
    message,
    icon: '🎁',
    url: url || '/',
    priority: 'low',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
  });
}
