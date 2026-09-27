import { z } from "zod";
import { TRPCError } from "@trpc/server";
import type { Sort, Where } from "payload";
import { headers as getHeaders } from "next/headers";

import { DEFAULT_LIMIT } from "@/constants";
import { COUNTRIES, getProvinceByCode, getDistrictByCode } from "@/lib/location-data";
import { getOutOfWindowSponsoredProductIds } from "@/lib/sponsorships";
import { Category, Media, Tenant, Product } from "@/payload-types";
import { baseProcedure, createTRPCRouter, protectedProcedure } from "@/trpc/init";

import { sortValues } from "../search-params";

// Type for product with populated relationships
type PopulatedProduct = Product & {
  image?: Media | null;
  tenant?: Tenant & { image?: Media | null };
};

// Sponsored products: one at the top, then one after every N products (Site Settings can override)
const DEFAULT_SPONSORED_INJECTION_INTERVAL = 4;

// Curated feed fallback: without a seed, the order rotates every 5 minutes
const CURATED_SEED_WINDOW_MS = 5 * 60 * 1000;

// Deterministic PRNG (mulberry32) so a seed yields the same order on every page request
const createSeededRandom = (seed: number) => {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffleInPlace = <T>(items: T[], random: () => number): T[] => {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const a = items[i];
    const b = items[j];
    if (a !== undefined && b !== undefined) {
      items[i] = b;
      items[j] = a;
    }
  }
  return items;
};

type CuratedCandidate = {
  id: string;
  name?: string | null;
  tags?: Array<string | { id: string }> | null;
  tenant?: string | { id: string } | null;
  sponsorshipStatus?: string | null;
};

const getTenantId = (candidate: CuratedCandidate) =>
  typeof candidate.tenant === "string" ? candidate.tenant : candidate.tenant?.id ?? "unknown";

/**
 * Round-robin across stores so every store gets one slot per round. The store order is
 * reshuffled each round, so no store is always ahead of another.
 */
const interleaveByStore = (ids: CuratedCandidate[], random: () => number): string[] => {
  const productsByTenant = new Map<string, string[]>();
  for (const candidate of ids) {
    const tenantId = getTenantId(candidate);
    const list = productsByTenant.get(tenantId) ?? [];
    list.push(candidate.id);
    productsByTenant.set(tenantId, list);
  }

  let queues = [...productsByTenant.values()].map((queue) => shuffleInPlace(queue, random));
  const ordered: string[] = [];
  while (queues.length > 0) {
    for (const queue of shuffleInPlace(queues, random)) {
      const id = queue.shift();
      if (id) ordered.push(id);
    }
    queues = queues.filter((queue) => queue.length > 0);
  }
  return ordered;
};

type SponsoredPlacement = {
  injectionInterval: number;
};

/**
 * Sponsored slots: one at the top, then one after every `injectionInterval` organic products,
 * all the way down the listing. The sponsored products take turns filling the slots (in the
 * given order, which alternates stores for the curated feed), so a small pool repeats rather
 * than leaving slots empty. Sponsored products never also appear as organic products.
 */
const injectSponsored = (
  organic: string[],
  sponsored: CuratedCandidate[],
  placement: SponsoredPlacement,
): string[] => {
  const interval = Math.max(1, Math.floor(placement.injectionInterval));
  const pool = sponsored.map((candidate) => candidate.id);
  if (pool.length === 0) return organic;

  const ordered: string[] = [];
  let slot = 0;
  organic.forEach((id, index) => {
    if (index % interval === 0) {
      ordered.push(pool[slot % pool.length]!);
      slot++;
    }
    ordered.push(id);
  });
  // Too few organic products for every sponsored product to get a slot: show the rest at the end
  ordered.push(...pool.slice(slot));

  return ordered;
};

const isLiveSponsored = (candidate: CuratedCandidate, outOfWindowSponsoredIds: Set<string>) =>
  candidate.sponsorshipStatus === "approved" && !outOfWindowSponsoredIds.has(candidate.id);

/**
 * Orders product IDs for the curated (default) feed:
 * - with a search, products are grouped by `relevance` (highest first) and stores are only
 *   rotated within a group, so strong name matches aren't buried under weak ones
 * - stores are interleaved so no store owns the first rows
 * - sponsored products fill the slots from `injectSponsored`, alternating stores
 *   (products whose sponsorship is outside its start/end window are treated as organic)
 */
const buildCuratedOrder = (
  candidates: CuratedCandidate[],
  options: SponsoredPlacement & {
    seed: number;
    outOfWindowSponsoredIds: Set<string>;
    relevance?: (candidate: CuratedCandidate) => number;
  },
): string[] => {
  const random = createSeededRandom(options.seed);
  const scoreOf = (candidate: CuratedCandidate) => options.relevance?.(candidate) ?? 0;
  const sponsored: CuratedCandidate[] = [];
  const organicByRelevance = new Map<number, CuratedCandidate[]>();

  for (const candidate of candidates) {
    if (isLiveSponsored(candidate, options.outOfWindowSponsoredIds)) {
      sponsored.push(candidate);
      continue;
    }
    const group = organicByRelevance.get(scoreOf(candidate)) ?? [];
    group.push(candidate);
    organicByRelevance.set(scoreOf(candidate), group);
  }

  const byRelevanceThenStore = (items: CuratedCandidate[]) =>
    [...new Set(items.map(scoreOf))]
      .sort((a, b) => b - a)
      .flatMap((score) => interleaveByStore(items.filter((c) => scoreOf(c) === score), random));

  const organic = byRelevanceThenStore([...organicByRelevance.values()].flat());
  const candidatesById = new Map(sponsored.map((c) => [c.id, c]));
  const sponsoredOrdered = byRelevanceThenStore(sponsored).flatMap((id) => candidatesById.get(id) ?? []);

  return injectSponsored(organic, sponsoredOrdered, options);
};

/**
 * Orders product IDs for an explicit sort (price, newest, ...): the chosen order is kept
 * and sponsored products are placed by `injectSponsored`, in that same order.
 */
