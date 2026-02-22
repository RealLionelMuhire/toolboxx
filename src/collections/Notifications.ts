import type { CollectionConfig } from 'payload';

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'type', 'user', 'seen', 'createdAt'],
    listSearchableFields: ['title', 'message'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      // Super admins can read all
      if (user.roles?.includes('super-admin')) return true;
      // Users can only read their own notifications
      return {
        user: { equals: user.id },
      };
    },
    create: ({ req: { user } }) => {
      // Only super admins and server-side code can create notifications
      return !!user?.roles?.includes('super-admin');
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      // Super admins can update all
      if (user.roles?.includes('super-admin')) return true;
      // Users can only update their own notifications (for marking as seen/read)
      return {
        user: { equals: user.id },
      };
    },
    delete: ({ req: { user } }) => {
      // Only super admins can delete
      return !!user?.roles?.includes('super-admin');
    },
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'The user who will receive this notification',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Payment', value: 'payment' },
        { label: 'Order', value: 'order' },
        { label: 'Message', value: 'message' },
        { label: 'Product', value: 'product' },
        { label: 'Transaction', value: 'transaction' },
        { label: 'System', value: 'system' },
        { label: 'Engagement', value: 'engagement' },
        { label: 'Promotion', value: 'promotion' },
        { label: 'Tender', value: 'tender' },
      ],
      admin: {
        description: 'The type of notification',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification title (shown in bold)',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Notification message content',
      },
    },
    {
      name: 'icon',
      type: 'text',
      admin: {
        description: 'Emoji or icon to display (e.g., 💰, 🛒, 💬)',
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        description: 'URL to navigate to when notification is clicked',
      },
    },
    {
      name: 'seen',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Whether the user has seen this notification',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        description: 'Whether the user has read/clicked this notification',
      },
    },
    {
      name: 'priority',
      type: 'select',
      defaultValue: 'normal',
      options: [
        { label: 'Low', value: 'low' },
        { label: 'Normal', value: 'normal' },
        { label: 'High', value: 'high' },
        { label: 'Urgent', value: 'urgent' },
      ],
      admin: {
        description: 'Notification priority level',
      },
    },
    {
      name: 'data',
      type: 'json',
      admin: {
        description: 'Additional data payload for the notification',
      },
    },
    {
      name: 'sentViaPush',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this notification was sent via push notification',
        readOnly: true,
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'Optional expiration date for time-sensitive notifications',
      },
    },
  ],
  timestamps: true,
};
