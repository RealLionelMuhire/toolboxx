import type { Payload } from "payload";

import { getDistrictByCode, getProvinceByCode } from "@/lib/location-data";

export type StoreShareData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  locationLabel: string | null;
  categoryLabel: string | null;
  isVerified: boolean;
  productCount: number;
  logoUrl: string | null;
  updatedAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  retailer: "Retailer",
  wholesale: "Wholesale",
  industry: "Industry",
  renter: "Renter",
  logistics: "Logistics",
};

/**
 * Loads what link previews need for a store. Only public-facing fields are read,
 * never payment or verification details.
 */
export async function getStoreShareData(payload: Payload, slug: string): Promise<StoreShareData | null> {
  try {
    const tenants = await payload.find({
      collection: "tenants",
      limit: 1,
      depth: 1,
      where: { slug: { equals: slug } },
      select: {
        name: true,
        slug: true,
        image: true,
        category: true,
        isVerified: true,
        locationCountry: true,
        locationProvince: true,
        locationDistrict: true,
        locationCityOrArea: true,
        updatedAt: true,
      },
    });

    const tenant = tenants.docs[0];
    if (!tenant) return null;

    // Same visibility rules as the public storefront
    const products = await payload.count({
      collection: "products",
      where: {
        and: [
          { tenant: { equals: tenant.id } },
          { isArchived: { not_equals: true } },
          { isPrivate: { not_equals: true } },
        ],
      },
    });

    // "District, Province" from the codes: the stored location string can be stale and the
    // free-text city field often repeats the country or province
    const district = tenant.locationCountry && tenant.locationProvince && tenant.locationDistrict
      ? getDistrictByCode(tenant.locationCountry, tenant.locationProvince, tenant.locationDistrict)
      : undefined;
    const province = tenant.locationCountry && tenant.locationProvince
      ? getProvinceByCode(tenant.locationCountry, tenant.locationProvince)
      : undefined;
    const locationLabel = [district?.name, province?.name].filter(Boolean).join(", ") || null;

    const categoryLabel = tenant.category ? CATEGORY_LABELS[tenant.category] ?? null : null;
    const productCount = products.totalDocs;
    const logoUrl = tenant.image && typeof tenant.image === "object" ? tenant.image.url || null : null;

    const description = [
      tenant.isVerified ? "Verified store" : null,
      categoryLabel,
      locationLabel,
      `${productCount} product${productCount === 1 ? "" : "s"} on ToolBay`,
    ].filter(Boolean).join(" · ");

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description,
      locationLabel,
      categoryLabel,
      isVerified: !!tenant.isVerified,
      productCount,
      logoUrl,
      updatedAt: tenant.updatedAt,
    };
  } catch {
    return null;
  }
}
