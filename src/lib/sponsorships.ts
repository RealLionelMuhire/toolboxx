import type { Payload } from "payload";

// "sponsorships" is missing from the generated payload-types, so rows are typed by hand here
type SponsorshipRow = { id: string; product?: unknown; startDate?: string | null; endDate?: string | null };

const toTime = (value: unknown) => (value ? new Date(value as string).getTime() : null);

const getProductId = (product: unknown): string | null => {
  if (!product) return null;
  if (typeof product === "string") return product;
  return (product as { id?: string }).id ?? null;
};

/**
 * Returns the product IDs whose active sponsorship has not started yet or has already ended.
 * Products are only listed here when they have no sponsorship currently running, so a
 * product with a manually set "approved" status and no sponsorship record stays sponsored.
 */
export async function getOutOfWindowSponsoredProductIds(payload: Payload): Promise<Set<string>> {
  const now = Date.now();
  const active = await payload.find({
    collection: "sponsorships" as any,
    depth: 0,
    pagination: false,
    where: { status: { equals: "active" } },
    select: { product: true, startDate: true, endDate: true },
  });

  const running = new Set<string>();
  const outOfWindow = new Set<string>();

  for (const sponsorship of active.docs as unknown as SponsorshipRow[]) {
    const productId = getProductId(sponsorship.product);
    if (!productId) continue;

    const start = toTime(sponsorship.startDate);
    const end = toTime(sponsorship.endDate);
    const isRunning = (start === null || start <= now) && (end === null || end > now);

    if (isRunning) running.add(productId);
    else outOfWindow.add(productId);
  }

  for (const productId of running) outOfWindow.delete(productId);
  return outOfWindow;
}

/**
 * Marks active sponsorships whose end date has passed as "expired".
 * The Sponsorships afterChange hook then resets the product's sponsorshipStatus to "none".
 */
export async function expireEndedSponsorships(payload: Payload) {
  const ended = await payload.find({
    collection: "sponsorships" as any,
    depth: 0,
    pagination: false,
    where: {
      and: [
        { status: { equals: "active" } },
        { endDate: { less_than_equal: new Date().toISOString() } },
      ],
    },
  });

  const expiredIds: string[] = [];
  const failedIds: string[] = [];

  for (const sponsorship of ended.docs as unknown as SponsorshipRow[]) {
    try {
      await payload.update({
        collection: "sponsorships" as any,
        id: sponsorship.id,
        data: { status: "expired" } as any,
        overrideAccess: true,
      });
      expiredIds.push(sponsorship.id);
    } catch (error) {
      console.error("[Sponsorships] Failed to expire sponsorship", sponsorship.id, error);
      failedIds.push(sponsorship.id);
    }
  }

  return { expiredIds, failedIds };
}
