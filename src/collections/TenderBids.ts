import type { CollectionConfig } from 'payload'
import { isSuperAdmin } from '@/lib/access'

export const TenderBids: CollectionConfig = {
  slug: 'tender-bids',
  admin: {
    useAsTitle: 'tender',
    defaultColumns: ['tender', 'submittedBy', 'status', 'amount', 'createdAt'],
  },
  access: {
    read: ({ req }) => {
      if (isSuperAdmin(req.user)) return true
      if (!req.user) return false

      // Bidder can read own bids; tender owner reads bids via tRPC (deeper check there).
      // Payload-level: allow reading bids you submitted.
      return {
        submittedBy: { equals: req.user.id },
      }
    },
    create: ({ req }) => {
      // Any authenticated user can submit a bid
      return !!req.user
    },
    update: ({ req }) => {
      if (isSuperAdmin(req.user)) return true
      if (!req.user) return false

      // Bidder can update own bids (withdraw, edit while submitted)
      return {
        submittedBy: { equals: req.user.id },
      }
    },
    delete: ({ req }) => isSuperAdmin(req.user),
  },
  hooks: {
    beforeValidate: [
      async ({ data, operation, req }) => {
        // Enforce one bid per user per tender on create
        if (operation === 'create' && data?.tender && req.user) {
          const existing = await req.payload.find({
            collection: 'tender-bids',
            where: {
              and: [
                { tender: { equals: data.tender } },
                { submittedBy: { equals: req.user.id } },
              ],
            },
            limit: 1,
            depth: 0,
          })

          if (existing.totalDocs > 0) {
            throw new Error('You have already submitted a bid for this tender')
          }
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'tender',
      type: 'relationship',
      relationTo: 'tenders',
      required: true,
      index: true,
      admin: {
        description: 'The tender this bid responds to',
      },
    },
    {
      name: 'submittedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        readOnly: true,
        description: 'User who submitted this bid',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'submitted',
      options: [
        { label: 'Submitted', value: 'submitted' },
        { label: 'Shortlisted', value: 'shortlisted' },
        { label: 'Rejected', value: 'rejected' },
        { label: 'Withdrawn', value: 'withdrawn' },
      ],
      index: true,
    },
    {
      name: 'message',
      type: 'richText',
      admin: {
        description: 'Cover message or proposal summary',
      },
    },
    {
      name: 'documents',
      type: 'array',
      maxRows: 10,
      admin: {
        description: 'Quote, proposal, or supporting documents',
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
      name: 'amount',
      type: 'number',
      min: 0,
      admin: {
        description: 'Quoted amount (informational only — no on-platform payment)',
        step: 100,
      },
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'RWF',
      admin: {
        description: 'Currency code for the quoted amount',
      },
    },
    {
      name: 'validUntil',
      type: 'date',
      admin: {
        description: 'Quote validity date',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
  ],
  timestamps: true,
}
