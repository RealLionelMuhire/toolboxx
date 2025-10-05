import type { CollectionConfig } from "payload";

import { Tenant } from "@/payload-types";
import { isSuperAdmin } from "@/lib/access";

export const Products: CollectionConfig = {
  slug: "products",
  access: {
    create: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      const tenant = req.user?.tenants?.[0]?.tenant as Tenant

      return Boolean(tenant?.isVerified);
    },
    read: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      // For regular tenants, only show products they own
      const tenant = req.user?.tenants?.[0]?.tenant;
      if (tenant) {
        return {
          tenant: {
            equals: tenant,
          },
        };
      }

      return false;
    },
    update: ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      // For regular tenants, only allow updating their own products
      const tenant = req.user?.tenants?.[0]?.tenant;
      if (tenant) {
        return {
          tenant: {
            equals: tenant,
          },
        };
      }

      return false;
    },
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: "name",
    description: "You must verify your account before creating products",
    defaultColumns: ["name", "description", "price", "category", "tenant"],
    listSearchableFields: ["name", "description"],
  },
  hooks: {
    beforeChange: [
      ({ req, data }) => {
        // Auto-assign tenant for non-super-admin users
        if (!isSuperAdmin(req.user) && req.user?.tenants?.[0]?.tenant) {
          data.tenant = req.user.tenants[0].tenant;
        }
        return data;
      },
    ],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
      admin: {
        condition: (data, siblingData, { user }) => {
          // Only show tenant field to super admins
          return isSuperAdmin(user);
        },
        description: "🏢 Tenant who owns this product",
      },
    },
    {
      name: "description",
      type: "richText",
    },
    {
      name: "price",
      type: "number",
      required: true,
      admin: {
        description: "Price in Rwandan Francs (RWF)"
      }
    },
    {
      name: "category",
      type: "relationship",
      relationTo: "categories",
      hasMany: false,
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "tags",
      hasMany: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "cover",
      type: "upload",
      relationTo: "media",
    },
    {
      name: "refundPolicy",
      type: "select",
      options: ["30-day", "14-day", "7-day", "3-day", "1-day", "no-refunds"],
      defaultValue: "30-day",
    },
    {
      name: "content",
      type: "richText",
      admin: {
        description:
          "Protected content only visible to customers after purchase. Add product documentation, downloadable files, getting started guides, and bonus materials. Supports Markdown formatting"
      },
    },
    {
      name: "isPrivate",
      label: "Private",
      defaultValue: false,
      type: "checkbox",
      admin: {
        description: "If checked, this product will not be shown on the public storefront"
      },
    },
    {
      name: "isArchived",
      label: "Archive",
      defaultValue: false,
      type: "checkbox",
      admin: {
        description: "If checked, this product will be archived"
      },
    },
  ],
};
