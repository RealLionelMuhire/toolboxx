"use client";

import Link from "next/link";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useState } from "react";
import { ShoppingCartIcon, Share2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { generateTenantURL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShareStoreDialog } from "./share-store-dialog";

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
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleShare = async () => {
    const storeUrl = generateTenantURL(slug);
    
    // Check if we're on mobile/tablet - use native share
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Try using Web Share API on mobile
    if (isMobile && navigator.share) {
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
          // Fallback to dialog on error
          setShareDialogOpen(true);
        }
      }
    } else {
      // On desktop, show custom share dialog
      setShareDialogOpen(true);
    }
  };

  return (
    <>
      <ShareStoreDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        storeName={data.name}
        storeUrl={generateTenantURL(slug)}
      />
      
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
    </>
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
