"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { StarIcon, EyeOffIcon, ArchiveIcon, Edit2Icon, Trash2Icon, PackageXIcon, RocketIcon, CheckIcon, XIcon, Edit3Icon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { formatCurrency, generateTenantURL } from "@/lib/utils";
import { COUNTRIES, getCountryByCode, getProvinceByCode } from "@/lib/location-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { ImageCarousel } from "./image-carousel";

interface MyProductCardProps {
  id: string;
  name: string;
  imageUrl?: string | null;
  gallery?: Array<{ url: string; alt: string }> | null;
  tenantSlug: string;
  tenantImageUrl?: string | null;
  reviewRating: number;
  reviewCount: number;
  price: number;
  isPrivate?: boolean;
  isArchived?: boolean;
  stockStatus?: string;
  quantity?: number;
  sponsorshipStatus?: string;
  pendingMomoCode?: string | null;
  viewMode?: "grid" | "list";
  onEdit?: (id: string) => void;
  onDelete?: (id: string, name: string) => void;
}

export const MyProductCard = ({
  id,
  name,
  imageUrl,
  gallery,
  tenantSlug,
  tenantImageUrl,
  reviewRating,
  reviewCount,
  price,
  isPrivate,
  isArchived,
  stockStatus,
  quantity,
  sponsorshipStatus = "none",
  pendingMomoCode = null,
  viewMode = "grid",
  onEdit,
  onDelete,
}: MyProductCardProps) => {
  const isOutOfStock = stockStatus === "out_of_stock";
  const [isAlreadyOnTenantSubdomain, setIsAlreadyOnTenantSubdomain] = useState(false);
  
  const isSubdomainRoutingEnabled = process.env.NEXT_PUBLIC_ENABLE_SUBDOMAIN_ROUTING === "true";
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "";
  const tenantUrl = generateTenantURL(tenantSlug);
  
  // Check if user is already on this tenant's subdomain
  useEffect(() => {
    if (typeof window !== 'undefined' && isSubdomainRoutingEnabled && rootDomain) {
      const currentHostname = window.location.hostname;
      const expectedSubdomain = `${tenantSlug}.${rootDomain.split(':')[0]}`;
      setIsAlreadyOnTenantSubdomain(currentHostname === expectedSubdomain);
    }
  }, [tenantSlug, isSubdomainRoutingEnabled, rootDomain]);
  
  // Generate URL for the product - use short path only if on tenant's subdomain
  const productUrl = isAlreadyOnTenantSubdomain 
    ? `/products/${id}` 
    : isSubdomainRoutingEnabled && rootDomain
    ? `${tenantUrl}/products/${id}`
    : `/tenants/${tenantSlug}/products/${id}`;

  // Prepare images for carousel
  const images = gallery && gallery.length > 0
    ? gallery
    : imageUrl
    ? [{ url: imageUrl, alt: name }]
    : [{ url: "/placeholder.png", alt: name }];

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const requestSponsorship = useMutation(trpc.products.requestSponsorship.mutationOptions({
    onSuccess: () => {
      toast.success("Sponsorship requested successfully!");
      queryClient.invalidateQueries(trpc.products.getMyProducts.infiniteQueryFilter());
    },
    onError: (err) => {
      toast.error(err.message || "Failed to request sponsorship");
    }
  }));

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [editedPrice, setEditedPrice] = useState(price.toString());

  const updatePriceMutation = useMutation(trpc.products.updateProduct.mutationOptions({
    onSuccess: () => {
      toast.success("Price updated successfully!");
      setIsEditingPrice(false);
      queryClient.invalidateQueries(trpc.products.getMyProducts.infiniteQueryFilter());
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update price");
    }
  }));

  const handleSavePrice = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newPrice = parseFloat(editedPrice);
    if (isNaN(newPrice) || newPrice < 0) {
      toast.error("Please enter a valid positive price");
      return;
    }
    updatePriceMutation.mutate({ id, price: newPrice });
  };

  const [isSponsorshipDialogOpen, setIsSponsorshipDialogOpen] = useState(false);
  const [sponsorshipDuration, setSponsorshipDuration] = useState("7");
  const [customDuration, setCustomDuration] = useState("14");

  const [targetLocationType, setTargetLocationType] = useState<"default_product_location" | "custom_location">("default_product_location");
  const [locationCountry, setLocationCountry] = useState("");
  const [locationProvince, setLocationProvince] = useState("");
  const [locationDistrict, setLocationDistrict] = useState("");
  const [locationCityOrArea, setLocationCityOrArea] = useState("");
  const [targetGender, setTargetGender] = useState<"all" | "men" | "women">("all");
  const [targetAgeMin, setTargetAgeMin] = useState("18");
  const [targetAgeMax, setTargetAgeMax] = useState("65");
  const [budgetAmount, setBudgetAmount] = useState("2000");
  const [paymentMessage, setPaymentMessage] = useState("");

  const selectedDays = sponsorshipDuration === "custom" ? (parseInt(customDuration) || 1) : parseInt(sponsorshipDuration);
  const totalAmount = (parseInt(budgetAmount) || 2000) * selectedDays;

  const siteSettings = useQuery({
    ...trpc.products.getSiteSettings.queryOptions(),
    enabled: isSponsorshipDialogOpen,
  });

  const handleRequestSponsorshipSubmit = () => {
    let days = parseInt(sponsorshipDuration);
    if (sponsorshipDuration === "custom") {
      days = parseInt(customDuration);
      if (isNaN(days) || days < 1) {
        toast.error("Please enter a valid number of days");
        return;
      }
    }
    
    if (targetLocationType === "custom_location" && !locationCountry) {
      toast.error("Please select a target country");
      return;
    }

    if (!paymentMessage.trim()) {
      toast.error("Please paste your payment confirmation message");
      return;
    }

    requestSponsorship.mutate({ 
      id, 
      durationDays: days,
      targetLocationType,
      locationCountry: targetLocationType === "custom_location" ? locationCountry : undefined,
      locationProvince: targetLocationType === "custom_location" ? locationProvince : undefined,
      locationDistrict: targetLocationType === "custom_location" ? locationDistrict : undefined,
      locationCityOrArea: targetLocationType === "custom_location" ? locationCityOrArea : undefined,
      targetGender,
      targetAgeMin: parseInt(targetAgeMin) || 18,
      targetAgeMax: parseInt(targetAgeMax) || 65,
      budgetAmount: parseInt(budgetAmount) || 2000,
      paymentMessage,
    });
    setIsSponsorshipDialogOpen(false);
  };

  // Render list view
  if (viewMode === "list") {
    return (
      <div className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border rounded-md bg-white overflow-hidden flex flex-row max-w-full">
        {/* Image on the left - square, 25% wider on mobile */}
        <Link href={productUrl} className="relative w-28 h-28 xs:w-36 xs:h-36 sm:w-40 sm:h-40 md:w-48 md:h-48 group shrink-0" prefetch={false}>
          {images.length > 1 ? (
            <ImageCarousel
              images={images}
              className="w-full h-full"
              sizes="(max-width: 475px) 112px, (max-width: 640px) 144px, (max-width: 768px) 160px, 192px"
              loading="lazy"
              quality={75}
            />
          ) : (
            <Image
              alt={name}
              fill
              src={images[0]?.url || "/placeholder.png"}
              className="object-cover"
              sizes="(max-width: 475px) 112px, (max-width: 640px) 144px, (max-width: 768px) 160px, 192px"
              loading="lazy"
              quality={75}
            />
          )}
          {/* Status badges */}
          <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex flex-col gap-0.5 sm:gap-1 z-10">
            {isOutOfStock && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-red-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                <PackageXIcon className="size-2 sm:size-3" />
                <span className="hidden sm:inline">Out of Stock</span>
              </div>
            )}
            {isPrivate && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-yellow-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                <EyeOffIcon className="size-2 sm:size-3" />
                <span className="hidden sm:inline">Private</span>
              </div>
            )}
            {isArchived && (
              <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-500 text-white px-1 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                <ArchiveIcon className="size-2 sm:size-3" />
                <span className="hidden sm:inline">Archived</span>
              </div>
            )}
          </div>
        </Link>
        
        {/* Middle section - Product details */}
        <div className="flex-1 p-1 xs:p-2 sm:p-3 md:p-4 flex flex-col justify-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 min-w-0">
          <Link href={productUrl} className="hover:text-gray-700" prefetch={false}>
            <h2 className="text-sm xs:text-base sm:text-lg font-medium line-clamp-2">{name}</h2>
          </Link>
          
          <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 min-w-0">
            {tenantImageUrl && (
              <Image
                alt={tenantSlug}
                src={tenantImageUrl}
                width={14}
                height={14}
                className="rounded-full border shrink-0 size-[12px] xs:size-[14px] sm:size-[16px]"
                loading="lazy"
                quality={75}
              />
            )}
            <p className="text-xs sm:text-sm font-medium text-gray-600 truncate">{tenantSlug}</p>
          </div>
          
          {reviewCount > 0 && (
            <div className="flex items-center gap-0.5 sm:gap-1">
              <StarIcon className="size-2.5 xs:size-3 sm:size-3.5 fill-black" />
              <p className="text-xs sm:text-sm font-medium">
                {reviewRating.toFixed(1)} ({reviewCount})
              </p>
            </div>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {isEditingPrice ? (
              <div className="flex items-center gap-1 bg-gray-50 p-1 border rounded" onClick={e => e.stopPropagation()}>
                <Input
                  type="number"
                  min="0"
                  value={editedPrice}
                  onChange={(e) => setEditedPrice(e.target.value)}
                  className="w-20 h-6 text-xs p-1"
                  autoFocus
                />
                <button
                  disabled={updatePriceMutation.isPending}
                  onClick={handleSavePrice}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                >
                  <CheckIcon className="size-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditingPrice(false);
                    setEditedPrice(price.toString());
                  }}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                >
                  <XIcon className="size-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 group/price">
                <div 
                  className="relative px-1 xs:px-1.5 sm:px-2 py-0.5 border bg-orange-400 w-fit cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditingPrice(true);
                  }}
                  title="Click to edit price"
                >
                  <p className="text-xs xs:text-sm font-medium">
                    {formatCurrency(price)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditingPrice(true);
                  }}
                  className="p-1 text-gray-500 hover:text-black opacity-100 md:opacity-0 group-hover/price:opacity-100 transition-opacity"
                  title="Quick edit price"
                >
                  <Edit3Icon className="size-3" />
                </button>
              </div>
            )}
            {quantity !== undefined && (
              <div className={`text-xs xs:text-sm font-medium ${
                quantity === 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {quantity === 0 ? '0 remaining' : `${quantity} available`}
              </div>
            )}
          </div>
        </div>
        
        {/* Right section - Action buttons stacked vertically */}
        <div className="flex flex-col p-1 xs:p-2 sm:p-3 md:p-4 gap-1 sm:gap-2 justify-center border-l">
          {onEdit && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                onEdit(id);
              }}
              variant="outline"
              size="sm"
              className="whitespace-nowrap px-1.5 xs:px-2 sm:px-3 md:px-4 text-xs xs:text-sm"
            >
              <Edit2Icon className="size-3 xs:size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Edit</span>
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
              className="whitespace-nowrap px-1.5 xs:px-2 sm:px-3 md:px-4 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs xs:text-sm"
            >
              <Trash2Icon className="size-3 xs:size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          )}
          {(sponsorshipStatus === "none" || sponsorshipStatus === "rejected") && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSponsorshipDialogOpen(true);
              }}
              disabled={requestSponsorship.isPending}
              variant="outline"
              size="sm"
              className="whitespace-nowrap px-1.5 xs:px-2 sm:px-3 md:px-4 text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs xs:text-sm"
            >
              <RocketIcon className="size-3 xs:size-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Promote</span>
            </Button>
          )}
          {sponsorshipStatus === "pending" && (
            <div className="text-center px-1.5 xs:px-2 py-1 bg-orange-100 text-orange-600 text-xs rounded-md border border-orange-200">
              Pending
            </div>
          )}
          {sponsorshipStatus === "approved" && (
            <div className="text-center px-1.5 xs:px-2 py-1 bg-green-100 text-green-700 text-xs rounded-md border border-green-200">
              Sponsored
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render grid view (default)
  return (
    <div className="hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-shadow border rounded-md bg-white overflow-hidden h-full flex flex-col">
      <Link href={productUrl} className="relative aspect-square group" prefetch={false}>
        {images.length > 1 ? (
          <ImageCarousel
            images={images}
            className="aspect-square"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            quality={75}
          />
        ) : (
          <Image
            alt={name}
            fill
            src={images[0]?.url || "/placeholder.png"}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            loading="lazy"
            quality={75}
          />
        )}
        {/* Status badges */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
          {isOutOfStock && (
            <div className="flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
              <PackageXIcon className="size-3" />
              Out of Stock
            </div>
          )}
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
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          {isEditingPrice ? (
            <div className="flex items-center gap-1 bg-gray-50 p-1 border rounded" onClick={e => e.stopPropagation()}>
              <Input
                type="number"
                min="0"
                value={editedPrice}
                onChange={(e) => setEditedPrice(e.target.value)}
                className="w-20 h-6 text-xs p-1"
                autoFocus
              />
              <button
                disabled={updatePriceMutation.isPending}
                onClick={handleSavePrice}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
              >
                <CheckIcon className="size-4" />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingPrice(false);
                  setEditedPrice(price.toString());
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <XIcon className="size-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/price">
              <div 
                className="relative px-2 py-1 border bg-orange-400 w-fit cursor-pointer"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingPrice(true);
                }}
                title="Click to edit price"
              >
                <p className="text-sm font-medium">
                  {formatCurrency(price)}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsEditingPrice(true);
                }}
                className="p-1 text-gray-500 hover:text-black opacity-100 md:opacity-0 group-hover/price:opacity-100 transition-opacity"
                title="Quick edit price"
              >
                <Edit3Icon className="size-4" />
              </button>
            </div>
          )}
          {quantity !== undefined && (
            <div className={`text-sm font-medium ${
              quantity === 0 ? 'text-red-600' : 'text-gray-600'
            }`}>
              {quantity === 0 ? '0 remaining' : `${quantity} available`}
            </div>
          )}
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
        
        <div className="mt-2 flex">
          {(sponsorshipStatus === "none" || sponsorshipStatus === "rejected") && (
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsSponsorshipDialogOpen(true);
              }}
              disabled={requestSponsorship.isPending}
              variant="outline"
              size="sm"
              className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
            >
              <RocketIcon className="size-3.5 mr-1" />
              Request Sponsorship
            </Button>
          )}
          {sponsorshipStatus === "pending" && (
            <div className="w-full text-center py-1.5 px-2 bg-orange-100 text-orange-600 text-xs sm:text-sm font-medium rounded-md border border-orange-200 flex flex-col gap-1 items-center justify-center">
              <span>Sponsorship Pending Approval</span>
              {pendingMomoCode && (
                <span className="bg-white/60 px-2 py-0.5 rounded text-[11px] font-bold mt-0.5">
                  Momo Payment Code: {pendingMomoCode}
                </span>
              )}
            </div>
          )}
          {sponsorshipStatus === "approved" && (
            <div className="w-full text-center py-1.5 bg-green-100 text-green-700 text-xs sm:text-sm font-medium rounded-md border border-green-200">
              ✨ Sponsored Product
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSponsorshipDialogOpen} onOpenChange={setIsSponsorshipDialogOpen}>
        <DialogContent 
          className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto" 
          onClick={(e) => e.stopPropagation()}
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle>Request Sponsorship</DialogTitle>
            <DialogDescription>
              Choose how long you want to sponsor "{name}".
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Duration</label>
              <Select value={sponsorshipDuration} onValueChange={setSponsorshipDuration}>
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {sponsorshipDuration === "custom" && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Custom Days</label>
                <Input
                  type="number"
                  min="1"
                  max="365"
                  value={customDuration}
                  onChange={(e) => setCustomDuration(e.target.value)}
                  placeholder="Enter number of days"
                />
              </div>
            )}

            <div className="flex flex-col gap-2 mt-2 border-t pt-4">
              <label className="text-sm font-semibold">Target Audience</label>
              
              {/* Location Type */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-xs text-gray-500">Location</label>
                <Select value={targetLocationType} onValueChange={(v: any) => setTargetLocationType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default_product_location">Same as Product Location</SelectItem>
                    <SelectItem value="custom_location">Custom Location</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Location Selectors */}
              {targetLocationType === "custom_location" && (
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Select value={locationCountry} onValueChange={(v) => { setLocationCountry(v); setLocationProvince(""); setLocationDistrict(""); }}>
                    <SelectTrigger><SelectValue placeholder="Country" /></SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(c => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  {locationCountry && (
                    <Select value={locationProvince} onValueChange={(v) => { setLocationProvince(v); setLocationDistrict(""); }}>
                      <SelectTrigger><SelectValue placeholder="Province/Region" /></SelectTrigger>
                      <SelectContent>
                        {getCountryByCode(locationCountry)?.provinces.map(p => <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {locationProvince && (
                    <Select value={locationDistrict} onValueChange={setLocationDistrict}>
                      <SelectTrigger><SelectValue placeholder="District" /></SelectTrigger>
                      <SelectContent>
                        {getProvinceByCode(locationCountry, locationProvince)?.districts.map(d => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}

                  {locationProvince && (
                    <Input placeholder="City or Area" value={locationCityOrArea} onChange={(e) => setLocationCityOrArea(e.target.value)} />
                  )}
                </div>
              )}

              {/* Gender */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs text-gray-500">Gender</label>
                <Select value={targetGender} onValueChange={(v: any) => setTargetGender(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="men">Men</SelectItem>
                    <SelectItem value="women">Women</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Age Range */}
              <div className="flex flex-col gap-1.5 mt-2">
                <label className="text-xs text-gray-500">Age Range</label>
                <div className="flex items-center gap-2">
                  <Input type="number" min="0" value={targetAgeMin} onChange={e => setTargetAgeMin(e.target.value)} placeholder="Min Age" />
                  <span className="text-sm text-gray-500">to</span>
                  <Input type="number" max="120" value={targetAgeMax} onChange={e => setTargetAgeMax(e.target.value)} placeholder="Max Age" />
                </div>
              </div>

              {/* Budget Amount */}
              <div className="flex flex-col gap-1.5 mt-2 border-t pt-3">
                <label className="text-sm font-semibold">Daily Budget</label>
                <p className="text-xs text-gray-500 mb-2">Slide to select how much you are willing to pay per day</p>
                
                <div className="px-2">
                  <Slider 
                    min={2000} 
                    max={25000} 
                    step={500} 
                    value={[parseInt(budgetAmount) || 2000]} 
                    onValueChange={(values) => {
                      if (values[0] !== undefined) {
                        setBudgetAmount(values[0].toString());
                      }
                    }} 
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>2,000 RWF</span>
                    <span className="font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">{formatCurrency(parseInt(budgetAmount) || 2000)} RWF/day</span>
                    <span>25,000 RWF</span>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-3 pt-2 border-t">
                  <span className="text-sm font-bold text-gray-700">Total Amount ({selectedDays} days):</span>
                  <span className="text-lg font-black text-orange-600">{formatCurrency(totalAmount)} RWF</span>
                </div>
              </div>
              
              {/* Payment Instructions & Message */}
              {siteSettings.data?.paymentMomoCode && (
                <div className="mt-3 p-4 bg-orange-50 border border-orange-200 rounded-md space-y-3">
                  <div className="text-sm text-orange-800 font-medium text-center">
                    To pay, dial this code on your phone:
                    <div className="bg-white px-3 py-2 mt-2 rounded border border-orange-200 font-bold text-lg text-center cursor-pointer select-all">
                      *182*8*1*{siteSettings.data.paymentMomoCode}*{totalAmount}#
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-orange-200/50">
                    <label className="text-xs font-semibold text-orange-900">Payment Confirmation Message</label>
                    <p className="text-[10px] text-orange-700">Please paste the SMS confirmation you received from Mobile Money</p>
                    <Textarea 
                      value={paymentMessage}
                      onChange={(e) => setPaymentMessage(e.target.value)}
                      placeholder="Paste your Mobile Money SMS message here..."
                      className="text-xs min-h-[60px] bg-white border-orange-200 focus-visible:ring-orange-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSponsorshipDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRequestSponsorshipSubmit} disabled={requestSponsorship.isPending}>
              {requestSponsorship.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const MyProductCardSkeleton = () => {
  return (
    <div className="w-full aspect-3/4 bg-neutral-200 rounded-lg animate-pulse" />
  );
};
