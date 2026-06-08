import { isSuperAdmin } from '@/lib/access'
import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    // Allow super admins and tenants to create (upload) media
    create: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      // Any authenticated tenant can upload media
      if (req.user?.roles?.includes('tenant')) return true;
      // Also allow users with a tenant relationship (tenant users)
      if (req.user?.tenants && req.user.tenants.length > 0) return true;
      return false;
    },
    // Allow super admins and tenants to delete media
    delete: ({ req }) => {
      // Super admins can delete anything
      if (isSuperAdmin(req.user)) {
        return true;
      }
      
      // Tenants can delete media (they need it for product management)
      if (req.user?.roles?.includes('tenant')) {
        return true;
      }

      // Also allow users with a tenant relationship
      if (req.user?.tenants && req.user.tenants.length > 0) {
        return true;
      }
      
      return false;
    },
  },
  admin: {
    hidden: ({ user }) => !isSuperAdmin(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: false, // Not required - we'll set defaults in the API
      admin: {
        description: 'Alternative text for accessibility (auto-generated if not provided)',
      },
    },
  ],
  upload: true,
}
