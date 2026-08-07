import type { CollectionConfig } from 'payload';
import { isSuperAdmin } from '@/lib/access';

export const PageViews: CollectionConfig = {
  slug: 'page-views',
  admin: {
    hidden: true, // Hide from sidebar to avoid clutter
    useAsTitle: 'id',
  },
  access: {
    read: ({ req }) => isSuperAdmin(req.user), // Only super admins can read raw views
    create: () => false, // Only created via internal API
    update: () => false,
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  fields: [
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Store View', value: 'store_view' },
        { label: 'Product View', value: 'product_view' },
      ],
      required: true,
      index: true,
    },
    {
      name: 'tenantId',
      type: 'relationship',
      relationTo: 'tenants',
      required: true,
      index: true,
    },
    {
      name: 'productId',
      type: 'relationship',
      relationTo: 'products',
      required: false,
      index: true,
      admin: {
        condition: (data) => data.type === 'product_view',
      },
    },
    {
      name: 'visitorId',
      type: 'text',
      required: true,
      index: true,
    },
  ],
};
