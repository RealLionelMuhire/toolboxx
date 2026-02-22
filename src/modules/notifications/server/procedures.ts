import { z } from 'zod';
import { protectedProcedure, createTRPCRouter } from '@/trpc/init';

export const notificationsRouter = createTRPCRouter({
  /**
   * Get all notifications for the current user
   */
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
        type: z.enum(['payment', 'order', 'message', 'product', 'transaction', 'system', 'engagement', 'promotion', 'tender']).optional(),
        unreadOnly: z.boolean().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {
        user: {
          equals: ctx.session.user.id,
        },
      };

      // Filter by type if provided
      if (input.type) {
        where.type = { equals: input.type };
      }

      // Filter by unread status if requested
      if (input.unreadOnly) {
        where.read = { equals: false };
      }

      const notifications = await ctx.db.find({
        collection: 'notifications',
        where,
        limit: input.limit,
        page: input.page,
        sort: '-createdAt',
        depth: 0,
      });

      return notifications;
    }),

  /**
   * Get unseen notification count
   */
  getUnseenCount: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.find({
      collection: 'notifications',
      where: {
        and: [
          {
            user: {
              equals: ctx.session.user.id,
            },
          },
          {
            seen: {
              equals: false,
            },
          },
        ],
      },
      limit: 100, // Reasonable limit for counting
      depth: 0,
    });

    return { count: notifications.totalDocs };
  }),

  /**
   * Get unread notification count
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const notifications = await ctx.db.find({
      collection: 'notifications',
      where: {
        and: [
          {
            user: {
              equals: ctx.session.user.id,
            },
          },
          {
            read: {
              equals: false,
            },
          },
        ],
      },
      limit: 100,
      depth: 0,
    });

    return { count: notifications.totalDocs };
  }),

  /**
   * Mark notification as seen
   */
  markAsSeen: protectedProcedure
    .input(
      z.object({
        notificationIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify all notifications belong to the current user
      const notifications = await ctx.db.find({
        collection: 'notifications',
        where: {
          and: [
            {
              id: {
                in: input.notificationIds,
              },
            },
            {
              user: {
                equals: ctx.session.user.id,
              },
            },
          ],
        },
        depth: 0,
      });

      // Update only the user's notifications
      const updatePromises = notifications.docs.map((notification) =>
        ctx.db.update({
          collection: 'notifications',
          id: notification.id,
          data: {
            seen: true,
          },
        })
      );

      await Promise.all(updatePromises);

      return { success: true, updated: notifications.docs.length };
    }),

  /**
   * Mark notification as read
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify notification belongs to current user
      const notification = await ctx.db.findByID({
        collection: 'notifications',
        id: input.notificationId,
        depth: 0,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const userId = typeof notification.user === 'string' 
        ? notification.user 
        : notification.user.id;

      if (userId !== ctx.session.user.id) {
        throw new Error('Unauthorized');
      }

      await ctx.db.update({
        collection: 'notifications',
        id: input.notificationId,
        data: {
          read: true,
          seen: true, // Also mark as seen
        },
      });

      return { success: true };
    }),

  /**
   * Mark all notifications as seen
   */
  markAllAsSeen: protectedProcedure.mutation(async ({ ctx }) => {
    // Find all unseen notifications for user
    const notifications = await ctx.db.find({
      collection: 'notifications',
      where: {
        and: [
          {
            user: {
              equals: ctx.session.user.id,
            },
          },
          {
            seen: {
              equals: false,
            },
          },
        ],
      },
      limit: 100,
      depth: 0,
    });

    // Update all to seen
    const updatePromises = notifications.docs.map((notification) =>
      ctx.db.update({
        collection: 'notifications',
        id: notification.id,
        data: {
          seen: true,
        },
      })
    );

    await Promise.all(updatePromises);

    return { success: true, updated: notifications.docs.length };
  }),

  /**
   * Delete a notification
   */
  deleteNotification: protectedProcedure
    .input(
      z.object({
        notificationId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify notification belongs to current user
      const notification = await ctx.db.findByID({
        collection: 'notifications',
        id: input.notificationId,
        depth: 0,
      });

      if (!notification) {
        throw new Error('Notification not found');
      }

      const userId = typeof notification.user === 'string' 
        ? notification.user 
        : notification.user.id;

      if (userId !== ctx.session.user.id) {
        throw new Error('Unauthorized');
      }

      await ctx.db.delete({
        collection: 'notifications',
        id: input.notificationId,
      });

      return { success: true };
    }),
});
