import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { baseProcedure, protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { isSuperAdmin } from "@/lib/access";
import { timeRangeSchema, tzOffsetSchema, getTimeRangeBounds, createdAtInRange } from "@/lib/time-range";
import { visitorIdSchema, ANONYMOUS_VISITOR } from "@/lib/visitor-id";
import { Media, Tenant } from "@/payload-types";

import { updateMyStoreSchema, verifyTenantSchema } from "../schemas";

export const tenantsRouter = createTRPCRouter({
  // Get tenant by slug
  getOne: baseProcedure
    .input(
      z.object({
        slug: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const tenantsData = await ctx.db.find({
        collection: "tenants",
        depth: 1, // "tenant.image" is a type of "Media"
        where: {
          slug: {
            equals: input.slug,
          },
        },
        limit: 1,
        pagination: false,
      });

      const tenant = tenantsData.docs[0];

      if (!tenant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Tenant not found" });
      }

      return tenant as Tenant & { image: Media | null };
    }),

  // Get logistics providers (public listing)
  getLogisticsProviders: baseProcedure
    .input(
      z.object({
        query: z.string().optional(),
        limit: z.number().min(1).max(100).optional().default(50),
        includeUnverified: z.boolean().optional().default(true),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Show logistics providers, optionally including unverified ones
      const where: any = {
        category: { equals: 'logistics' },
      };

      if (!input.includeUnverified) {
        where.isVerified = { equals: true };
      }

      if (input.query && input.query.trim().length >= 2) {
        where.or = [
          { name: { contains: input.query.trim() } },
          { slug: { contains: input.query.trim() } },
          { locationCityOrArea: { contains: input.query.trim() } },
        ];
      }

      const tenants = await ctx.db.find({
        collection: 'tenants',
        where,
        limit: input.limit,
        sort: '-createdAt',
        depth: 1,
      });

      return tenants.docs as (Tenant & { image: Media | null })[];
    }),

  // Get current user's tenant
  getCurrentTenant: protectedProcedure.query(async ({ ctx }) => {
    const userData = await ctx.db.findByID({
      collection: "users",
      id: ctx.session.user.id,
    });

    if (!userData.tenants?.[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No tenant found for user",
      });
    }

    const tenantRel = userData.tenants[0].tenant as string | { id: string };
    const tenantId =
      typeof tenantRel === "string" ? tenantRel : tenantRel?.id;

    const tenant = await ctx.db.findByID({
      collection: "tenants",
      id: tenantId,
    });

    return tenant;
  }),

  // Update the current seller's store profile
  updateMyStore: protectedProcedure
    .input(updateMyStoreSchema)
    .mutation(async ({ ctx, input }) => {
      const userData = await ctx.db.findByID({
        collection: "users",
        id: ctx.session.user.id,
      });

      if (!userData.tenants?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tenant found for user",
        });
      }

      const tenantRel = userData.tenants[0].tenant as string | { id: string };
      const tenantId = typeof tenantRel === "string" ? tenantRel : tenantRel?.id;

      // Sellers can sign in with their exact store name, so it must stay unique
      const nameTaken = await ctx.db.find({
        collection: "tenants",
        limit: 1,
        depth: 0,
        where: {
          and: [
            { name: { equals: input.name } },
            { id: { not_equals: tenantId } },
          ],
        },
      });

      if (nameTaken.docs.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Another store already uses this name",
        });
      }

      const isMomo = input.paymentMethod === "momo_pay";

      const updatedTenant = await ctx.db.update({
        collection: "tenants",
        id: tenantId,
        data: {
          name: input.name,
          ...(input.imageId !== undefined && { image: input.imageId }),
          contactPhone: input.contactPhone,
          // All location fields are sent together so the beforeChange hook rebuilds `location`
          locationCountry: input.locationCountry,
          locationProvince: input.locationProvince,
          locationDistrict: input.locationDistrict,
          locationCityOrArea: input.locationCityOrArea,
          currency: input.currency,
          paymentMethod: input.paymentMethod,
          bankName: isMomo ? null : input.bankName,
          bankAccountNumber: isMomo ? null : input.bankAccountNumber,
          momoProviderName: isMomo ? input.momoProviderName : null,
          momoAccountName: isMomo ? input.momoAccountName : null,
          momoCode: isMomo && input.momoCode ? Number(input.momoCode) : null,
        },
      });

      return updatedTenant;
    }),

  // Update logistics provider profile
  updateLogisticsProfile: protectedProcedure
    .input(
      z.object({
        vehicleDescription: z.string().optional(),
        deliveryPricing: z.string().optional(),
        vehicleImageId: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Get current user's tenant
      const userData = await ctx.db.findByID({
        collection: "users",
        id: ctx.session.user.id,
      });

      if (!userData.tenants?.[0]) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "No tenant found for user",
        });
      }

      const tenantRel = userData.tenants[0].tenant as string | { id: string };
      const tenantId = typeof tenantRel === "string" ? tenantRel : tenantRel?.id;

      // Get tenant to verify it's a logistics provider
      const tenant = await ctx.db.findByID({
        collection: "tenants",
        id: tenantId,
      });

      if (tenant.category !== "logistics") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only logistics providers can update logistics profile",
        });
      }

      // Update tenant with new logistics info
      const updateData: any = {};
      if (input.vehicleDescription !== undefined) {
        updateData.vehicleDescription = input.vehicleDescription;
      }
      if (input.deliveryPricing !== undefined) {
        updateData.deliveryPricing = input.deliveryPricing;
      }
      if (input.vehicleImageId !== undefined) {
        updateData.vehicleImage = input.vehicleImageId;
      }

      const updatedTenant = await ctx.db.update({
        collection: "tenants",
        id: tenantId,
        data: updateData,
      });

      return updatedTenant;
    }),

  // Super admin verify tenant
  verifyTenant: protectedProcedure
    .input(verifyTenantSchema)
    .mutation(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.session.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only super admins can verify tenants",
        });
      }

      const tenant = await ctx.db.update({
        collection: "tenants",
        id: input.tenantId,
        data: {
          verificationStatus: input.verificationStatus,
          isVerified: input.verificationStatus !== "rejected",
          verificationNotes: input.verificationNotes,
          verifiedAt: new Date().toISOString(),
          verifiedBy: ctx.session.user.id,
          canAddMerchants: input.canAddMerchants ?? (input.verificationStatus === "document_verified"),
        },
      });

      return tenant;
    }),

  // Get all tenants for admin
  getAllTenants: protectedProcedure.query(async ({ ctx }) => {
    if (!isSuperAdmin(ctx.session.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only super admins can view all tenants",
      });
    }

    const tenants = await ctx.db.find({
      collection: "tenants",
      limit: 100,
      sort: "-createdAt",
      overrideAccess: true, // Bypass access control for super admin
    });

    // Debug logging
    console.log('🔍 TRPC getAllTenants DEBUG:');
    console.log('User roles:', ctx.session.user.roles);
    console.log('Is super admin:', isSuperAdmin(ctx.session.user));
    console.log('Total tenants found:', tenants.totalDocs);
    console.log('Tenants returned:', tenants.docs.length);
    console.log('Tenant details:', tenants.docs.map(t => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      tinNumber: t.tinNumber
    })));

    return tenants;
  }),

  // Get pending verification tenants
  getPendingTenants: protectedProcedure.query(async ({ ctx }) => {
    if (!isSuperAdmin(ctx.session.user)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Only super admins can view pending tenants",
      });
    }

    const tenants = await ctx.db.find({
      collection: "tenants",
      where: {
        or: [
          {
            verificationStatus: {
              equals: "pending",
            },
          },
          {
            physicalVerificationRequested: {
              equals: true,
            },
          },
        ],
      },
      limit: 50,
      sort: "-createdAt",
      overrideAccess: true, // Bypass access control for super admin
    });

    return tenants;
  }),

  // Request physical verification
  requestPhysicalVerification: protectedProcedure.mutation(async ({ ctx }) => {
    const userData = await ctx.db.findByID({
      collection: "users",
      id: ctx.session.user.id,
    });

    if (!userData.tenants?.[0]) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "No tenant found for user",
      });
    }

    const tenant = await ctx.db.update({
      collection: "tenants",
      id: userData.tenants[0].tenant as string,
      data: {
        physicalVerificationRequested: true,
        physicalVerificationRequestedAt: new Date().toISOString(),
      },
    });

    return tenant;
  }),

  // Track store page view (public)
  trackStoreView: baseProcedure
    .input(
      z.object({
        slug: z.string(),
        isUnique: z.boolean().default(false),
        visitorId: visitorIdSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const tenantsData = await ctx.db.find({
          collection: "tenants",
          where: { slug: { equals: input.slug } },
          limit: 1,
          pagination: false,
        });

        const tenant = tenantsData.docs[0];
        if (!tenant) return { success: false };

        const updateData: Record<string, number> = {
          storeViewCount: ((tenant as any).storeViewCount || 0) + 1,
        };

        if (input.isUnique) {
          updateData.storeUniqueViewCount = ((tenant as any).storeUniqueViewCount || 0) + 1;
        }

        await ctx.db.update({
          collection: "tenants",
          id: tenant.id,
          data: updateData,
        });

        // Log the time-series event for time-based analytics
        await ctx.db.create({
          collection: "page-views" as any,
          data: {
            type: "store_view",
            tenantId: tenant.id,
            visitorId: input.visitorId ?? ANONYMOUS_VISITOR,
          },
        });

        return { success: true };
      } catch (error) {
        console.error('[trackStoreView] error:', error);
        return { success: false };
      }
    }),

  // Get insights for the current tenant (or any tenant for super-admin)
  getTenantInsights: protectedProcedure
    .input(z.object({ 
      tenantId: z.string().optional(),
      timeRange: timeRangeSchema.default('all'),
      tzOffset: tzOffsetSchema,
    }))
    .query(async ({ ctx, input }) => {
      const isAdmin = isSuperAdmin(ctx.session.user);

      let tenantId: string;

      if (input.tenantId) {
        // Only super admins can query another tenant
        if (!isAdmin) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
        }
        tenantId = input.tenantId;
      } else {
        // Regular tenant — resolve from session
        const userData = await ctx.db.findByID({
          collection: "users",
          id: ctx.session.user.id,
        });

        if (!userData.tenants?.[0]) {
          throw new TRPCError({ code: "NOT_FOUND", message: "No tenant found" });
        }

        const tenantRel = userData.tenants[0].tenant;
        tenantId = typeof tenantRel === "string" ? tenantRel : tenantRel.id;
      }

      // Fetch tenant record
      const tenant = await ctx.db.findByID({
        collection: "tenants",
        id: tenantId,
        depth: 1,
        // Access is enforced above: tenantId is either the caller's own tenant or
        // one a super admin asked for. Local API calls carry no user, so leaving
        // access on makes Payload reject every non-admin seller (NotFound/Forbidden).
        overrideAccess: true,
      }) as any;

      const range = getTimeRangeBounds(input.timeRange, input.tzOffset);

      // Fetch all active products for this tenant
      const productsData = await ctx.db.find({
        collection: "products",
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { isArchived: { not_equals: true } },
          ],
        },
        pagination: false,
        depth: 0,
        overrideAccess: true,
      });

      // Fetch reviews for all products in one query
      const productIds = productsData.docs.map((p) => p.id);
      const reviewsData = productIds.length > 0
        ? await ctx.db.find({
            collection: "reviews",
            where: range
              ? { and: [{ product: { in: productIds } }, createdAtInRange(range)] }
              : { product: { in: productIds } },
            pagination: false,
            depth: 0,
          })
        : { docs: [] };

      // Fetch the store's sales (by tenant, so sales of since-archived products still count)
      const salesData = await ctx.db.find({
        collection: "sales",
        where: {
          and: [
            { tenant: { equals: tenantId } },
            { status: { not_in: ["cancelled", "refunded"] } },
            ...(range ? [createdAtInRange(range)] : []),
          ],
        },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { product: true, quantity: true, totalAmount: true } as any,
      });

      // Group reviews by product
      const reviewsByProduct = reviewsData.docs.reduce((acc: Record<string, any[]>, review: any) => {
        const pid = typeof review.product === "string" ? review.product : review.product?.id;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(review);
        return acc;
      }, {});

      // Group sales and revenue by product. Sellers receive the full sale amount (no platform fee).
      const soldByProduct: Record<string, number> = {};
      const revenueByProduct: Record<string, number> = {};
      let totalSold = 0;
      let totalRevenue = 0;
      for (const sale of salesData.docs as any[]) {
        const pid = typeof sale.product === "string" ? sale.product : sale.product?.id;
        const qty = sale.quantity || 0;
        const amount = sale.totalAmount || 0;
        totalSold += qty;
        totalRevenue += amount;
        if (pid) {
          soldByProduct[pid] = (soldByProduct[pid] || 0) + qty;
          revenueByProduct[pid] = (revenueByProduct[pid] || 0) + amount;
        }
      }

      // For a time range, count views and distinct visitors from the page-view log.
      // Views recorded before visitor IDs existed are counted as views but not as unique visitors.
      let timeFilteredStoreViews = 0;
      const storeVisitors = new Set<string>();
      const timeFilteredProductViews: Record<string, number> = {};
      const productVisitors: Record<string, Set<string>> = {};

      if (range) {
        const pageViews = await ctx.db.find({
          collection: "page-views" as any,
          where: {
            and: [
              { tenantId: { equals: tenantId } },
              createdAtInRange(range),
            ],
          },
          pagination: false,
          depth: 0,
          overrideAccess: true,
          select: { type: true, productId: true, visitorId: true } as any,
        });

        pageViews.docs.forEach((pv: any) => {
          const visitor = pv.visitorId && pv.visitorId !== ANONYMOUS_VISITOR ? pv.visitorId : null;
          if (pv.type === "store_view") {
            timeFilteredStoreViews++;
            if (visitor) storeVisitors.add(visitor);
          } else if (pv.type === "product_view" && pv.productId) {
            const pid = typeof pv.productId === "string" ? pv.productId : pv.productId.id;
            timeFilteredProductViews[pid] = (timeFilteredProductViews[pid] || 0) + 1;
            if (visitor) (productVisitors[pid] ??= new Set()).add(visitor);
          }
        });
      }

      let totalProductViews = 0;
      let totalUniqueProductViews = 0;

      const products = productsData.docs.map((product: any) => {
        const pReviews = reviewsByProduct[product.id] || [];
        const reviewCount = pReviews.length;
        const reviewRating = reviewCount === 0
          ? 0
          : pReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount;

        const pViewCount = range ? (timeFilteredProductViews[product.id] || 0) : (product.viewCount || 0);
        const pUniqueViewCount = range ? (productVisitors[product.id]?.size || 0) : (product.uniqueViewCount || 0);

        totalProductViews += pViewCount;
        totalUniqueProductViews += pUniqueViewCount;

        return {
          id: product.id,
          name: product.name,
          price: product.price,
          stockStatus: product.stockStatus,
          viewCount: pViewCount,
          uniqueViewCount: pUniqueViewCount,
          totalSold: soldByProduct[product.id] || 0,
          totalRevenue: revenueByProduct[product.id] || 0,
          reviewCount,
          reviewRating,
          isPrivate: product.isPrivate,
          createdAt: product.createdAt,
        };
      });

      return {
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          storeViewCount: range ? timeFilteredStoreViews : (tenant.storeViewCount || 0),
          storeUniqueViewCount: range ? storeVisitors.size : (tenant.storeUniqueViewCount || 0),
          totalRevenue,
          isVerified: tenant.isVerified,
          verificationStatus: tenant.verificationStatus,
          category: tenant.category,
          currency: tenant.currency,
        },
        summary: {
          totalProducts: products.length,
          totalProductViews,
          totalUniqueProductViews,
          totalSold,
        },
        products,
      };
    }),

  // Get aggregated analytics for all tenants (super-admin only)
  getAdminInsights: protectedProcedure
    .input(z.object({ 
      timeRange: timeRangeSchema.default('all'),
      tzOffset: tzOffsetSchema,
    }))
    .query(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.session.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super admins can access admin insights" });
      }

      const tenantsData = await ctx.db.find({
        collection: "tenants",
        pagination: false,
        overrideAccess: true,
        depth: 0,
      }) as any;

      const range = getTimeRangeBounds(input.timeRange, input.tzOffset);
      const dateThreshold = range?.from;

      // Aggregate product views per tenant in one query
      const allProducts = await ctx.db.find({
        collection: "products",
        pagination: false,
        overrideAccess: true,
        depth: 0,
        where: { isArchived: { not_equals: true } },
        select: { id: true, tenant: true, viewCount: true, uniqueViewCount: true } as any,
      });

      // Page views are only needed for a time range; sales are always summed so revenue
      // means the same thing for every range (sellers receive the full sale amount).
      let pageViewsData: { docs: any[] } = { docs: [] };
      if (dateThreshold) {
        pageViewsData = await ctx.db.find({
          collection: "page-views" as any,
          where: createdAtInRange(range!),
          pagination: false,
          depth: 0,
          overrideAccess: true,
          select: { type: true, tenantId: true, productId: true, visitorId: true } as any,
        });
      }

      const salesData = await ctx.db.find({
        collection: "sales",
        where: {
          and: [
            { status: { not_in: ["cancelled", "refunded"] } },
            ...(range ? [createdAtInRange(range)] : []),
          ],
        },
        pagination: false,
        depth: 0,
        overrideAccess: true,
        select: { tenant: true, totalAmount: true } as any,
      });

      const tenantTimeFilteredViews: Record<string, number> = {};
      const tenantStoreVisitors: Record<string, Set<string>> = {};
      const tenantTimeFilteredProductViews: Record<string, number> = {};
      const tenantProductVisitors: Record<string, Set<string>> = {};

      pageViewsData.docs.forEach((pv: any) => {
        const tid = typeof pv.tenantId === 'string' ? pv.tenantId : pv.tenantId?.id;
        if (!tid) return;
        const visitor = pv.visitorId && pv.visitorId !== ANONYMOUS_VISITOR ? pv.visitorId : null;

        if (pv.type === 'store_view') {
          tenantTimeFilteredViews[tid] = (tenantTimeFilteredViews[tid] || 0) + 1;
          if (visitor) (tenantStoreVisitors[tid] ??= new Set()).add(visitor);
        } else if (pv.type === 'product_view' && pv.productId) {
          const pid = typeof pv.productId === 'string' ? pv.productId : pv.productId?.id;
          tenantTimeFilteredProductViews[tid] = (tenantTimeFilteredProductViews[tid] || 0) + 1;
          // Unique product views = distinct (product, visitor) pairs
          if (visitor) (tenantProductVisitors[tid] ??= new Set()).add(`${pid}:${visitor}`);
        }
      });

      const tenantRevenue: Record<string, number> = {};
      salesData.docs.forEach((sale: any) => {
        const tid = typeof sale.tenant === 'string' ? sale.tenant : sale.tenant?.id;
        if (tid) tenantRevenue[tid] = (tenantRevenue[tid] || 0) + (sale.totalAmount || 0);
      });

      // Aggregate product counts + view counts per tenant
      const productStatsByTenant = allProducts.docs.reduce((acc: Record<string, { count: number; views: number; uniqueViews: number }>, product: any) => {
        const tid = typeof product.tenant === "string" ? product.tenant : product.tenant?.id;
        if (!tid) return acc;
        if (!acc[tid]) acc[tid] = { count: 0, views: 0, uniqueViews: 0 };
        acc[tid].count += 1;
        acc[tid].views += product.viewCount || 0;
        acc[tid].uniqueViews += product.uniqueViewCount || 0;
        return acc;
      }, {});

      // Platform-level totals
      let platformTotalStoreViews = 0;
      let platformTotalProductViews = 0;
      let platformVerifiedCount = 0;

      const tenants = tenantsData.docs.map((tenant: any) => {
        const productStats = productStatsByTenant[tenant.id] || { count: 0, views: 0, uniqueViews: 0 };
        
        const storeViews = dateThreshold ? (tenantTimeFilteredViews[tenant.id] || 0) : (tenant.storeViewCount || 0);
        const productViews = dateThreshold ? (tenantTimeFilteredProductViews[tenant.id] || 0) : productStats.views;
        
        platformTotalStoreViews += storeViews;
        platformTotalProductViews += productViews;
        if (tenant.isVerified) platformVerifiedCount++;

        return {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          category: tenant.category,
          isVerified: tenant.isVerified,
          verificationStatus: tenant.verificationStatus,
          storeViewCount: storeViews,
          storeUniqueViewCount: dateThreshold ? (tenantStoreVisitors[tenant.id]?.size || 0) : (tenant.storeUniqueViewCount || 0),
          totalRevenue: tenantRevenue[tenant.id] || 0,
          currency: tenant.currency,
          productCount: productStats.count,
          totalProductViews: productViews,
          totalUniqueProductViews: dateThreshold ? (tenantProductVisitors[tenant.id]?.size || 0) : productStats.uniqueViews,
          createdAt: tenant.createdAt,
        };
      });

      return {
        platform: {
          totalTenants: tenantsData.totalDocs,
          verifiedTenants: platformVerifiedCount,
          totalStoreViews: platformTotalStoreViews,
          totalProductViews: platformTotalProductViews,
        },
        tenants,
      };
    }),
});
