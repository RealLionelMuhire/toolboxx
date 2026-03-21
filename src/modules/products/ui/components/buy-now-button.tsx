"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useTRPC } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { BuyNowDialog, CheckoutData } from "./buy-now-dialog";

interface BuyNowButtonProps {
  tenantSlug: string;
  productId: string;
  productName: string;
  productPrice: number;
  isPurchased?: boolean;
  quantity?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  unit?: string;
  stockStatus?: "in_stock" | "low_stock" | "out_of_stock" | "pre_order";
  allowBackorder?: boolean;
}

export const BuyNowButton = ({
  tenantSlug,
  productId,
  productName,
  productPrice,
  isPurchased,
  quantity = 0,
  minOrderQuantity = 1,
  maxOrderQuantity,
  unit = "unit",
  stockStatus = "in_stock",
  allowBackorder = false,
}: BuyNowButtonProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const trpc = useTRPC();
  const [dialogOpen, setDialogOpen] = useState(false);

  // Check if user is authenticated
  const { data: session } = useQuery(trpc.auth.session.queryOptions());

  // Determine if product is available for purchase
  const isOutOfStock = stockStatus === "out_of_stock" && !allowBackorder;
  const canPurchase = quantity > 0 || allowBackorder;

  // Calculate max quantity that can be added
  const maxAllowedQuantity = maxOrderQuantity
    ? Math.min(maxOrderQuantity, quantity)
    : quantity;

  const buyNowMutation = useMutation(
    trpc.checkout.initiatePayment.mutationOptions({
      onSuccess: (data) => {
        setDialogOpen(false);
        
        // Verify transactionId exists
        if (!data?.transactionId) {
          console.error("[BuyNowButton] Missing transactionId in response:", data);
          toast.error("Payment initialization failed. Please try again.");
          return;
        }
        
        // Log successful payment initiation (for debugging)
        console.log("[BuyNowButton] Payment initiated with transactionId:", data.transactionId);
        
        // Redirect to payment instructions page
        const paymentUrl = `/payment/instructions?transactionId=${data.transactionId}`;
        console.log("[BuyNowButton] Redirecting to:", paymentUrl);
        
        try {
          router.push(paymentUrl);
        } catch (error) {
          console.error("[BuyNowButton] Router push failed, using window.location as fallback:", error);
          // Fallback: use window.location if router.push fails
          window.location.href = paymentUrl;
        }

        // Additional fallback: ensure navigation happens even if router is delayed
        setTimeout(() => {
          console.log("[BuyNowButton] Verifying navigation to payment page...");
          if (window.location.href.includes('/payment/instructions')) {
            console.log("[BuyNowButton] Navigation successful");
          } else {
            console.warn("[BuyNowButton] Navigation may have failed, attempting window.location fallback");
            window.location.href = paymentUrl;
          }
        }, 500);
      },
      onError: (error) => {
        console.error("[BuyNowButton] Mutation error:", error);
        
        if (error.data?.code === "UNAUTHORIZED") {
          // Redirect to login page with return URL immediately (no toast to avoid flash)
          setDialogOpen(false);
          const loginUrl = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
          // Prefetch for instant navigation
          router.prefetch(loginUrl);
          router.push(loginUrl);
          // Don't show toast - redirect happens immediately
        } else {
          const errorMessage = error.message || "Payment initialization failed. Please try again.";
          console.error("[BuyNowButton] Error message:", errorMessage);
          toast.error(errorMessage);
        }
      },
    })
  );

  const handleBuyNow = () => {
    // Check authentication before opening dialog
    if (!session?.user) {
      // Redirect to login with current product page as return URL
      console.warn("[BuyNowButton] User not authenticated. Redirecting to login.");
      const loginUrl = `/sign-in?redirect=${encodeURIComponent(pathname)}`;
      router.prefetch(loginUrl);
      router.push(loginUrl);
      return;
    }
    
    console.log("[BuyNowButton] User authenticated:", session.user.email);
    
    // User is authenticated, open the checkout dialog
    setDialogOpen(true);
  };

  const handleCheckoutSubmit = (data: CheckoutData) => {
    // Initiate payment with the quantity from the form
    buyNowMutation.mutate({
      tenantSlug,
      items: [
        {
          productId,
          quantity: data.quantity,
        },
      ],
      customerName: data.name,
      customerPhone: data.phone,
      customerEmail: data.email,
      deliveryType: data.deliveryType,
      shippingAddress: data.deliveryType === 'delivery' ? {
        line1: data.addressLine1,
        city: data.city,
        country: data.country,
      } : undefined,
    });
  };

  if (isOutOfStock) {
    return null; // Don't show Buy Now for out of stock items
  }

  return (
    <>
      <Button
        variant="elevated"
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        onClick={handleBuyNow}
        disabled={!canPurchase}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Buy Now
      </Button>

      <BuyNowDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleCheckoutSubmit}
        isLoading={buyNowMutation.isPending}
        productName={productName}
        productPrice={productPrice}
        minOrderQuantity={minOrderQuantity}
        maxOrderQuantity={maxAllowedQuantity}
        unit={unit}
      />
    </>
  );
};
