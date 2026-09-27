import type { SearchParams } from "nuqs/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { DEFAULT_LIMIT } from "@/constants";
import { getQueryClient, trpc } from "@/trpc/server";

import { loadProductFilters } from "@/modules/products/search-params";
import { ProductListView } from "@/modules/products/ui/views/product-list-view";

interface Props {
  params: Promise<{
    category: string;
  }>,
  searchParams: Promise<SearchParams>;
};

export const dynamic = "force-dynamic";

const Page = async ({ params, searchParams }: Props) => {
  const { category } = await params;
  const filters = await loadProductFilters(searchParams);

  // New curated order per visit, shared with the client so infinite-scroll pages stay consistent
  const seed = Math.floor(Math.random() * 2 ** 31);

  const queryClient = getQueryClient();
  void queryClient.prefetchInfiniteQuery(trpc.products.getMany.infiniteQueryOptions({
    ...filters,
    category,
    seed,
    limit: DEFAULT_LIMIT,
  }));

  return ( 
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductListView category={category} seed={seed} />
    </HydrationBoundary>
  );
};

export default Page;