const buildSortedOrder = (
  sortedCandidates: CuratedCandidate[],
  options: SponsoredPlacement & { outOfWindowSponsoredIds: Set<string> },
): string[] => {
  const sponsored = sortedCandidates.filter((c) => isLiveSponsored(c, options.outOfWindowSponsoredIds));
  const organic = sortedCandidates
    .filter((c) => !isLiveSponsored(c, options.outOfWindowSponsoredIds))
    .map((c) => c.id);
  return injectSponsored(organic, sponsored, options);
};

// Search relevance for the curated feed: 3 = name is or starts with the search,
// 2 = name has every word, 1 = name has some word or a matching tag, 0 = other matches
// (store name, location)
const createSearchRelevance = (search: string, matchingTagIds: Set<string>) => {
  const phrase = search.trim().toLowerCase();
  const words = phrase.split(/\s+/).filter(Boolean);

  return (candidate: CuratedCandidate) => {
    const name = (candidate.name ?? "").toLowerCase();
    if (phrase && name.startsWith(phrase)) return 3;
    const matchedWords = words.filter((word) => name.includes(word)).length;
    if (words.length > 0 && matchedWords === words.length) return 2;
    const hasMatchingTag = (candidate.tags ?? []).some((tag) =>
      matchingTagIds.has(typeof tag === "string" ? tag : tag.id),
    );
    if (matchedWords > 0 || hasMatchingTag) return 1;
    return 0;
  };
};

// Resolves place names in search text (e.g. "Gasabo", "Kigali") to province/district codes,
// since the stored free-text location strings can be stale or incomplete
const findLocationCodesMatching = (search: string) => {
  const term = search.trim().toLowerCase();
  const provinces = new Set<string>();
  const districts = new Set<string>();
  if (term.length < 3) return { provinces: [], districts: [] };

  for (const country of COUNTRIES) {
    for (const province of country.provinces) {
      if (province.name.toLowerCase().includes(term)) provinces.add(province.code);
      for (const district of province.districts) {
        if (district.name.toLowerCase().includes(term)) districts.add(district.code);
      }
    }
  }

  return { provinces: [...provinces], districts: [...districts] };
};

// Validation schemas for product CRUD
const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.any().optional(), // Rich text
  price: z.number().min(0, "Price must be positive"),
  quantity: z.number().min(0, "Quantity cannot be negative").default(0),
  unit: z.enum(["unit", "piece", "box", "pack", "bag", "kg", "gram", "meter", "cm", "liter", "sqm", "cbm", "set", "pair", "roll", "sheet", "carton", "pallet", "hour", "day", "week", "month"]).default("unit"),
  minOrderQuantity: z.number().min(1, "Minimum order quantity must be at least 1").default(1),
  maxOrderQuantity: z.number().min(1).optional(),
  lowStockThreshold: z.number().min(0).default(10),
  allowBackorder: z.boolean().default(false),
  category: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).transform(val => Array.isArray(val) ? val : [val]),
  tags: z.array(z.string()).optional(),
  image: z.string().min(1, "Product image is required"),
  cover: z.string().optional(),
  gallery: z.array(z.string()).optional(), // Array of media IDs
  refundPolicy: z.enum(["30-day", "14-day", "7-day", "3-day", "1-day", "no-refunds"]).default("30-day"),
  content: z.any().optional(), // Rich text
  isPrivate: z.boolean().default(false),
  // Location fields
  useDefaultLocation: z.boolean().default(true),
  locationCountry: z.string().optional(),
  locationProvince: z.string().optional(),
  locationDistrict: z.string().optional(),
  locationCityOrArea: z.string().optional(),
});

const updateProductSchema = z.preprocess(
  (data: any) => {
    // Preprocess the data to convert string numbers to actual numbers
    const processed = { ...data };
    
    // Convert numeric string fields to numbers
    const numericFields = ['minOrderQuantity', 'maxOrderQuantity', 'lowStockThreshold', 'price', 'quantity'];
    numericFields.forEach(field => {
      if (processed[field] !== undefined) {
        if (typeof processed[field] === 'string') {
          const num = Number(processed[field]);
          processed[field] = processed[field] === '' || isNaN(num) ? undefined : num;
        }
      }
    });
    
    // Handle empty string for unit - convert to undefined
    if (processed.unit === '') {
      processed.unit = undefined;
    }
    
    return processed;
  },
  z.object({
    id: z.string(),
    name: z.string().min(1).optional(),
    description: z.any().optional(),
    price: z.number().min(0).optional(),
    quantity: z.number().min(0).optional(),
    unit: z.enum(["unit", "piece", "box", "pack", "bag", "kg", "gram", "meter", "cm", "liter", "sqm", "cbm", "set", "pair", "roll", "sheet", "carton", "pallet", "hour", "day", "week", "month"]).optional(),
    minOrderQuantity: z.number().min(1).optional(),
    maxOrderQuantity: z.number().min(1).optional(),
    lowStockThreshold: z.number().min(0).optional(),
    allowBackorder: z.boolean().optional(),
    category: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).transform(val => val ? (Array.isArray(val) ? val : [val]) : undefined).optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    cover: z.string().optional(),
    gallery: z.array(z.string()).optional(), // Array of media IDs
    refundPolicy: z.enum(["30-day", "14-day", "7-day", "3-day", "1-day", "no-refunds"]).optional(),
    content: z.any().optional(),
    isPrivate: z.boolean().optional(),
    isArchived: z.boolean().optional(),
    // Location fields
    useDefaultLocation: z.boolean().optional(),
    locationCountry: z.string().optional(),
    locationProvince: z.string().optional(),
    locationDistrict: z.string().optional(),
    locationCityOrArea: z.string().optional(),
  })
);

