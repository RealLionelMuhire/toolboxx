import type { SearchParams } from "nuqs/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DEFAULT_LIMIT } from "@/constants";
import { getQueryClient, trpc } from "@/trpc/server";

import { loadProductFilters } from "@/modules/products/search-params";
import { ProductListView } from "@/modules/products/ui/views/product-list-view";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<SearchParams>;
};

const Page = async ({ searchParams }: Props) => {
  const filters = await loadProductFilters(searchParams);

  // New curated order per visit, shared with the client so infinite-scroll pages stay consistent
  const seed = Math.floor(Math.random() * 2 ** 31);

  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(trpc.products.getMany.infiniteQueryOptions({
    ...filters,
    seed,
    limit: DEFAULT_LIMIT,
  }));

  return ( 
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListView seed={seed} />
    </HydrationBoundary>
  );
};

export default Page;
