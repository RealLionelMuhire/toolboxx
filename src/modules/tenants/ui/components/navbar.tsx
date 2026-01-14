"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { ShoppingCartIcon, Share2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { generateTenantURL } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const CheckoutButton = dynamic(
  () => import("@/modules/checkout/ui/components/checkout-button").then(
    (mod) => mod.CheckoutButton,
  ),
  {
    ssr: false,
    loading: () => (
      <Button disabled className="bg-white">
        <ShoppingCartIcon className="text-black" />
      </Button>
    )
  },
);

interface Props {
  slug: string;
};

export const Navbar = ({ slug }: Props) => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(trpc.tenants.getOne.queryOptions({ slug }));

  const handleShare = async () => {
    const storeUrl = `${window.location.origin}${generateTenantURL(slug)}`;
    
    // Try using Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${data.name} - Store`,
          text: `Check out ${data.name} on Toolbay!`,
          url: storeUrl,
        });
        toast.success("Store shared successfully!");
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(storeUrl);
        toast.success("Store link copied to clipboard!");
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error("Failed to copy link");
      }
    }
  };

  return (
    <nav className="h-20 border-b font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href={generateTenantURL(slug)} className="flex items-center gap-2">
            {data.image?.url && (
              <Image
                src={data.image.url}
                width={32}
                height={32}
                className="rounded-full border shrink-0 size-[32px]"
                alt={slug}
              />
            )}
            <p className="text-xl">{data.name}</p>
          </Link>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="flex items-center gap-1.5 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3"
          >
            <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Share the store</span>
            <span className="xs:hidden">Share</span>
          </Button>
        </div>
        <CheckoutButton hideIfEmpty tenantSlug={slug} />
      </div>
    </nav>
  );
};

export const NavbarSkeleton = () => {
  return (
    <nav className="h-20 border-b font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <div />
        <Button disabled className="bg-white">
          <ShoppingCartIcon className="text-black" />
        </Button>
      </div>
    </nav>
  );
};