export const productsRouter = createTRPCRouter({
  searchAutocomplete: baseProcedure
    .input(
      z.object({
        search: z.string().min(2).max(100),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const docs = await ctx.db.find({
        collection: "products",
        where: {
          and: [
            { name: { like: input.search } },
            { isArchived: { equals: false } },
          ],
        },
        limit: input.limit,
        depth: 0,
        select: { id: true, name: true, unit: true, image: true },
      });
      return docs.docs.map((p: any) => ({
        id: p.id,
        name: p.name,
        unit: p.unit ?? "unit",
        image: typeof p.image === "string" ? p.image : p.image?.id ?? null,
      }));
    }),

  getOne: baseProcedure
    .input(
      z.object({
        id: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const headers = await getHeaders();
      const session = await ctx.db.auth({ headers });

      const product = await ctx.db.findByID({
        collection: "products",
        id: input.id,
        depth: 2, // Depth 2 to populate: image, category, cover, gallery.media, tenant
        select: {
          content: false,
        },
      });

      if (product.isArchived) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        })
      }

      let isPurchased = false;

      // Parallel execution for better performance
      const [ordersData, reviews, salesData] = await Promise.all([
        // Check if user purchased (only if logged in)
        session.user ? ctx.db.find({
          collection: "orders",
          pagination: false,
          limit: 1,
          where: {
            and: [
              {
                product: {
                  equals: input.id,
                },
              },
              {
                user: {
                  equals: session.user.id,
                },
              },
            ],
          },
          depth: 0, // No need to populate relationships
        }) : Promise.resolve({ docs: [] }),

        // Fetch reviews (limited fields for performance)
        ctx.db.find({
          collection: "reviews",
          pagination: false,
          limit: 1000, // Reasonable limit for reviews
          where: {
            product: {
              equals: input.id,
            },
          },
          depth: 0, // No need to populate relationships for aggregation
          select: {
            rating: true,
            id: true,
          },
        }),

        // Calculate total sold
        ctx.db.find({
          collection: "sales",
          pagination: false,
          limit: 10000, // Reasonable limit
          where: {
            product: {
              equals: input.id,
            },
            status: {
              not_in: ["cancelled", "refunded"],
            },
          },
          depth: 0,
          select: {
            quantity: true,
          },
        }),
      ]);

      isPurchased = !!ordersData.docs[0];

      const reviewRating =
        reviews.docs.length > 0
        ? reviews.docs.reduce((acc, review) => acc + review.rating, 0) / reviews.totalDocs
        : 0;

      const ratingDistribution: Record<number, number> = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      if (reviews.totalDocs > 0) {
        reviews.docs.forEach((review) => {
          const rating = review.rating;

          if (rating >= 1 && rating <= 5) {
            ratingDistribution[rating] = (ratingDistribution[rating] || 0) + 1;
          }
        });

        Object.keys(ratingDistribution).forEach((key) => {
          const rating = Number(key);
          const count = ratingDistribution[rating] || 0;
          ratingDistribution[rating] = Math.round(
            (count / reviews.totalDocs) * 100,
          );
        });
      }

      // Find the user who owns this tenant
      let tenantOwnerId: string | null = null;
      try {
        const tenantId = typeof product.tenant === 'string' 
          ? product.tenant 
          : product.tenant?.id;
        
        if (tenantId) {
          // Query users collection for the owner of this tenant
          const owner = await ctx.db.find({
            collection: 'users',
            where: {
              and: [
                {
                  'tenants.tenant': {
                    equals: tenantId,
                  },
                },
                {
                  roles: {
                    contains: 'tenant',
                  },
                },
              ],
            },
            limit: 1,
            depth: 0,
          });
          
          if (owner.docs.length > 0 && owner.docs[0]) {
            tenantOwnerId = owner.docs[0].id;
          }
        }
      } catch (error) {
        // Log error but don't fail the entire request
        console.error('Error finding tenant owner for product:', product.id, error);
        tenantOwnerId = null;
      }

      const totalSold = salesData.docs.reduce((acc, sale) => acc + (sale.quantity || 0), 0);

      return {
        ...product,
        isPurchased,
        image: (product as PopulatedProduct).image,
        tenant: (product as PopulatedProduct).tenant as Tenant & { image: Media | null; location?: string | null },
        reviewRating,
        reviewCount: reviews.totalDocs,
        ratingDistribution,
        tenantOwnerId,
        totalSold,
      }
    }),
  getMany: baseProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
        search: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        categories: z.array(z.string()).nullable().optional(),
        minPrice: z.string().nullable().optional(),
        maxPrice: z.string().nullable().optional(),
        tags: z.array(z.string()).nullable().optional(),
        unit: z.array(z.string()).nullable().optional(),
        sort: z.enum(sortValues).nullable().optional(),
        tenantSlug: z.string().nullable().optional(),
        tenantTypes: z.array(z.string()).nullable().optional(),
        // Location filtering
        locationCountry: z.string().optional(),
        locationProvince: z.string().optional(),
        locationDistrict: z.string().optional(),
        // Seed for the curated order; keeps the order stable across pages of one listing
        seed: z.number().int().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: Where = {
        isArchived: {
          not_equals: true,
        },
      };
      const andConditions: Where[] = [];
      let sort: Sort = "-createdAt";
      let isCurated = false;

      // Default to "curated" if no sort specified or if explicitly set to "curated"
      if (!input.sort || input.sort === "curated") {
        // Default - use randomization for fair product visibility
        isCurated = true;
        sort = "-createdAt"; // Initial sort, will be randomized
      }

      if (input.sort === "hot_and_new") {
        sort = "createdAt";
      }

      if (input.sort === "trending") {
        sort = "-createdAt";
      }

      if (input.sort === "price_low_to_high") {
        sort = "price";
      }

      if (input.sort === "price_high_to_low") {
        sort = "-price";
      }

      if (input.sort === "newest") {
        sort = "-createdAt";
      }

      if (input.sort === "oldest") {
        sort = "createdAt";
      }

      if (input.minPrice && input.maxPrice) {
        where.price = {
          greater_than_equal: input.minPrice,
          less_than_equal: input.maxPrice,
        }
      } else if (input.minPrice) {
        where.price = {
          greater_than_equal: input.minPrice
        }
      } else if (input.maxPrice) {
        where.price = {
          less_than_equal: input.maxPrice
        }
      }

      if (input.tenantSlug) {
        where["tenant.slug"] = {
          equals: input.tenantSlug,
        };
      }

      if (input.tenantTypes && input.tenantTypes.length > 0) {
        where["tenant.category"] = {
          in: input.tenantTypes,
        };
      }

      if (!input.tenantSlug) {
        // If we are loading products for public storefront (no tenantSlug)
        // Make sure to not load products set to "isPrivate: true" (using reverse not_equals logic)
        // These products are exclusively private to the tenant store

        where["isPrivate"] = {
          not_equals: true,
        }
      }
      
      // Location-based filtering. Products using their store's default location don't carry
      // their own location fields (the beforeChange copy only runs for admin-panel creates),
      // so those are matched on the tenant's location instead of the product's.
      // Values match by code or name so UI codes match DB whether stored as code or name.
      const locationFilters: Array<{ field: string; values: string[] }> = [];

      if (input.locationCountry && input.locationCountry.trim() !== "") {
        locationFilters.push({ field: "locationCountry", values: [input.locationCountry] });
      }

      if (input.locationProvince && input.locationProvince.trim() !== "") {
        const provinceMeta = input.locationCountry
          ? getProvinceByCode(input.locationCountry, input.locationProvince)
          : undefined;
        locationFilters.push({
          field: "locationProvince",
          values: provinceMeta ? [input.locationProvince, provinceMeta.name] : [input.locationProvince],
        });
      }

      if (input.locationDistrict && input.locationDistrict.trim() !== "") {
        const districtMeta = input.locationCountry && input.locationProvince
          ? getDistrictByCode(input.locationCountry, input.locationProvince, input.locationDistrict)
          : undefined;
        locationFilters.push({
          field: "locationDistrict",
          values: districtMeta ? [input.locationDistrict, districtMeta.name] : [input.locationDistrict],
        });
      }

      if (locationFilters.length > 0) {
        andConditions.push({
          or: [
            {
              and: [
                { useDefaultLocation: { not_equals: false } },
                ...locationFilters.map(({ field, values }) => ({ [`tenant.${field}`]: { in: values } })),
              ],
            },
            {
              and: [
                { useDefaultLocation: { equals: false } },
                ...locationFilters.map(({ field, values }) => ({ [field]: { in: values } })),
              ],
            },
          ],
        });
      }
      
      // Handle multiple categories filter
      if (input.categories && input.categories.length > 0) {
        // Filter products that have any of the selected category IDs
        where["category"] = {
          in: input.categories
        };
      } else if (input.category && input.category !== "all") {
        // Handle single category (backward compatibility for existing routes)
        // Optimized: Single query to get category and subcategories by slug
        const categoriesData = await ctx.db.find({
          collection: "categories",
          depth: 1, // Populate subcategories
          pagination: false,
          where: {
            slug: {
              equals: input.category,
            }
          }
        });

        const parentCategory = categoriesData.docs[0];

        if (parentCategory) {
          // Collect parent ID and all subcategory IDs in one go
          const categoryIds = [parentCategory.id];
          
          if (parentCategory.subcategories?.docs) {
            parentCategory.subcategories.docs.forEach((subcat) => {
              if (typeof subcat !== 'string') {
                categoryIds.push(subcat.id);
              }
            });
          }

          // Filter products that have any of these categories in their category array
          where["category"] = {
            in: categoryIds
          };
        }
      }
      // Note: If category is "all" or undefined, no category filter is applied (show all products)

      if (input.tags && input.tags.length > 0) {
        where["tags.name"] = {
          in: input.tags,
        };
      }

      if (input.unit && input.unit.length > 0) {
        where["unit"] = {
          in: input.unit,
        };
      }

      // Multi-field search: product name, store name, tags and location.
      // Location text comes from the product for custom locations, otherwise from the store.
      if (input.search) {
        const locationCodes = findLocationCodesMatching(input.search);
        const locationCodeConditions = (prefix: string): Where[] => [
          ...(locationCodes.provinces.length > 0
            ? [{ [`${prefix}locationProvince`]: { in: locationCodes.provinces } }]
            : []),
          ...(locationCodes.districts.length > 0
            ? [{ [`${prefix}locationDistrict`]: { in: locationCodes.districts } }]
            : []),
        ];

        andConditions.push({
          or: [
            { name: { like: input.search } },
            { "tenant.name": { like: input.search } },
            { "tags.name": { like: input.search } },
            { location: { like: input.search } },
            { locationCityOrArea: { like: input.search } },
            ...locationCodeConditions(""),
            {
              and: [
                { useDefaultLocation: { not_equals: false } },
                {
                  or: [
                    { "tenant.location": { like: input.search } },
                    { "tenant.locationCityOrArea": { like: input.search } },
                    ...locationCodeConditions("tenant."),
                  ],
                },
              ],
            },
          ],
        });
      }

      // Filter out out-of-stock products from public lists (unless allowBackorder/pre-order is enabled)
      // This ensures tenants can still see their out-of-stock products in their management area
      // but customers won't see them in public product lists unless pre-order is enabled
      if (!input.tenantSlug) {
        andConditions.push({
          or: [
            { quantity: { greater_than: 0 } },
            {
              and: [
                { quantity: { equals: 0 } },
                { allowBackorder: { equals: true } },
              ],
            },
          ],
        });
      }

      if (andConditions.length > 0) {
        where.and = andConditions;
      }

      // Curated (default) feed: order the *whole* result set, then slice the requested page.
      // Shuffling only the fetched page kept the newest products' stores pinned to the top,
      // and only sponsored products that happened to be on that page were promoted.
      // Sponsorships past their end date may still read "approved" until the expiry job runs
      const outOfWindowSponsoredIds = await getOutOfWindowSponsoredProductIds(ctx.db);

      // Every listing (any sort, with or without search) is ordered in full here, then paged,
      // so sponsored products can be placed at the top and at a fixed interval on every page
      const findOrderedPage = async () => {
        let injectionInterval = DEFAULT_SPONSORED_INJECTION_INTERVAL;
        try {
          const settings = await ctx.db.findGlobal({
            slug: "site-settings" as any as never,
          });
          if (settings && typeof (settings as any).sponsoredProductInjectionRate === "number") {
            injectionInterval = (settings as any).sponsoredProductInjectionRate;
          }
        } catch (error) {
          console.error("Error fetching site settings for injection rate:", error);
        }

        const candidates = await ctx.db.find({
          collection: "products",
          depth: 0,
          where,
          // Curated order is built from a stable base. Price sorts get a tie-breaker so the
          // order is stable when many products share a price
          sort: isCurated
            ? "createdAt"
            : String(sort).includes("price") ? [sort as string, "-createdAt"] : sort,
          pagination: false,
          select: {
            name: true,
            tags: true,
            tenant: true,
            sponsorshipStatus: true,
          },
        });

        let relevance: ((candidate: CuratedCandidate) => number) | undefined;
        if (input.search && isCurated) {
          const matchingTags = await ctx.db.find({
            collection: "tags",
            depth: 0,
            pagination: false,
            where: { name: { like: input.search } },
            select: { name: true },
          });
          relevance = createSearchRelevance(input.search, new Set(matchingTags.docs.map((tag) => tag.id)));
        }

        const placement: SponsoredPlacement = { injectionInterval };

        const orderedIds = isCurated
          ? buildCuratedOrder(candidates.docs, {
              ...placement,
              seed: input.seed ?? Math.floor(Date.now() / CURATED_SEED_WINDOW_MS),
              outOfWindowSponsoredIds,
              relevance,
            })
          : buildSortedOrder(candidates.docs, { ...placement, outOfWindowSponsoredIds });

        const page = input.cursor;
        // Sponsored products repeat in their slots, so the listing is longer than the number
        // of matching products; totalDocs stays the real product count (used for result counts)
        const totalDocs = candidates.docs.length;
        const totalPages = Math.max(1, Math.ceil(orderedIds.length / input.limit));
        const pageIds = orderedIds.slice((page - 1) * input.limit, page * input.limit);

        const pageData = await ctx.db.find({
          collection: "products",
          depth: 1,
          where: { id: { in: pageIds } },
          limit: input.limit,
          select: {
            content: false,
          },
        });

        const docsById = new Map(pageData.docs.map((doc) => [doc.id, doc]));

        return {
          ...pageData,
          docs: pageIds.flatMap((id) => docsById.get(id) ?? []),
          totalDocs,
          limit: input.limit,
          totalPages,
          page,
          pagingCounter: (page - 1) * input.limit + 1,
          hasPrevPage: page > 1,
          hasNextPage: page < totalPages,
          prevPage: page > 1 ? page - 1 : null,
          nextPage: page < totalPages ? page + 1 : null,
        };
      };

      const data = await findOrderedPage();

      // Fetch all reviews for all products in one query to avoid N+1 problem
      const productIds = data.docs.map(doc => doc.id);
      const allReviewsData = await ctx.db.find({
        collection: "reviews",
        pagination: false,
        where: {
          product: {
            in: productIds,
          },
        },
      });

      // Group reviews by product ID for efficient lookup
      const reviewsByProduct = allReviewsData.docs.reduce((acc, review) => {
        const productId = typeof review.product === 'string' ? review.product : review.product.id;
        if (!acc[productId]) {
          acc[productId] = [];
        }
        acc[productId].push(review);
        return acc;
      }, {} as Record<string, typeof allReviewsData.docs>);

      // Fetch all sales for all products in one query to calculate total sold
      const allSalesData = await ctx.db.find({
        collection: "sales",
        pagination: false,
        where: {
          product: {
            in: productIds,
          },
          status: {
            not_in: ["cancelled", "refunded"],
          },
        },
      });

      // Group sales by product ID and calculate total sold
      const totalSoldByProduct = allSalesData.docs.reduce((acc, sale) => {
        const productId = typeof sale.product === 'string' ? sale.product : sale.product.id;
        if (!acc[productId]) {
          acc[productId] = 0;
        }
        acc[productId] += sale.quantity || 0;
        return acc;
      }, {} as Record<string, number>);

      // Calculate review stats for each product
      const dataWithSummarizedReviews = data.docs.map((doc) => {
        const productReviews = reviewsByProduct[doc.id] || [];
        
        return {
          ...doc,
          reviewCount: productReviews.length,
          reviewRating: productReviews.length === 0
            ? 0
            : productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length,
          totalSold: totalSoldByProduct[doc.id] || 0,
        };
      });

      return {
        ...data,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          sponsorshipStatus: outOfWindowSponsoredIds.has(doc.id) ? "none" : (doc as any).sponsorshipStatus,
          image: (doc as PopulatedProduct).image,
          tenant: (doc as PopulatedProduct).tenant as Tenant & { image: Media | null; location?: string | null },
        }))
      }
    }),
  
  // Get products for current tenant (dashboard view)
  getMyProducts: protectedProcedure
    .input(
      z.object({
        cursor: z.number().default(1),
        limit: z.number().default(DEFAULT_LIMIT),
        search: z.string().nullable().optional(),
        includeArchived: z.boolean().default(false),
      }),
    )
    .query(async ({ ctx, input }) => {
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

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      const where: Where = {
        tenant: {
          equals: tenantId,
        },
      };

      if (!input.includeArchived) {
        where.isArchived = {
          not_equals: true,
        };
      }

      if (input.search) {
        where["name"] = {
          like: input.search,
        };
      }

      const data = await ctx.db.find({
        collection: "products",
        depth: 1,
        where,
        sort: "-createdAt",
        page: input.cursor,
        limit: input.limit,
        select: {
          content: false,
        },
      });

      // Fetch all reviews for all products in one query
      const productIds = data.docs.map(doc => doc.id);
      const allReviewsData = await ctx.db.find({
        collection: "reviews",
        pagination: false,
        where: {
          product: {
            in: productIds,
          },
        },
      });

      // Group reviews by product ID
      const reviewsByProduct = allReviewsData.docs.reduce((acc, review) => {
        const productId = typeof review.product === 'string' ? review.product : review.product.id;
        if (!acc[productId]) {
          acc[productId] = [];
        }
        acc[productId].push(review);
        return acc;
      }, {} as Record<string, typeof allReviewsData.docs>);

      // Calculate review stats for each product
      const dataWithSummarizedReviews = data.docs.map((doc) => {
        const productReviews = reviewsByProduct[doc.id] || [];
        
        return {
          ...doc,
          reviewCount: productReviews.length,
          reviewRating: productReviews.length === 0
            ? 0
            : productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length
        };
      });

      // Fetch pending sponsorships to get momo payment codes
      const sponsorshipsData = await ctx.db.find({
        collection: "sponsorships" as any,
        pagination: false,
        where: {
          product: {
            in: productIds,
          },
          status: {
            equals: "pending",
          }
        },
      });

      const momoCodesByProduct = sponsorshipsData.docs.reduce((acc: any, sponsorship: any) => {
        const productId = typeof sponsorship.product === 'string' ? sponsorship.product : sponsorship.product?.id;
        if (productId && sponsorship.momoCode) {
          acc[productId] = sponsorship.momoCode;
        }
        return acc;
      }, {});

      return {
        ...data,
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          image: (doc as PopulatedProduct).image,
          tenant: (doc as PopulatedProduct).tenant as Tenant & { image: Media | null; location?: string | null },
          pendingMomoCode: momoCodesByProduct[doc.id] || null,
        }))
      };
    }),

  // Create a new product
  createProduct: protectedProcedure
    .input(createProductSchema)
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

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // All tenants can create products (verified or not)
      // Products from unverified tenants will be listed without verification badge

      // Transform gallery array to Payload format
      const productData: any = {
        ...input,
        tenant: tenantId,
      };

      if (input.gallery && input.gallery.length > 0) {
        productData.gallery = input.gallery.map((mediaId) => ({
          media: mediaId,
        }));
      }

      // Create the product
      const product = await ctx.db.create({
        collection: "products",
        data: productData,
      });

      return product;
    }),

  // Update an existing product
  updateProduct: protectedProcedure
    .input(updateProductSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      console.log('[updateProduct] Received input:', { id, updateData });

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

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // Verify the product belongs to this tenant
      const existingProduct = await ctx.db.findByID({
        collection: "products",
        id,
      });

      const productTenantId = typeof existingProduct.tenant === 'string'
        ? existingProduct.tenant
        : existingProduct.tenant?.id;

      if (productTenantId !== tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own products",
        });
      }

      // Transform gallery array to Payload format if provided
      const finalUpdateData: any = {};
      
      // Only include fields that are actually being updated (not undefined)
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          finalUpdateData[key] = value;
        }
      });

      if (finalUpdateData.gallery && Array.isArray(finalUpdateData.gallery)) {
        finalUpdateData.gallery = finalUpdateData.gallery.map((mediaId: string) => ({
          media: mediaId,
        }));
      }

      // Ensure category is an array of strings (supports multiple categories)
      if (finalUpdateData.category) {
        if (typeof finalUpdateData.category === 'string') {
          finalUpdateData.category = [finalUpdateData.category];
        } else if (Array.isArray(finalUpdateData.category)) {
          // Ensure all items are strings (extract IDs if objects)
          finalUpdateData.category = finalUpdateData.category.map((cat: any) => 
            typeof cat === 'string' ? cat : cat.id || cat
          );
        }
      }

      console.log('[updateProduct] Final data to update:', finalUpdateData);

      // Update the product
      const product = await ctx.db.update({
        collection: "products",
        id,
        data: finalUpdateData,
      });

      return product;
    }),

  // Delete a product (archive it)
  deleteProduct: protectedProcedure
    .input(z.object({ id: z.string() }))
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

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // Verify the product belongs to this tenant
      const existingProduct = await ctx.db.findByID({
        collection: "products",
        id: input.id,
      });

      const productTenantId = typeof existingProduct.tenant === 'string'
        ? existingProduct.tenant
        : existingProduct.tenant?.id;

      if (productTenantId !== tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own products",
        });
      }

      // Archive the product instead of deleting
      const product = await ctx.db.update({
        collection: "products",
        id: input.id,
        data: {
          isArchived: true,
        },
      });

      return product;
    }),

  // Check stock availability for a product
  checkStock: baseProcedure
    .input(
      z.object({
        productId: z.string(),
        quantity: z.number().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const product = await ctx.db.findByID({
        collection: "products",
        id: input.productId,
        depth: 0,
      });

      if (!product) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found",
        });
      }

      const available = product.quantity >= input.quantity;
      const maxAvailable = product.quantity;
      const minOrder = product.minOrderQuantity || 1;
      const maxOrder = product.maxOrderQuantity || product.quantity;

      return {
        available,
        currentStock: product.quantity,
        requestedQuantity: input.quantity,
        maxAvailable,
        minOrderQuantity: minOrder,
        maxOrderQuantity: maxOrder,
        unit: product.unit || "unit",
        stockStatus: product.stockStatus,
        allowBackorder: product.allowBackorder || false,
        canPurchase: available || product.allowBackorder,
      };
    }),

  // Bulk update product quantities (for inventory management)
  updateQuantity: protectedProcedure
    .input(
      z.object({
        productId: z.string(),
        quantityChange: z.number(), // Positive to add, negative to subtract
        reason: z.enum(["restock", "damage", "sold", "correction", "return"]).optional(),
      })
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

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // Verify the product belongs to this tenant
      const existingProduct = await ctx.db.findByID({
        collection: "products",
        id: input.productId,
      });

      const productTenantId = typeof existingProduct.tenant === 'string'
        ? existingProduct.tenant
        : existingProduct.tenant?.id;

      if (productTenantId !== tenantId) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only update your own products",
        });
      }

      // Calculate new quantity
      const newQuantity = Math.max(0, existingProduct.quantity + input.quantityChange);

      // Update product
      const product = await ctx.db.update({
        collection: "products",
        id: input.productId,
        data: {
          quantity: newQuantity,
        },
      });

      return {
        success: true,
        previousQuantity: existingProduct.quantity,
        newQuantity: product.quantity,
        change: input.quantityChange,
      };
    }),

  // Get suggested products (from current tenant and other tenants, excluding current product)
  getSuggested: baseProcedure
    .input(
      z.object({
        productId: z.string(),
        tenantSlug: z.string().optional(),
        limit: z.number().default(8),
      })
    )
    .query(async ({ ctx, input }) => {
      // First, get the current product to find its tenant
      const currentProduct = await ctx.db.findByID({
        collection: "products",
        id: input.productId,
        depth: 1,
      });

      const currentTenantId = typeof currentProduct.tenant === 'string'
        ? currentProduct.tenant
        : currentProduct.tenant?.id;

      // Get all verified tenants
      const allTenants = await ctx.db.find({
        collection: "tenants",
        where: {
          isVerified: {
            equals: true,
          },
        },
        limit: 100,
        pagination: false,
      });

      const tenantIds = allTenants.docs.map(t => t.id);

      // First, try to get products from the current tenant
      const currentTenantWhere: Where = {
        and: [
          {
            id: {
              not_equals: input.productId,
            },
          },
          {
            isArchived: {
              not_equals: true,
            },
          },
          {
            isPrivate: {
              not_equals: true,
            },
          },
          ...(currentTenantId ? [{
            tenant: {
              equals: currentTenantId,
            },
          }] : []),
        ],
      };

      const currentTenantProducts = await ctx.db.find({
        collection: "products",
        depth: 1,
        where: currentTenantWhere,
        sort: "-createdAt",
        limit: input.limit,
        select: {
          content: false,
        },
      });

      // If we need more products, get from other tenants
      let allProducts = [...currentTenantProducts.docs];
      const remainingLimit = input.limit - allProducts.length;

      if (remainingLimit > 0) {
        const otherTenantsWhere: Where = {
          and: [
            {
              id: {
                not_equals: input.productId,
                ...(allProducts.length > 0 ? {
                  not_in: allProducts.map(p => p.id),
                } : {}),
              },
            },
            {
              isArchived: {
                not_equals: true,
              },
            },
            {
              isPrivate: {
                not_equals: true,
              },
            },
            {
              tenant: {
                in: tenantIds.filter(id => id !== currentTenantId),
              },
            },
          ],
        };

        const otherTenantsProducts = await ctx.db.find({
          collection: "products",
          depth: 1,
          where: otherTenantsWhere,
          sort: "-createdAt",
          limit: remainingLimit,
          select: {
            content: false,
          },
        });

        allProducts = [...allProducts, ...otherTenantsProducts.docs];
      }

      // Create a data-like structure for compatibility
      const data = {
        docs: allProducts,
      };

      // Fetch all reviews for all products in one query
      const productIds = data.docs.map(doc => doc.id);
      const allReviewsData = await ctx.db.find({
        collection: "reviews",
        pagination: false,
        where: {
          product: {
            in: productIds,
          },
        },
      });

      // Group reviews by product ID
      const reviewsByProduct = allReviewsData.docs.reduce((acc, review) => {
        const productId = typeof review.product === 'string' ? review.product : review.product.id;
        if (!acc[productId]) {
          acc[productId] = [];
        }
        acc[productId].push(review);
        return acc;
      }, {} as Record<string, typeof allReviewsData.docs>);

      // Calculate review stats for each product
      const dataWithSummarizedReviews = data.docs.map((doc) => {
        const productReviews = reviewsByProduct[doc.id] || [];
        
        return {
          ...doc,
          reviewCount: productReviews.length,
          reviewRating: productReviews.length === 0
            ? 0
            : productReviews.reduce((acc, review) => acc + review.rating, 0) / productReviews.length
        };
      });

      return {
        docs: dataWithSummarizedReviews.map((doc) => ({
          ...doc,
          image: (doc as PopulatedProduct).image,
          tenant: (doc as PopulatedProduct).tenant as Tenant & { image: Media | null; location?: string | null },
        }))
      };
    }),

  // Get notification count for products (out-of-stock + low-stock)
  getProductNotificationCount: protectedProcedure
    .query(async ({ ctx }) => {
      // Get current user's tenant
      const userData = await ctx.db.findByID({
        collection: "users",
        id: ctx.session.user.id,
      });

      if (!userData.tenants?.[0]) {
        return { count: 0, outOfStock: 0, lowStock: 0 };
      }

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // Get all products for this tenant (not archived)
      const products = await ctx.db.find({
        collection: "products",
        where: {
          and: [
            {
              tenant: {
                equals: tenantId,
              },
            },
            {
              isArchived: {
                not_equals: true,
              },
            },
          ],
        },
        pagination: false,
      });

      let outOfStockCount = 0;
      let lowStockCount = 0;

      products.docs.forEach((product) => {
        const quantity = product.quantity ?? 0;
        if (quantity === 0) {
          outOfStockCount++;
        } else if (quantity > 0 && quantity <= 5) {
          lowStockCount++;
        }
      });

      return {
        count: outOfStockCount + lowStockCount,
        outOfStock: outOfStockCount,
        lowStock: lowStockCount,
      };
    }),

  // Get total views count for all tenant's products
  getTotalViewsCount: protectedProcedure
    .query(async ({ ctx }) => {
      // Get current user's tenant
      const userData = await ctx.db.findByID({
        collection: "users",
        id: ctx.session.user.id,
      });

      if (!userData.tenants?.[0]) {
        return { totalViews: 0 };
      }

      const tenantId = typeof userData.tenants[0].tenant === 'string' 
        ? userData.tenants[0].tenant 
        : userData.tenants[0].tenant.id;

      // Get all products for this tenant (not archived)
      const products = await ctx.db.find({
        collection: "products",
        where: {
          and: [
            {
              tenant: {
                equals: tenantId,
              },
            },
            {
              isArchived: {
                not_equals: true,
              },
            },
          ],
        },
        pagination: false,
      });

      // Sum up all viewCount values
      let totalViews = 0;
      products.docs.forEach((product: any) => {
        totalViews += product.viewCount || 0;
      });

      return { totalViews };
    }),

  // Track product view
  trackView: baseProcedure
    .input(
      z.object({
        productId: z.string(),
        isUnique: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Fetch current product to get view counts
        const product = await ctx.db.findByID({
          collection: "products",
          id: input.productId,
        }) as any; // Use 'any' temporarily until types are regenerated

        const updateData: any = {
          viewCount: (product.viewCount || 0) + 1,
        };
        
        if (input.isUnique) {
          updateData.uniqueViewCount = (product.uniqueViewCount || 0) + 1;
        }

        await ctx.db.update({
          collection: "products",
          id: input.productId,
          data: updateData,
        });

        const tenantId = typeof product.tenant === 'string' ? product.tenant : product.tenant?.id;

        if (tenantId) {
          // Log the time-series event for time-based analytics
          await ctx.db.create({
            collection: "page-views" as any,
            data: {
              type: "product_view",
              tenantId,
              productId: input.productId,
              visitorId: "anonymous", // In a real app, hash the IP or use a session cookie
            },
          });
        }

        return { success: true };
      } catch (error) {
        console.error('Error tracking product view:', error);
        // Don't throw error - view tracking shouldn't break the app
        return { success: false };
      }
    }),

  // Get product counts by category
  getCategoryCounts: baseProcedure
    .query(async ({ ctx }) => {
      try {
        // Get all categories (explicit limit so we don't hit Payload's default page size)
        const categories = await ctx.db.find({
          collection: "categories",
          pagination: false,
          limit: 10000,
          depth: 0,
        });

        // Get all non-archived, public products (explicit limit to count every product)
        const products = await ctx.db.find({
          collection: "products",
          pagination: false,
          limit: 10000,
          where: {
            and: [
              {
                isArchived: {
                  not_equals: true,
                },
              },
              {
                isPrivate: {
                  not_equals: true,
                },
              },
            ],
          },
          depth: 0,
          select: {
            id: true,
            category: true,
          },
        });

        // Count products for each category
        const counts: Record<string, number> = {};
        
        categories.docs.forEach((category) => {
          counts[category.id] = 0;
        });

        products.docs.forEach((product: any) => {
          const rawCategories = Array.isArray(product.category)
            ? product.category
            : product.category != null ? [product.category] : [];
          const categoryIds = rawCategories.map((cat: unknown) =>
            typeof cat === "object" && cat !== null && "id" in (cat as object)
              ? (cat as { id: string }).id
              : String(cat)
          );
          categoryIds.forEach((catId: string) => {
            if (catId && counts[catId] !== undefined) {
              counts[catId]++;
            }
          });
        });

        return counts;
      } catch (error) {
        console.error('Error getting category counts:', error);
        return {};
      }
    }),

  // Request sponsorship for a product
  requestSponsorship: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      durationDays: z.number().min(1).max(365).default(7),
      targetLocationType: z.enum(["default_product_location", "custom_location"]).default("default_product_location"),
      locationCountry: z.string().optional(),
      locationProvince: z.string().optional(),
      locationDistrict: z.string().optional(),
      locationCityOrArea: z.string().optional(),
      targetGender: z.enum(["all", "men", "women"]).default("all"),
      targetAgeMin: z.number().min(0).max(100).default(18),
      targetAgeMax: z.number().min(0).max(120).default(65),
      budgetAmount: z.number().min(2000).max(25000).optional(),
      paymentMessage: z.string().min(1, "Please paste your payment confirmation message"),
    }))
    .mutation(async ({ ctx, input }) => {
      // Find the product first to verify ownership
      const product = await ctx.db.findByID({
        collection: "products",
        id: input.id,
      });

      if (!product) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      // Verify the user owns the tenant that owns this product
      const tenantId = typeof product.tenant === 'string' ? product.tenant : product.tenant?.id;
      const userTenants = (ctx.session.user.tenants || [])
        .map(t => typeof t.tenant === 'string' ? t.tenant : t.tenant?.id)
        .filter(Boolean) as string[];
      
      if (!tenantId || !userTenants.includes(tenantId)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You don't have permission to modify this product" });
      }

      // Check if a pending or active sponsorship already exists
      const existingSponsorships = await ctx.db.find({
        collection: "sponsorships" as any,
        where: {
          and: [
            { product: { equals: input.id } },
            { status: { in: ["pending", "active"] } }
          ]
        },
        limit: 1,
      });

      if (existingSponsorships.docs.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "A sponsorship request is already pending or active for this product" });
      }

      // Calculate requested dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + input.durationDays);

      // Create a new sponsorship request
      await ctx.db.create({
        collection: "sponsorships" as any,
        data: {
          product: input.id,
          tenant: tenantId,
          status: "pending",
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          targetLocationType: input.targetLocationType,
          locationCountry: input.locationCountry,
          locationProvince: input.locationProvince,
          locationDistrict: input.locationDistrict,
          locationCityOrArea: input.locationCityOrArea,
          targetGender: input.targetGender,
          targetAgeMin: input.targetAgeMin,
          targetAgeMax: input.targetAgeMax,
          budgetAmount: input.budgetAmount,
          totalAmount: (input.budgetAmount || 2000) * input.durationDays,
          paymentMessage: input.paymentMessage,
        } as any,
      });

      return { success: true };
    }),

  // Get global site settings (for Momo Code, etc)
  getSiteSettings: baseProcedure
    .query(async ({ ctx }) => {
      try {
        const settings = await ctx.db.findGlobal({
          slug: "site-settings" as any as never,
        });
        return {
          paymentMomoCode: (settings as any)?.paymentMomoCode || null,
        };
      } catch (error) {
        return { paymentMomoCode: null };
      }
    }),
});
