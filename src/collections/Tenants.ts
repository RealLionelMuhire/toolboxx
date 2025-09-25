import type { CollectionConfig } from 'payload';

import { isSuperAdmin } from '@/lib/access';

export const Tenants: CollectionConfig = {
  slug: 'tenants',
  access: {
    create: ({ req }) => isSuperAdmin(req.user),
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  admin: {
    useAsTitle: 'slug',
  },
  fields: [
    {
      name: "name",
      required: true,
      type: "text",
      label: "Store Name",
      admin: {
        description: "This is the name of the store (e.g. Antonio's Store)",
      },
    },
    {
      name: "slug",
      type: "text",
      index: true,
      required: true,
      unique: true,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description:
          "This is the subdomain for the store (e.g. [slug].funroad.com)",
      },
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
    },
    // Rwanda-specific fields
    {
      name: "tinNumber",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Tax Identification Number (TIN) - Required for Rwandan businesses",
      },
    },
    {
      name: "storeManagerId",
      type: "text",
      required: true,
      admin: {
        description: "Store Manager ID or Passport Number",
      },
    },
    {
      name: "rdbCertificate",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Rwanda Development Board (RDB) Registration Certificate (required for verification)",
      },
    },
    // Payment method fields
    {
      name: "paymentMethod",
      type: "select",
      required: true,
      options: [
        { label: "Bank Transfer", value: "bank_transfer" },
        { label: "Mobile Money (MOMO)", value: "momo_pay" }
      ],
      admin: {
        description: "Choose your preferred payment method",
      },
    },
    {
      name: "bankName",
      type: "text",
      admin: {
        condition: (data) => data.paymentMethod === 'bank_transfer',
        description: "Bank name for transfers",
      },
    },
    {
      name: "bankAccountNumber",
      type: "text",
      admin: {
        condition: (data) => data.paymentMethod === 'bank_transfer',
        description: "Bank account number for transfers",
      },
    },
    {
      name: "momoPayCode",
      type: "text",
      admin: {
        condition: (data) => data.paymentMethod === 'momo_pay',
        description: "Mobile Money (MOMO) Pay Code",
      },
    },
    // Verification fields
    {
      name: "isVerified",
      type: "checkbox",
      defaultValue: false,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Tenant verification status - can only be set by super admin",
      },
    },
    {
      name: "verificationStatus",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Document Verified", value: "document_verified" },
        { label: "Physically Verified", value: "physically_verified" },
        { label: "Rejected", value: "rejected" }
      ],
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Verification stage - can only be updated by super admin",
      },
    },
    {
      name: "verificationNotes",
      type: "textarea",
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Admin notes about verification process",
      },
    },
    // Physical verification fields
    {
      name: "physicalVerificationImages",
      type: "array",
      minRows: 3,
      maxRows: 8,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        condition: (data) => data.verificationStatus === 'physically_verified',
        description: "3-8 images from physical verification visit",
      },
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          required: true,
        },
        {
          name: "description",
          type: "text",
          admin: {
            description: "Brief description of what this image shows",
          },
        }
      ]
    },
    {
      name: "signedConsent",
      type: "upload",
      relationTo: "media",
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        condition: (data) => data.verificationStatus === 'physically_verified',
        description: "Signed consent document (PDF) from physical verification",
      },
    },
    // Merchant management
    {
      name: "canAddMerchants",
      type: "checkbox",
      defaultValue: false,
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Allow this tenant to add merchants - enabled after document verification",
      },
    },
    {
      name: "verifiedAt",
      type: "date",
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Date when tenant was verified",
      },
    },
    {
      name: "verifiedBy",
      type: "relationship",
      relationTo: "users",
      access: {
        update: ({ req }) => isSuperAdmin(req.user),
      },
      admin: {
        description: "Super admin who verified this tenant",
      },
    },
  ],
};
