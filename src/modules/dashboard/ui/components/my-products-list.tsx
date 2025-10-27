"use client";

import { InboxIcon } from "lucide-react";
import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { DEFAULT_LIMIT } from "@/constants";
import { Button } from "@/components/ui/button";

import { MyProductCard, MyProductCardSkeleton } from "@/modules/dashboard/ui/components/my-product-card";

interface Props {
  searchQuery?: string;
  onEdit?: (productId: string) => void;
  onDelete?: (productId: string, productName: string) => void;
}

export const MyProductsList = ({ searchQuery, onEdit, onDelete }: Props) => {
  const trpc = useTRPC();
  const { 
    data, 
    hasNextPage, 
    isFetchingNextPage, 
    fetchNextPage
  } = useSuspenseInfiniteQuery(trpc.products.getMyProducts.infiniteQueryOptions(
    {
      search: searchQuery || null,
      limit: DEFAULT_LIMIT,
    },
    {
      getNextPageParam: (lastPage) => {
        return lastPage.docs.length > 0 ? lastPage.nextPage : undefined;
      },
    }
  ));

  if (data.pages?.[0]?.docs.length === 0) {
    return (
      <div className="border border-black border-dashed flex items-center justify-center p-8 flex-col gap-y-4 bg-white w-full rounded-lg">
        <InboxIcon />
        <p className="text-base font-medium">No products found</p>
        <p className="text-sm text-gray-600">
          {searchQuery 
            ? "Try adjusting your search terms" 
            : "Create your first product to get started"}
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data?.pages.flatMap((page) => page.docs).map((product) => (
          <MyProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            imageUrl={product.image?.url}
            tenantSlug={product.tenant?.slug}
            tenantImageUrl={product.tenant?.image?.url}
            reviewRating={product.reviewRating}
            reviewCount={product.reviewCount}
            price={product.price}
            isPrivate={product.isPrivate ?? false}
            isArchived={product.isArchived ?? false}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
      <div className="flex justify-center pt-8">
        {hasNextPage && (
          <Button
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
            className="font-medium disabled:opacity-50 text-base bg-white"
            variant="elevated"
          >
            Load more
          </Button>
        )}
      </div>
    </>
  );
};

export const MyProductsListSkeleton = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: DEFAULT_LIMIT }).map((_, index) => (
        <MyProductCardSkeleton key={index} />
      ))}
    </div>
  );
};
