import React from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon, EyeOffIcon, ArchiveIcon, Edit2Icon, Trash2Icon } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface MyProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  tenantSlug: string;
  tenantImageUrl?: string | null;
  reviewRating: number;
  reviewCount: number;
  price: number;
  isPrivate?: boolean;
  isArchived?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export const MyProductCard = ({
  id,
  name,
  imageUrl,
  tenantSlug,
  tenantImageUrl,
  reviewRating,
  reviewCount,
  price,
  isPrivate,
  isArchived,
  onEdit,
  onDelete,
}: MyProductCardProps) => {
  // Generate URLs consistently for server/client
  const productUrl = `/tenants/${tenantSlug}/products/${id}`;

  return (
    <div className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border rounded-md bg-white overflow-hidden h-full flex flex-col">
      <Link href={productUrl} className="relative aspect-square group" prefetch={false}>
        <Image
          alt={name}
          fill
          src={imageUrl || "/placeholder.png"}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          loading="lazy"
          quality={75}
        />
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {isPrivate && (
            <div className="flex items-center gap-1 bg-yellow-500 text-white px-2 py-1 rounded text-xs font-medium">
              <EyeOffIcon className="size-3" />
              Private
            </div>
          )}
          {isArchived && (
            <div className="flex items-center gap-1 bg-gray-500 text-white px-2 py-1 rounded text-xs font-medium">
              <ArchiveIcon className="size-3" />
              Archived
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4 border-y flex flex-col gap-3 flex-1">
        <Link href={productUrl} className="hover:text-gray-700" prefetch={false}>
          <h2 className="text-lg font-medium line-clamp-4">{name}</h2>
        </Link>
        
        <div className="flex items-center gap-2">
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
          <p className="text-sm font-medium text-gray-600">{tenantSlug}</p>
        </div>
        
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
        <div className="flex items-center justify-between mb-3">
          <div className="relative px-2 py-1 border bg-pink-400 w-fit">
            <p className="text-sm font-medium">
              {formatCurrency(price)}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          {onEdit && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                onEdit(id);
              }}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <Edit2Icon className="size-3.5 mr-1" />
              Edit
            </Button>
          )}
          {onDelete && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                onDelete(id, name);
              }}
              variant="outline"
              size="sm"
              className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2Icon className="size-3.5 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export const MyProductCardSkeleton = () => {
  return (
    <div className="w-full aspect-3/4 bg-neutral-200 rounded-lg animate-pulse" />
  );
};
