import { Suspense } from "react";
import type { Metadata } from "next";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { getQueryClient, trpc } from "@/trpc/server";
import { getPayloadSingleton } from "@/lib/payload-singleton";
import { getProductShareData } from "@/lib/product-share";
import { generateTenantResourceURL } from "@/lib/utils";

import { ProductView, ProductViewSkeleton } from "@/modules/products/ui/views/product-view";

interface Props {
  params: Promise<{ productId: string; slug: string }>;
};

export const dynamic = "force-dynamic";

// Link previews (WhatsApp, Facebook, X, ...) read these tags when a product link is shared
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { productId, slug } = await params;
  const product = await getProductShareData(await getPayloadSingleton(), productId);

  if (!product) {
    return { title: "Product not found | ToolBay" };
  }

  const title = product.tenantName
    ? `${product.name} | ${product.tenantName}`
    : product.name;
  const url = generateTenantResourceURL(product.tenantSlug || slug, `/products/${product.id}`);
  // The version busts social-media caches when the product photo changes
  const image = {
    url: `/api/og/product/${product.id}?v=${encodeURIComponent(product.updatedAt)}`,
    width: 1200,
    height: 630,
    alt: product.name,
  };

  return {
    title: `${title} | ToolBay`,
    description: product.description,
    openGraph: {
      type: "website",
      siteName: "ToolBay",
      title,
      description: product.description,
      url,
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: product.description,
      images: [image.url],
    },
  };
}

const Page = async ({ params }: Props) => {
  const { productId, slug } = await params;

  const queryClient = getQueryClient();
  
  // Prefetch both tenant and product data on the server
  void queryClient.prefetchQuery(trpc.tenants.getOne.queryOptions({
    slug,
  }));
  
  // Prefetch product data to avoid client-side loading delay
  void queryClient.prefetchQuery(trpc.products.getOne.queryOptions({
    id: productId,
  }));

  return ( 
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<ProductViewSkeleton />}>
        <ProductView productId={productId} tenantSlug={slug} />
      </Suspense>
    </HydrationBoundary>
  );
}
 
export default Page;
