import { GlobalConfig } from 'payload';
import { isSuperAdmin } from '../lib/access';

export const PlatformAnalytics: GlobalConfig = {
  slug: 'platform-analytics',
  label: 'Platform Analytics',
  access: {
    read: ({ req: { user } }) => isSuperAdmin(user),
    update: () => false,
  },
  admin: {
    group: 'Admin',
    components: {
      views: {
        edit: {
          root: {
            Component: '@/components/admin/PlatformAnalyticsView#PlatformAnalyticsView',
          },
        },
      },
    },
  },
  fields: [
    {
      name: 'dummy',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
  ],
};
