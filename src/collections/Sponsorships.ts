import type { CollectionConfig } from "payload";
import { isSuperAdmin } from "@/lib/access";

export const Sponsorships: CollectionConfig = {
  slug: "sponsorships",
  admin: {
    useAsTitle: "id",
    defaultColumns: ["product", "tenant", "status", "startDate", "endDate"],
    group: "Store Management",
  },
  access: {
    read: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      // Tenants can read their own sponsorships
      const tenant = req.user?.tenants?.[0]?.tenant;
      if (tenant) {
        return {
          tenant: {
            equals: typeof tenant === 'string' ? tenant : tenant.id,
          },
        };
      }
      return false;
    },
    create: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      // Tenants can create sponsorships
      return Boolean(req.user?.tenants?.[0]?.tenant);
    },
    update: ({ req }) => isSuperAdmin(req.user), // Only admins can update (approve/reject)
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  hooks: {
    beforeChange: [
      ({ req, data, operation }) => {
        // Auto-assign tenant for non-super-admin users on create
        if (!isSuperAdmin(req.user) && req.user?.tenants?.[0]?.tenant && operation === 'create') {
          const userTenant = req.user.tenants[0].tenant;
          data.tenant = typeof userTenant === 'string' ? userTenant : userTenant.id;
        }
        return data;
      }
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Auto-sync the product's sponsorshipStatus whenever the sponsorship is updated
        if (doc.product) {
          const productId = typeof doc.product === 'string' ? doc.product : doc.product.id;
          
          let productStatus = 'none';
          if (doc.status === 'pending') productStatus = 'pending';
          else if (doc.status === 'active') productStatus = 'approved';
          else if (doc.status === 'rejected') productStatus = 'rejected';
          else if (doc.status === 'expired') productStatus = 'none';

          try {
            await req.payload.update({
              collection: "products",
              id: productId,
              data: {
                sponsorshipStatus: productStatus,
              } as any,
              overrideAccess: true, // We must bypass access control since tenants can't update sponsorshipStatus directly
            });
          } catch (error) {
            console.error("Failed to sync sponsorship status to product", error);
          }
        }
        return doc;
      }
    ]
  },
  fields: [
    {
      name: "approveAction",
      type: "ui",
      admin: {
        components: {
          Field: "@/components/admin/ApproveSponsorshipButton#ApproveSponsorshipButton",
        },
      },
    },
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      required: true,
      hasMany: false,
    },
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
      hasMany: false,
      admin: {
        readOnly: true, // Auto-populated via hook
      }
    },
    {
      name: "status",
      type: "select",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Active", value: "active" },
        { label: "Rejected", value: "rejected" },
        { label: "Expired", value: "expired" },
      ],
      defaultValue: "pending",
      required: true,
      admin: {
        components: {
          Cell: "@/components/admin/ApproveSponsorshipCell#ApproveSponsorshipCell",
        }
      }
    },
    {
      name: "startDate",
      type: "date",
      admin: {
        description: "When does the sponsorship begin?",
      }
    },
    {
      name: "endDate",
      type: "date",
      admin: {
        description: "When does the sponsorship end?",
      }
    },
    {
      name: "adminNotes",
      type: "textarea",
      admin: {
        description: "Internal notes visible only to admins (e.g. reason for rejection)",
      },
      access: {
        read: ({ req }) => isSuperAdmin(req.user),
      }
    }
  ],
};
