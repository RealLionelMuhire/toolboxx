import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { protectedProcedure, createTRPCRouter } from '@/trpc/init'
import { isSuperAdmin } from '@/lib/access'

// Valid status transitions for tenders
const TENDER_TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'cancelled'],
  open: ['closed', 'cancelled'],
  closed: [],
  cancelled: [],
}

// Helper: resolve a user-or-string ID
function resolveId(val: string | { id: string }): string {
  return typeof val === 'string' ? val : val.id
}

// Helper: create a notification (fire-and-forget)
async function notify(
  db: any,
  userId: string,
  title: string,
  message: string,
  url: string,
  icon = '📋',
) {
  try {
    await db.create({
      collection: 'notifications',
      data: { user: userId, type: 'tender', title, message, icon, url },
    })
  } catch (e) {
    console.error('[tenders] notification failed:', e)
  }
}

export const tendersRouter = createTRPCRouter({
  // ─── Tender CRUD ───────────────────────────────────────────────

  list: protectedProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'open', 'closed', 'cancelled']).optional(),
        type: z.enum(['rfq', 'rfp']).optional(),
        tenantId: z.string().optional(),
        mine: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user
      const where: any = {}

      if (input.mine) {
        where.createdBy = { equals: user.id }
      } else {
        // Non-owners only see open tenders + their own
        if (!isSuperAdmin(user)) {
          where.or = [
            { status: { equals: 'open' } },
            { createdBy: { equals: user.id } },
          ]
        }
      }

      if (input.status) where.status = { equals: input.status }
      if (input.type) where.type = { equals: input.type }
      if (input.tenantId) where.tenant = { equals: input.tenantId }

      const result = await ctx.db.find({
        collection: 'tenders',
        where,
        limit: input.limit,
        page: input.page,
        sort: '-createdAt',
        depth: 1,
      })

      return {
        tenders: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
      }
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const tender = await ctx.db.findByID({
        collection: 'tenders',
        id: input.id,
        depth: 2,
      })

      if (!tender) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Tender not found' })
      }

      return tender
    }),

  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(200),
        description: z.any(),
        type: z.enum(['rfq', 'rfp']),
        tenant: z.string().optional(),
        category: z.array(z.string()).optional(),
        responseDeadline: z.string().optional(),
        contactPreference: z.enum(['email', 'phone', 'chat']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      // If user is a tenant and didn't specify, auto-assign their tenant
      let tenantId = input.tenant
      if (!tenantId && user.tenants?.length) {
        const first = user.tenants[0]
        if (first) {
          tenantId = resolveId(first.tenant as string | { id: string })
        }
      }

      const tender = await ctx.db.create({
        collection: 'tenders',
        data: {
          title: input.title,
          description: input.description,
          type: input.type,
          category: input.category,
          responseDeadline: input.responseDeadline,
          contactPreference: input.contactPreference,
          tenant: tenantId || null,
          createdBy: user.id,
          status: 'draft',
          bidCount: 0,
        },
      })

      return tender
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(3).max(200).optional(),
        description: z.any().optional(),
        type: z.enum(['rfq', 'rfp']).optional(),
        category: z.array(z.string()).optional(),
        responseDeadline: z.string().nullable().optional(),
        contactPreference: z.enum(['email', 'phone', 'chat']).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tender = await ctx.db.findByID({ collection: 'tenders', id: input.id, depth: 0 })

      if (!tender) throw new TRPCError({ code: 'NOT_FOUND' })

      // Only editable in draft or open
      if (!['draft', 'open'].includes(tender.status)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tender is no longer editable' })
      }

      const ownerId = resolveId(tender.createdBy as string | { id: string })
      const isOwner = ownerId === String(user.id)
      if (!isOwner && !isSuperAdmin(user)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const { id, ...data } = input
      return ctx.db.update({ collection: 'tenders', id, data })
    }),

  updateStatus: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        status: z.enum(['open', 'closed', 'cancelled']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user
      const tender = await ctx.db.findByID({ collection: 'tenders', id: input.id, depth: 0 })

      if (!tender) throw new TRPCError({ code: 'NOT_FOUND' })

      const ownerId = resolveId(tender.createdBy as string | { id: string })
      const isOwner = ownerId === String(user.id)
      if (!isOwner && !isSuperAdmin(user)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const allowed = TENDER_TRANSITIONS[tender.status] || []
      if (!allowed.includes(input.status)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot transition from "${tender.status}" to "${input.status}"`,
        })
      }

      const updated = await ctx.db.update({
        collection: 'tenders',
        id: input.id,
        data: { status: input.status },
      })

      // ── Notifications ──

      if (input.status === 'open') {
        // Tender published → notify tenants whose products match the tender categories
        const tenderUrl = `/tenders/${input.id}`
        const categoryIds = (tender.category as any[]) || []
        const resolvedCatIds = categoryIds.map((c: any) => (typeof c === 'string' ? c : c.id))

        if (resolvedCatIds.length > 0) {
          // Find products in those categories, extract unique tenant IDs
          const matchingProducts = await ctx.db.find({
            collection: 'products',
            where: { category: { in: resolvedCatIds } },
            limit: 1000,
            depth: 0,
          })

          const tenantIdSet = new Set<string>()
          for (const p of matchingProducts.docs) {
            const tid = typeof p.tenant === 'string' ? p.tenant : (p.tenant as any)?.id
            if (tid) tenantIdSet.add(tid)
          }

          // Find users linked to those tenants
          if (tenantIdSet.size > 0) {
            const tenantUsers = await ctx.db.find({
              collection: 'users',
              where: { 'tenants.tenant': { in: Array.from(tenantIdSet) } },
              limit: 500,
              depth: 0,
            })
            for (const u of tenantUsers.docs) {
              if (String(u.id) === String(user.id)) continue
              notify(ctx.db, u.id, 'New Tender Published', `"${tender.title}" is now open for bids.`, tenderUrl)
            }
          }
        } else {
          // No categories specified — fallback: notify all tenants
          const allTenants = await ctx.db.find({
            collection: 'users',
            where: { roles: { contains: 'tenant' } },
            limit: 500,
            depth: 0,
          })
          for (const u of allTenants.docs) {
            if (String(u.id) === String(user.id)) continue
            notify(ctx.db, u.id, 'New Tender Published', `"${tender.title}" is now open for bids.`, tenderUrl)
          }
        }
      }

      if (input.status === 'closed' || input.status === 'cancelled') {
        // Tender closed/cancelled → notify all bidders
        const bids = await ctx.db.find({
          collection: 'tender-bids',
          where: { tender: { equals: input.id } },
          limit: 500,
          depth: 0,
        })
        const label = input.status === 'closed' ? 'closed' : 'cancelled'
        for (const bid of bids.docs) {
          const bidderId = resolveId(bid.submittedBy as string | { id: string })
          notify(
            ctx.db,
            bidderId,
            `Tender ${label.charAt(0).toUpperCase() + label.slice(1)}`,
            `The tender "${tender.title}" has been ${label}.`,
            `/tenders/${input.id}`,
          )
        }
      }

      return updated
    }),

  // ─── Bid CRUD ──────────────────────────────────────────────────

  listBids: protectedProcedure
    .input(
      z.object({
        tenderId: z.string(),
        status: z.enum(['submitted', 'shortlisted', 'rejected', 'withdrawn']).optional(),
        limit: z.number().min(1).max(100).default(50),
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user

      // Verify caller is tender owner or super-admin
      const tender = await ctx.db.findByID({ collection: 'tenders', id: input.tenderId, depth: 0 })
      if (!tender) throw new TRPCError({ code: 'NOT_FOUND' })

      const ownerId = resolveId(tender.createdBy as string | { id: string })
      const isOwner = ownerId === String(user.id)
      if (!isOwner && !isSuperAdmin(user)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the tender owner can view all bids' })
      }

      const where: any = { tender: { equals: input.tenderId } }
      if (input.status) where.status = { equals: input.status }

      const result = await ctx.db.find({
        collection: 'tender-bids',
        where,
        limit: input.limit,
        page: input.page,
        sort: '-createdAt',
        depth: 1,
      })

      return {
        bids: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
      }
    }),

  getMyBids: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20),
        page: z.number().min(1).default(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const result = await ctx.db.find({
        collection: 'tender-bids',
        where: { submittedBy: { equals: ctx.session.user.id } },
        limit: input.limit,
        page: input.page,
        sort: '-createdAt',
        depth: 1,
      })

      return {
        bids: result.docs,
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page,
      }
    }),

  submitBid: protectedProcedure
    .input(
      z.object({
        tenderId: z.string(),
        message: z.any().optional(),
        amount: z.number().min(0).optional(),
        currency: z.string().optional(),
        validUntil: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      const tender = await ctx.db.findByID({ collection: 'tenders', id: input.tenderId, depth: 0 })
      if (!tender) throw new TRPCError({ code: 'NOT_FOUND' })

      // Only open tenders accept bids
      if (tender.status !== 'open') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This tender is not accepting bids' })
      }

      // Cannot bid on own tender
      const ownerId = resolveId(tender.createdBy as string | { id: string })
      if (ownerId === String(user.id)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot bid on your own tender' })
      }

      // Deadline check
      if (tender.responseDeadline && new Date(tender.responseDeadline) < new Date()) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'The bid deadline has passed' })
      }

      // One bid per user enforced in collection hook, but double-check here
      const existing = await ctx.db.find({
        collection: 'tender-bids',
        where: {
          and: [
            { tender: { equals: input.tenderId } },
            { submittedBy: { equals: user.id } },
          ],
        },
        limit: 1,
        depth: 0,
      })
      if (existing.totalDocs > 0) {
        throw new TRPCError({ code: 'CONFLICT', message: 'You already submitted a bid for this tender' })
      }

      const bid = await ctx.db.create({
        collection: 'tender-bids',
        data: {
          tender: input.tenderId,
          submittedBy: user.id,
          status: 'submitted',
          message: input.message,
          amount: input.amount,
          currency: input.currency || 'RWF',
          validUntil: input.validUntil,
        },
      })

      // Increment bid count
      await ctx.db.update({
        collection: 'tenders',
        id: input.tenderId,
        data: { bidCount: (tender.bidCount || 0) + 1 },
      })

      // Notify tender owner
      const ownerName = user.username || user.email || 'Someone'
      notify(
        ctx.db,
        ownerId,
        'New Bid Received',
        `${ownerName} submitted a bid on "${tender.title}".`,
        `/tenders/${input.tenderId}/bids`,
      )

      return bid
    }),

  updateBidStatus: protectedProcedure
    .input(
      z.object({
        bidId: z.string(),
        status: z.enum(['shortlisted', 'rejected']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      const bid = await ctx.db.findByID({ collection: 'tender-bids', id: input.bidId, depth: 0 })
      if (!bid) throw new TRPCError({ code: 'NOT_FOUND' })

      const tenderId = resolveId(bid.tender as string | { id: string })
      const tender = await ctx.db.findByID({ collection: 'tenders', id: tenderId, depth: 0 })
      if (!tender) throw new TRPCError({ code: 'NOT_FOUND' })

      // Only tender owner or super-admin can shortlist/reject
      const ownerId = resolveId(tender.createdBy as string | { id: string })
      if (ownerId !== String(user.id) && !isSuperAdmin(user)) {
        throw new TRPCError({ code: 'FORBIDDEN' })
      }

      const updated = await ctx.db.update({
        collection: 'tender-bids',
        id: input.bidId,
        data: { status: input.status },
      })

      // Notify the bidder
      const bidderId = resolveId(bid.submittedBy as string | { id: string })
      const statusLabel = input.status === 'shortlisted' ? 'shortlisted' : 'rejected'
      notify(
        ctx.db,
        bidderId,
        `Bid ${statusLabel.charAt(0).toUpperCase() + statusLabel.slice(1)}`,
        `Your bid on "${tender.title}" has been ${statusLabel}.`,
        `/tenders/${tenderId}`,
      )

      return updated
    }),

  withdrawBid: protectedProcedure
    .input(z.object({ bidId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const user = ctx.session.user

      const bid = await ctx.db.findByID({ collection: 'tender-bids', id: input.bidId, depth: 0 })
      if (!bid) throw new TRPCError({ code: 'NOT_FOUND' })

      const bidderId = resolveId(bid.submittedBy as string | { id: string })
      if (bidderId !== String(user.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the bidder can withdraw' })
      }

      if (bid.status === 'withdrawn') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Bid is already withdrawn' })
      }

      const updated = await ctx.db.update({
        collection: 'tender-bids',
        id: input.bidId,
        data: { status: 'withdrawn' },
      })

      // Notify tender owner
      const tenderId = resolveId(bid.tender as string | { id: string })
      const tender = await ctx.db.findByID({ collection: 'tenders', id: tenderId, depth: 0 })
      if (tender) {
        const ownerId = resolveId(tender.createdBy as string | { id: string })
        notify(
          ctx.db,
          ownerId,
          'Bid Withdrawn',
          `A bid on "${tender.title}" has been withdrawn.`,
          `/tenders/${tenderId}/bids`,
        )
      }

      return updated
    }),
})
