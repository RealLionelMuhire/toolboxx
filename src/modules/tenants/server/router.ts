import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { baseProcedure, protectedProcedure, createTRPCRouter } from "@/trpc/init";
import { isSuperAdmin } from "@/lib/access";
import { Media, Tenant } from "@/payload-types";

import { verifyTenantSchema } from "../schemas";

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
            visitorId: "anonymous", // In a real app, hash the IP or use a session cookie
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
      timeRange: z.enum(['24h', '7d', '30d', 'all']).default('all')
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
        overrideAccess: isAdmin,
      }) as any;

      let dateThreshold: Date | undefined;
      if (input.timeRange !== 'all') {
        dateThreshold = new Date();
        if (input.timeRange === '24h') dateThreshold.setHours(dateThreshold.getHours() - 24);
        if (input.timeRange === '7d') dateThreshold.setDate(dateThreshold.getDate() - 7);
        if (input.timeRange === '30d') dateThreshold.setDate(dateThreshold.getDate() - 30);
      }

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
        overrideAccess: isAdmin,
      });

      // Fetch reviews for all products in one query
      const productIds = productsData.docs.map((p) => p.id);
      const reviewsData = productIds.length > 0
        ? await ctx.db.find({
            collection: "reviews",
            where: dateThreshold 
              ? { and: [{ product: { in: productIds } }, { createdAt: { greater_than_equal: dateThreshold.toISOString() } }] }
              : { product: { in: productIds } },
            pagination: false,
            depth: 0,
          })
        : { docs: [] };

      // Fetch sales for all products
      const salesData = productIds.length > 0
        ? await ctx.db.find({
            collection: "sales",
            where: {
              and: [
                { product: { in: productIds } },
                { status: { not_in: ["cancelled", "refunded"] } },
                ...(dateThreshold ? [{ createdAt: { greater_than_equal: dateThreshold.toISOString() } }] : []),
              ],
            },
            pagination: false,
            depth: 0,
          })
        : { docs: [] };

      // Group reviews by product
      const reviewsByProduct = reviewsData.docs.reduce((acc: Record<string, any[]>, review: any) => {
        const pid = typeof review.product === "string" ? review.product : review.product?.id;
        if (!acc[pid]) acc[pid] = [];
        acc[pid].push(review);
        return acc;
      }, {});

      // Group sales totals by product
      const soldByProduct = salesData.docs.reduce((acc: Record<string, number>, sale: any) => {
        const pid = typeof sale.product === "string" ? sale.product : sale.product?.id;
        acc[pid] = (acc[pid] || 0) + (sale.quantity || 0);
        return acc;
      }, {});
      
      const revenueByProduct = salesData.docs.reduce((acc: Record<string, number>, sale: any) => {
        const pid = typeof sale.product === "string" ? sale.product : sale.product?.id;
        acc[pid] = (acc[pid] || 0) + (sale.total || 0);
        return acc;
      }, {});

      // Aggregate time-series page views if needed
      let timeFilteredStoreViews = 0;
      const timeFilteredProductViews: Record<string, number> = {};
      
      if (dateThreshold) {
        const pageViews = await ctx.db.find({
          collection: "page-views" as any,
          where: {
            and: [
              { tenantId: { equals: tenantId } },
              { createdAt: { greater_than_equal: dateThreshold.toISOString() } }
            ]
          },
          pagination: false,
          depth: 0
        });
        
        pageViews.docs.forEach((pv: any) => {
          if (pv.type === 'store_view') {
            timeFilteredStoreViews++;
          } else if (pv.type === 'product_view' && pv.productId) {
            const pid = typeof pv.productId === 'string' ? pv.productId : pv.productId.id;
            timeFilteredProductViews[pid] = (timeFilteredProductViews[pid] || 0) + 1;
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

        const pViewCount = dateThreshold ? (timeFilteredProductViews[product.id] || 0) : (product.viewCount || 0);
        const pUniqueViewCount = dateThreshold ? 0 : (product.uniqueViewCount || 0);

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
          storeViewCount: dateThreshold ? timeFilteredStoreViews : (tenant.storeViewCount || 0),
          storeUniqueViewCount: dateThreshold ? 0 : (tenant.storeUniqueViewCount || 0),
          totalRevenue: dateThreshold ? Object.values(revenueByProduct).reduce((a, b) => a + b, 0) : (tenant.totalRevenue || 0),
          isVerified: tenant.isVerified,
          verificationStatus: tenant.verificationStatus,
          category: tenant.category,
          currency: tenant.currency,
        },
        summary: {
          totalProducts: products.length,
          totalProductViews,
          totalUniqueProductViews,
          totalSold: Object.values(soldByProduct).reduce((a, b) => a + b, 0),
        },
        products,
      };
    }),

  // Get aggregated analytics for all tenants (super-admin only)
  getAdminInsights: protectedProcedure
    .input(z.object({ 
      timeRange: z.enum(['24h', '7d', '30d', 'all']).default('all') 
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

      let dateThreshold: Date | undefined;
      if (input.timeRange !== 'all') {
        dateThreshold = new Date();
        if (input.timeRange === '24h') dateThreshold.setHours(dateThreshold.getHours() - 24);
        if (input.timeRange === '7d') dateThreshold.setDate(dateThreshold.getDate() - 7);
        if (input.timeRange === '30d') dateThreshold.setDate(dateThreshold.getDate() - 30);
      }

      // Aggregate product views per tenant in one query
      const allProducts = await ctx.db.find({
        collection: "products",
        pagination: false,
        overrideAccess: true,
        depth: 0,
        where: { isArchived: { not_equals: true } },
        select: { id: true, tenant: true, viewCount: true, uniqueViewCount: true } as any,
      });

      // If timeRange is not all, we need page views and sales
      let pageViewsData: { docs: any[] } = { docs: [] };
      let salesData: { docs: any[] } = { docs: [] };
      
      if (dateThreshold) {
        pageViewsData = await ctx.db.find({
          collection: "page-views" as any,
          where: { createdAt: { greater_than_equal: dateThreshold.toISOString() } },
          pagination: false,
          depth: 0,
          overrideAccess: true,
        });

        salesData = await ctx.db.find({
          collection: "sales",
          where: {
            and: [
              { status: { not_in: ["cancelled", "refunded"] } },
              { createdAt: { greater_than_equal: dateThreshold.toISOString() } },
            ],
          },
          pagination: false,
          depth: 0,
          overrideAccess: true,
        });
      }

      const tenantTimeFilteredViews: Record<string, number> = {};
      const tenantTimeFilteredProductViews: Record<string, number> = {};
      const productTimeFilteredViews: Record<string, number> = {};
      
      if (dateThreshold) {
        pageViewsData.docs.forEach((pv: any) => {
          const tid = typeof pv.tenantId === 'string' ? pv.tenantId : pv.tenantId?.id;
          if (!tid) return;
          
          if (pv.type === 'store_view') {
            tenantTimeFilteredViews[tid] = (tenantTimeFilteredViews[tid] || 0) + 1;
          } else if (pv.type === 'product_view' && pv.productId) {
            const pid = typeof pv.productId === 'string' ? pv.productId : pv.productId?.id;
            tenantTimeFilteredProductViews[tid] = (tenantTimeFilteredProductViews[tid] || 0) + 1;
            productTimeFilteredViews[pid] = (productTimeFilteredViews[pid] || 0) + 1;
          }
        });
      }

      // Map products to their tenant IDs to attribute sales correctly
      const productToTenantMap: Record<string, string> = {};
      allProducts.docs.forEach((p: any) => {
        const tid = typeof p.tenant === 'string' ? p.tenant : p.tenant?.id;
        if (tid) productToTenantMap[p.id] = tid;
      });

      const tenantTimeFilteredRevenue: Record<string, number> = {};
      if (dateThreshold) {
        salesData.docs.forEach((sale: any) => {
          const pid = typeof sale.product === 'string' ? sale.product : sale.product?.id;
          const tid = productToTenantMap[pid];
          if (tid) {
            tenantTimeFilteredRevenue[tid] = (tenantTimeFilteredRevenue[tid] || 0) + (sale.total || 0);
          }
        });
      }

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
          storeUniqueViewCount: dateThreshold ? 0 : (tenant.storeUniqueViewCount || 0),
          totalRevenue: dateThreshold ? (tenantTimeFilteredRevenue[tenant.id] || 0) : (tenant.totalRevenue || 0),
          currency: tenant.currency,
          productCount: productStats.count,
          totalProductViews: productViews,
          totalUniqueProductViews: dateThreshold ? 0 : productStats.uniqueViews,
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
