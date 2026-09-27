import type { Metadata } from "next";
import type { SearchParams } from "nuqs/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DEFAULT_LIMIT } from "@/constants";
import { getQueryClient, trpc } from "@/trpc/server";

import { ProductListView } from "@/modules/products/ui/views/product-list-view";
import { loadProductFilters } from "@/modules/products/search-params";
import { TrackStoreView } from "@/components/track-store-view";
import { getPayloadSingleton } from "@/lib/payload-singleton";
import { getStoreShareData } from "@/lib/store-share";
import { generateTenantURL } from "@/lib/utils";

interface Props {
  searchParams: Promise<SearchParams>;
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

// Link previews (WhatsApp, Facebook, X, ...) read these tags when a store link is shared
export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { slug } = await params;
  const store = await getStoreShareData(await getPayloadSingleton(), slug);

  if (!store) {
    return { title: "Store not found | ToolBay" };
  }

  // The version busts social-media caches when the store's logo or details change
  const image = {
    url: `/api/og/store/${store.slug}?v=${encodeURIComponent(store.updatedAt)}`,
    width: 1200,
    height: 630,
    alt: store.name,
  };

  return {
    title: `${store.name} | ToolBay`,
    description: store.description,
    openGraph: {
      type: "website",
      siteName: "ToolBay",
      title: store.name,
      description: store.description,
      url: generateTenantURL(store.slug),
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: store.name,
      description: store.description,
      images: [image.url],
    },
  };
}

const Page = async ({ params, searchParams }: Props) => {
  const { slug } = await params;
  const filters = await loadProductFilters(searchParams);

    // New curated order per visit, shared with the client so infinite-scroll pages stay consistent
    const seed = Math.floor(Math.random() * 2 ** 31);

    const queryClient = getQueryClient();
    void queryClient.prefetchInfiniteQuery(trpc.products.getMany.infiniteQueryOptions({
      ...filters,
      tenantSlug: slug,
      seed,
      limit: DEFAULT_LIMIT,
    }));

    return ( 
      <HydrationBoundary state={dehydrate(queryClient)}>
        {/* Invisible tracking — increments storeViewCount on each visit */}
        <TrackStoreView slug={slug} />
        <ProductListView tenantSlug={slug} narrowView seed={seed} />
      </HydrationBoundary>
    );
}
 
export default Page;

