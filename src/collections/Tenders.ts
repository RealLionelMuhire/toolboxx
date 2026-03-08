import type { CollectionConfig, Where } from 'payload'
import { isSuperAdmin } from '@/lib/access'
import { formatLocation } from '@/lib/location-data'

function buildTenderAccessQuery(userId: string): Where {
  return {
    or: [
      { status: { equals: 'open' } },
      { createdBy: { equals: userId } },
    ],
  }
}

function buildOwnerAccessQuery(userId: string): Where {
  return { createdBy: { equals: userId } }
}

export const Tenders: CollectionConfig = {
  slug: 'tenders',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['tenderNumber', 'title', 'type', 'status', 'createdBy', 'createdAt'],
    listSearchableFields: ['title', 'tenderNumber'],
  },
  access: {
    read: ({ req }) => {
      if (isSuperAdmin(req.user)) return true
      if (!req.user) return false
      return buildTenderAccessQuery(req.user.id)
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (isSuperAdmin(req.user)) return true
      if (!req.user) return false
      return buildOwnerAccessQuery(req.user.id)
    },
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create' && !data.tenderNumber) {
          const timestamp = Date.now().toString().slice(-8)
          const random = Math.random().toString(36).substring(2, 6).toUpperCase()
          data.tenderNumber = `TND-${timestamp}-${random}`
        }
        if (data.deliveryLocationCountry && data.deliveryLocationProvince && data.deliveryLocationDistrict) {
          data.deliveryLocation = formatLocation(
            data.deliveryLocationCountry,
            data.deliveryLocationProvince,
            data.deliveryLocationDistrict,
            data.deliveryAddress,
          )
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'tenderNumber',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'Auto-generated tender reference number',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'e.g. Supply of Office Furniture',
      },
    },
    {
      name: 'description',
      type: 'richText',
      required: true,
      admin: {
        description: 'Scope, requirements, specifications',
      },
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'rfq',
      options: [
        { label: 'Request for Quotation (RFQ)', value: 'rfq' },
        { label: 'Request for Proposal (RFP)', value: 'rfp' },
      ],
      index: true,
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      index: true,
      admin: {
        description: 'draft → open → closed | cancelled',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        description: 'User who created this tender',
        readOnly: true,
      },
    },
    {
      name: 'tenant',
      type: 'relationship',
      relationTo: 'tenants',
      index: true,
      admin: {
        description: 'Set when created by a store owner; null for buyer-created tenders',
        condition: (data, siblingData, { user }) => isSuperAdmin(user) || !!user?.tenants?.length,
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Relevant product categories for this tender',
      },
    },
    {
      name: 'items',
      type: 'array',
      maxRows: 50,
      admin: {
        description: 'Optional product line items for this tender',
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          admin: {
            description: 'Optional: reference existing product from catalog',
          },
        },
        {
          name: 'name',
          type: 'text',
          required: true,
          admin: {
            description: 'Item or product name',
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 0.001,
          admin: {
            description: 'Required quantity',
          },
        },
        {
          name: 'unit',
          type: 'text',
          defaultValue: 'unit',
          admin: {
            description: 'Unit of measurement',
          },
        },
        {
          name: 'specification',
          type: 'textarea',
          admin: {
            description: 'Additional specifications',
          },
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description: 'Optional: custom image; when product is selected from search, product image is used',
          },
        },
      ],
    },
    {
      name: 'documents',
      type: 'array',
      maxRows: 10,
      admin: {
        description: 'Supporting documents (specs, terms, drawings)',
      },
      fields: [
        {
          name: 'file',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'responseDeadline',
      type: 'date',
      admin: {
        description: 'Deadline for bid submissions',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
    {
      name: 'contactPreference',
      type: 'select',
      defaultValue: 'email',
      options: [
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'In-App Chat', value: 'chat' },
      ],
      admin: {
        description: 'How vendors should contact you off-platform',
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'USD',
      admin: {
        description: 'Currency for this tender (buyer preference)',
      },
    },
    {
      name: 'deliveryLocationCountry',
      type: 'select',
      admin: {
        description: 'Country where products can be delivered',
      },
      options: [
        { label: 'Rwanda', value: 'RW' },
        { label: 'Uganda', value: 'UG' },
        { label: 'Tanzania', value: 'TZ' },
      ],
    },
    {
      name: 'deliveryLocationProvince',
      type: 'text',
      admin: {
        description: 'Province/Region code',
      },
    },
    {
      name: 'deliveryLocationDistrict',
      type: 'text',
      admin: {
        description: 'District code',
      },
    },
    {
      name: 'deliveryAddress',
      type: 'text',
      admin: {
        description: 'Exact delivery address (street, building, area)',
      },
    },
    {
      name: 'deliveryLocation',
      type: 'text',
      admin: {
        readOnly: true,
        description: 'Auto-generated full delivery location string',
      },
    },
    {
      name: 'bidCount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Total number of bids received',
      },
    },
  ],
  timestamps: true,
}
