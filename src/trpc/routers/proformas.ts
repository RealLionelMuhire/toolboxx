import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, baseProcedure as publicProcedure } from '../init';

export const proformasRouter = createTRPCRouter({
  // Create a new Pro Forma
  create: protectedProcedure
    .input(z.object({
      customerDetails: z.object({
        name: z.string(),
        email: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
      }),
      items: z.array(z.object({
        product: z.string(),
        quantity: z.number().min(1),
        unitPrice: z.number().min(0),
      })).min(1),
      validUntil: z.date().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Ensure user is associated with a tenant
      if (!ctx.session.user.tenants || ctx.session.user.tenants.length === 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You must be a seller to create a Pro Forma',
        });
      }

      const tenantRel = ctx.session.user.tenants[0];
      const tenantId = tenantRel ? (typeof tenantRel.tenant === 'string' ? tenantRel.tenant : tenantRel.tenant?.id) : null;
      
      if (!tenantId) {
         throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Invalid tenant association',
        });
      }

      try {
        const proforma = await (ctx.db as any).create({
          collection: 'proformas',
          data: {
            tenant: tenantId,
            customerDetails: input.customerDetails,
            items: input.items,
            validUntil: input.validUntil ? input.validUntil.toISOString() : undefined,
            notes: input.notes,
            status: 'draft',
            totalAmount: 0, // Hook will auto-calculate
          } as any, 
        });

        return { success: true, proforma };
      } catch (error: any) {
        ctx.db.logger.error(`Error creating pro forma: ${error.message}`);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create Pro Forma',
        });
      }
    }),

  // Get my proformas (for seller dashboard)
  getMyProformas: protectedProcedure
    .input(z.object({
      page: z.number().optional().default(1),
      limit: z.number().optional().default(10),
    }))
    .query(async ({ ctx, input }) => {
      if (!ctx.session.user.tenants || ctx.session.user.tenants.length === 0) {
        return { docs: [], totalDocs: 0, totalPages: 1, page: 1 };
      }

      const tenantRel = ctx.session.user.tenants[0];
      const tenantId = tenantRel ? (typeof tenantRel.tenant === 'string' ? tenantRel.tenant : tenantRel.tenant?.id) : null;
      
      if (!tenantId) {
        return { docs: [], totalDocs: 0, totalPages: 1, page: 1 };
      }

      const result = await (ctx.db as any).find({
        collection: 'proformas',
        where: {
          tenant: {
            equals: tenantId,
          }
        },
        page: input.page,
        limit: input.limit,
        sort: '-createdAt',
      });

      return result;
    }),
    
  // Get a single Pro Forma by ID (Public route so clients can view it)
  getById: publicProcedure
    .input(z.object({
      id: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      try {
        const proforma = await (ctx.db as any).findByID({
          collection: 'proformas',
          id: input.id,
          depth: 2, // Fetch product and tenant details
        });

        if (!proforma) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Pro Forma not found' });
        }

        return proforma;
      } catch (error) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pro Forma not found' });
      }
    }),
    
  // Update status (e.g. from draft to sent or converted)
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.string(),
      status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'converted']),
    }))
    .mutation(async ({ ctx, input }) => {
      // Need to verify ownership
      const proforma = await (ctx.db as any).findByID({
        collection: 'proformas',
        id: input.id,
      }) as any;
      
      if (!proforma) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Pro Forma not found' });
      }
      
      // Verify ownership
      let isOwner = false;
      const proformaTenantId = typeof proforma.tenant === 'string' ? proforma.tenant : proforma.tenant?.id;
      
      if (ctx.session.user.tenants) {
        for (const t of ctx.session.user.tenants) {
          const tId = typeof t.tenant === 'string' ? t.tenant : t.tenant?.id;
          if (tId === proformaTenantId) isOwner = true;
        }
      }
      
      if (!isOwner && !ctx.session.user.roles?.includes('super-admin')) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }
      
      const updated = await (ctx.db as any).update({
        collection: 'proformas',
        id: input.id,
        data: {
          status: input.status,
        },
      });
      
      return updated;
    }),
});
