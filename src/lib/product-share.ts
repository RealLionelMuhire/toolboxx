import type { Payload } from "payload";

import { formatCurrency } from "@/lib/utils";

export type ProductShareData = {
  id: string;
  name: string;
  description: string;
  priceLabel: string;
  imageUrl: string | null;
  tenantName: string | null;
  tenantSlug: string | null;
  updatedAt: string;
};

const getMediaUrl = (media: unknown): string | null => {
  if (!media || typeof media !== "object") return null;
  const url = (media as { url?: string | null }).url;
  return url || null;
};

// Flattens Lexical rich text into plain text for link-preview descriptions
const richTextToPlainText = (node: unknown): string => {
  if (!node || typeof node !== "object") return "";
  const { text, children, root } = node as { text?: string; children?: unknown[]; root?: unknown };
  if (typeof text === "string") return text;
  if (root) return richTextToPlainText(root);
  if (Array.isArray(children)) return children.map(richTextToPlainText).join(" ");
  return "";
};

const truncate = (value: string, max: number) =>
  value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;

/**
 * Loads what link previews (WhatsApp, Facebook, X, ...) need for a product.
 * Returns null for missing or archived products so nothing leaks into previews.
 */
export async function getProductShareData(payload: Payload, productId: string): Promise<ProductShareData | null> {
  try {
    const product = await payload.findByID({
      collection: "products",
      id: productId,
      depth: 1,
      select: {
        name: true,
        description: true,
        price: true,
        unit: true,
        image: true,
        gallery: true,
        tenant: true,
        isArchived: true,
        updatedAt: true,
      },
    });

    if (!product || product.isArchived) return null;

    const tenant = product.tenant && typeof product.tenant === "object" ? product.tenant : null;
    const currency = tenant?.currency || "RWF";
    const priceLabel = `${formatCurrency(product.price, currency)} / ${product.unit || "unit"}`;

    const plainDescription = richTextToPlainText(product.description).replace(/\s+/g, " ").trim();
    const description = truncate(
      plainDescription || `Buy ${product.name}${tenant?.name ? ` from ${tenant.name}` : ""} on ToolBay.`,
      200,
    );

    const imageUrl =
      getMediaUrl(product.image) ||
      getMediaUrl(product.gallery?.[0]?.media) ||
      getMediaUrl(tenant?.image);

    return {
      id: product.id,
      name: product.name,
      description: `${priceLabel} · ${description}`,
      priceLabel,
      imageUrl,
      tenantName: tenant?.name ?? null,
      tenantSlug: tenant?.slug ?? null,
      updatedAt: product.updatedAt,
    };
  } catch {
    return null;
  }
}
