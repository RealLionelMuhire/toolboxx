import type { CollectionConfig } from "payload";
import { isSuperAdmin } from "@/lib/access";

export const Proformas: CollectionConfig = {
  slug: "proformas",
  admin: {
    useAsTitle: "proformaNumber",
    defaultColumns: ["proformaNumber", "tenant", "status", "totalAmount", "validUntil"],
    description: "Quotes/Pro Formas created by sellers for their clients",
  },
  hooks: {
    beforeChange: [
      async ({ data, operation, req }) => {
        // Auto-generate proformaNumber on create
        if (operation === "create" && !data.proformaNumber) {
          const timestamp = Date.now().toString().slice(-6);
          const random = Math.random().toString(36).substring(2, 5).toUpperCase();
          data.proformaNumber = `PF-${timestamp}-${random}`;
        }
        
        // Ensure tenant is set
        if (operation === "create" && !data.tenant) {
          if (req.user?.tenants && req.user.tenants.length > 0) {
            const tenantRel = req.user.tenants[0];
            if (tenantRel) {
              data.tenant = typeof tenantRel.tenant === 'string' ? tenantRel.tenant : tenantRel.tenant?.id;
            }
          }
        }
        
        // Calculate totals
        if (data.items && Array.isArray(data.items)) {
          let total = 0;
          data.items.forEach((item: any) => {
            const qty = item.quantity || 1;
            const price = item.unitPrice || 0;
            total += qty * price;
          });
          data.subTotal = total;
          data.totalAmount = total; // can be adjusted if we add tax or discount logic later
        }

        return data;
      },
    ],
  },
  access: {
    read: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true;

      return true; // Allowing true here so public pages can fetch it.
    },
    create: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      if (!req.user?.tenants || req.user.tenants.length === 0) return false;
      return true;
    },
    update: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      if (!req.user?.tenants || req.user.tenants.length === 0) return false;
      
      const tenantRel = req.user.tenants[0];
      if (!tenantRel) return false;
      const tenantId = typeof tenantRel.tenant === 'string' ? tenantRel.tenant : tenantRel.tenant?.id;
      
      return {
        tenant: {
          equals: tenantId,
        },
      };
    },
    delete: async ({ req }) => {
      if (isSuperAdmin(req.user)) return true;
      if (!req.user?.tenants || req.user.tenants.length === 0) return false;
      
      const tenantRel = req.user.tenants[0];
      if (!tenantRel) return false;
      const tenantId = typeof tenantRel.tenant === 'string' ? tenantRel.tenant : tenantRel.tenant?.id;
      
      return {
        tenant: {
          equals: tenantId,
        },
      };
    },
  },
  fields: [
    {
      name: "proformaNumber",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Unique pro forma reference number",
        readOnly: true,
      },
    },
    {
      name: "tenant",
      type: "relationship",
      relationTo: "tenants",
      required: true,
      admin: {
        description: "Seller creating this pro forma",
      },
    },
    {
      name: "customerDetails",
      type: "group",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "email",
          type: "text",
        },
        {
          name: "phone",
          type: "text",
        },
        {
          name: "address",
          type: "text",
        },
      ],
    },
    {
      name: "items",
      type: "array",
      required: true,
      minRows: 1,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
        },
        {
          name: "quantity",
          type: "number",
          required: true,
          min: 1,
          defaultValue: 1,
        },
        {
          name: "unitPrice",
          type: "number",
          required: true,
          admin: {
            description: "Price per unit (can be adjusted by seller)",
          },
        },
      ],
    },
    {
      name: "subTotal",
      type: "number",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "totalAmount",
      type: "number",
      required: true,
      admin: {
        description: "Total pro forma amount in RWF",
        readOnly: true,
      },
    },
    {
      name: "validUntil",
      type: "date",
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      required: true,
      options: [
        { label: "Pending", value: "pending" },
        { label: "Paid", value: "paid" },
        { label: "Declined", value: "declined" },
        { label: "Converted to Order", value: "converted" },
        // Legacy statuses kept for backward compatibility if needed
        { label: "Draft", value: "draft" },
        { label: "Sent", value: "sent" },
        { label: "Accepted", value: "accepted" },
        { label: "Rejected", value: "rejected" },
      ],
    },
    {
      name: "notes",
      type: "textarea",
      admin: {
        description: "Terms, conditions, or any additional notes for the client",
      },
    },
  ],
};
