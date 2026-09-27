import type { SearchParams } from "nuqs/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DEFAULT_LIMIT } from "@/constants";
import { getQueryClient, trpc } from "@/trpc/server";

import { ProductListView } from "@/modules/products/ui/views/product-list-view";
import { loadProductFilters } from "@/modules/products/search-params";
import { TrackStoreView } from "@/components/track-store-view";

interface Props {
  searchParams: Promise<SearchParams>;
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

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

