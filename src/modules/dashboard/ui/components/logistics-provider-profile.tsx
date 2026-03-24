"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Truck, AlertCircle, Upload, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export function LogisticsProviderProfile() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    vehicleDescription: "",
    deliveryPricing: "",
    vehicleImage: "",
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Get current user's tenant
  const { data: tenant, isLoading: tenantLoading } = useQuery(
    trpc.tenants.getCurrentTenant.queryOptions()
  );

  // Load form data when tenant data arrives or when editing is toggled
  useEffect(() => {
    if (tenant) {
      setFormData({
        vehicleDescription: tenant.vehicleDescription || "",
        deliveryPricing: tenant.deliveryPricing || "",
        vehicleImage: tenant.vehicleImage ? (typeof tenant.vehicleImage === "string" ? tenant.vehicleImage : tenant.vehicleImage.id) : "",
      });
    }
  }, [tenant]);

  // Update profile mutation
  const updateMutation = useMutation(
    trpc.tenants.updateLogisticsProfile.mutationOptions({
      onSuccess: () => {
        toast.success("Logistics profile updated successfully!");
        setIsEditing(false);
        setSelectedImageFile(null);
        setPreviewUrl(null);
        queryClient.invalidateQueries(trpc.tenants.getCurrentTenant.queryFilter());
      },
      onError: (error) => {
        toast.error(error.message || "Failed to update profile");
      },
    })
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file (JPG, PNG, etc.)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }

      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.vehicleDescription && !formData.deliveryPricing && !selectedImageFile) {
      toast.error("Please fill in at least one field");
      return;
    }

    let vehicleImageId: string | undefined = undefined;

    // If there's a new image file, upload it first
    if (selectedImageFile) {
      try {
        const fileFormData = new FormData();
        fileFormData.append("file", selectedImageFile);
        fileFormData.append("alt", "Vehicle photo");

        const uploadResponse = await fetch("/api/media", {
          method: "POST",
          body: fileFormData,
        });

        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          toast.error(error.error || "Image upload failed");
          return;
        }

        const uploadedData = await uploadResponse.json();
        vehicleImageId = uploadedData.id;
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Image upload failed. Please try again.");
        return;
      }
    }

    updateMutation.mutate({
      vehicleDescription: formData.vehicleDescription || undefined,
      deliveryPricing: formData.deliveryPricing || undefined,
      vehicleImageId,
    });
  };

  if (tenantLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!tenant || tenant.category !== "logistics") {
    return null;
  }

  const vehicleImageUrl = tenant.vehicleImage 
    ? typeof tenant.vehicleImage === "string" 
      ? tenant.vehicleImage 
      : tenant.vehicleImage.url
    : null;

  return (
    <Card className="border-blue-200 border-2">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5 text-blue-600" />
          Logistics Provider Profile
        </CardTitle>
        <CardDescription>
          Manage your vehicle information and delivery pricing
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {!isEditing ? (
          <>
            {/* Vehicle Image Display */}
            {vehicleImageUrl && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Vehicle Photo</Label>
                <div className="relative w-full h-64 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={vehicleImageUrl}
                    alt="Vehicle photo"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Vehicle Description Display */}
            {tenant.vehicleDescription && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Vehicle Description</Label>
                <div className="p-3 bg-gray-50 rounded-md border">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {tenant.vehicleDescription}
                  </p>
                </div>
              </div>
            )}

            {/* Delivery Pricing Display */}
            {tenant.deliveryPricing && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Delivery Pricing</Label>
                <div className="p-3 bg-green-50 rounded-md border border-green-200">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {tenant.deliveryPricing}
                  </p>
                </div>
              </div>
            )}

            {!vehicleImageUrl && !tenant.vehicleDescription && !tenant.deliveryPricing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No logistics profile information added yet. Click "Edit Profile" to add vehicle details and pricing.
                </AlertDescription>
              </Alert>
            )}

            <Button onClick={() => setIsEditing(true)} className="w-full">
              Edit Logistics Profile
            </Button>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Vehicle Image Upload */}
            <div className="space-y-2">
              <Label htmlFor="vehicleImage" className="text-sm font-semibold">
                Vehicle Photo
              </Label>
              {previewUrl || vehicleImageUrl ? (
                <div className="space-y-2">
                  <div className="relative w-full h-48 bg-muted rounded-lg overflow-hidden">
                    <Image
                      src={previewUrl || vehicleImageUrl!}
                      alt="Vehicle preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImageFile(null);
                      setPreviewUrl(null);
                    }}
                    className="w-full"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition">
                  <input
                    type="file"
                    id="vehicleImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <label htmlFor="vehicleImage" className="flex flex-col items-center gap-2 cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm font-medium">Click to upload vehicle photo</span>
                    <span className="text-xs text-muted-foreground">PNG, JPG up to 10MB</span>
                  </label>
                </div>
              )}
            </div>

            {/* Vehicle Description */}
            <div className="space-y-2">
              <Label htmlFor="vehicleDescription" className="text-sm font-semibold">
                Vehicle Description
              </Label>
              <Textarea
                id="vehicleDescription"
                placeholder="e.g., Toyota Hiace, 2.5 ton capacity, excellent condition, air conditioning, covered cargo area..."
                value={formData.vehicleDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, vehicleDescription: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Describe your vehicle type, capacity, condition, and special features
              </p>
            </div>

            {/* Delivery Pricing */}
            <div className="space-y-2">
              <Label htmlFor="deliveryPricing" className="text-sm font-semibold">
                Delivery Pricing Structure
              </Label>
              <Textarea
                id="deliveryPricing"
                placeholder="e.g., Base fee: 5000 RWF&#10;Per km: 100 RWF&#10;Minimum distance: 5km&#10;Large items (>5m³): +2000 RWF"
                value={formData.deliveryPricing}
                onChange={(e) => setFormData(prev => ({ ...prev, deliveryPricing: e.target.value }))}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Explain your pricing structure clearly for customers
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedImageFile(null);
                  setPreviewUrl(null);
                }}
                disabled={updateMutation.isPending}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
