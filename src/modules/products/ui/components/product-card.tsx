import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon } from "lucide-react";

import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  tenantSlug: string;
  tenantImageUrl?: string | null;
  reviewRating: number;
  reviewCount: number;
  price: number;
};

export const ProductCard = ({
  id,
  name,
  imageUrl,
  tenantSlug,
  tenantImageUrl,
  reviewRating,
  reviewCount,
  price,
}: ProductCardProps) => {
  // Generate URLs consistently for server/client
  const productUrl = `/tenants/${tenantSlug}/products/${id}`;
  const tenantUrl = `/tenants/${tenantSlug}`;

  const handleTenantClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.location.href = tenantUrl;
  };

  return (
    <Link 
      href={productUrl} 
      className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border rounded-md bg-white overflow-hidden h-full flex flex-col cursor-pointer" 
      prefetch={false}
    >
      <div className="relative aspect-square">
        <Image
          alt={name}
          fill
          src={imageUrl || "/placeholder.png"}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          quality={75}
        />
      </div>
      
      <div className="p-4 border-y flex flex-col gap-3 flex-1">
        <h2 className="text-lg font-medium line-clamp-4 hover:text-gray-700">{name}</h2>
        
        <button 
          type="button"
          className="flex items-center gap-2 hover:opacity-80 w-fit cursor-pointer z-10"
          onClick={handleTenantClick}
        >
          {tenantImageUrl && (
            <Image
              alt={tenantSlug}
              src={tenantImageUrl}
              width={16}
              height={16}
              className="rounded-full border shrink-0 size-[16px]"
              loading="lazy"
              quality={75}
            />
          )}
          <p className="text-sm underline font-medium">{tenantSlug}</p>
        </button>
        
        {reviewCount > 0 && (
          <div className="flex items-center gap-1">
            <StarIcon className="size-3.5 fill-black" />
            <p className="text-sm font-medium">
              {reviewRating.toFixed(1)} ({reviewCount})
            </p>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="relative px-2 py-1 border bg-pink-400 w-fit">
          <p className="text-sm font-medium">
            {formatCurrency(price)}
          </p>
        </div>
      </div>
    </Link>
  )
};

export const ProductCardSkeleton = () => {
  return (
    <div className="w-full aspect-3/4 bg-neutral-200 rounded-lg animate-pulse" />
  );
};
