"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, ChevronDown, ChevronRight } from "lucide-react";
import dynamic from "next/dynamic";

import { useTRPC } from "@/trpc/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Dynamic import with ssr: false to prevent server-side rendering issues
const ImageUpload = dynamic(() => import("./image-upload").then(mod => ({ default: mod.ImageUpload })), {
  ssr: false,
  loading: () => <div className="h-40 flex items-center justify-center border rounded-md">Loading...</div>
});

interface ProductFormData {
  name: string;
  description?: string;
  price: number;
  quantity: number;
  unit: "unit" | "piece" | "box" | "pack" | "bag" | "kg" | "gram" | "meter" | "cm" | "liter" | "sqm" | "cbm" | "set" | "pair" | "roll" | "sheet" | "carton" | "pallet";
  minOrderQuantity: number;
  maxOrderQuantity?: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  category: string[]; // Changed to array for multiple categories
  image: string;
  cover?: string;
  gallery?: string[];
  refundPolicy: "30-day" | "14-day" | "7-day" | "3-day" | "1-day" | "no-refunds";
  isPrivate: boolean;
}

interface ProductFormDialogProps {
  open: boolean;
  onClose: () => void;
  productId?: string | null;
  mode: "create" | "edit";
}

export const ProductFormDialog = ({
  open,
  onClose,
  productId,
  mode,
}: ProductFormDialogProps) => {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const initialGalleryRef = useRef<string[]>([]);
  const hasSubmittedRef = useRef(false);
  const hasPopulatedRef = useRef(false); // Track if we've populated the form in edit mode
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { register, handleSubmit, setValue, watch, getValues, control, reset, formState: { errors } } = useForm<ProductFormData>({
    defaultValues: {
      category: [], // Changed to empty array for multiple categories
      quantity: 0,
      unit: "unit",
      minOrderQuantity: 1,
      lowStockThreshold: 10,
      allowBackorder: false,
      refundPolicy: "30-day",
      isPrivate: false,
    },
  });

  // Fetch product data if editing
  const { data: productData, isLoading: isLoadingProduct } = useQuery({
    ...trpc.products.getOne.queryOptions({ id: productId || "" }),
    enabled: mode === "edit" && !!productId,
    staleTime: 0, // Always fetch fresh data when editing to ensure images/categories are current
    gcTime: 0, // Don't cache edit data
  });

  // Fetch categories for dropdown
  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery({
    ...trpc.categories.getMany.queryOptions(),
    staleTime: 60 * 1000,
    enabled: open,
  });

  // Populate form when editing - wait for BOTH product data AND categories to load
  useEffect(() => {
    // Prevent multiple resets
    if (mode === "edit" && productData && !isLoadingCategories && categoriesData && !hasPopulatedRef.current) {
      // Handle multiple categories
      const categoryIds = productData.category
        ? Array.isArray(productData.category)
          ? productData.category.map(cat => typeof cat === "string" ? cat : cat.id)
          : [typeof productData.category === "string" ? productData.category : productData.category.id]
        : [];
      
      const imageId = productData.image 
        ? (typeof productData.image === "string" ? productData.image : productData.image.id)
        : undefined;
      
      const coverId = productData.cover 
        ? (typeof productData.cover === "string" ? productData.cover : productData.cover.id)
        : undefined;

      const productDataWithGallery = productData as any;
      const galleryIds = productDataWithGallery.gallery && Array.isArray(productDataWithGallery.gallery)
        ? productDataWithGallery.gallery.map((item: any) => {
            if (typeof item === "string") return item;
            if (item.media) {
              if (typeof item.media === "string") return item.media;
              if (item.media.id) return item.media.id;
            }
            return null;
          }).filter(Boolean)
        : [];
      
      // Extract plain text from Lexical description if it exists
      let descriptionText = "";
      if (productData.description && typeof productData.description === 'object') {
        // Parse Lexical format to extract plain text
        const lexicalData = productData.description as any;
        if (lexicalData.root?.children) {
          descriptionText = lexicalData.root.children
            .map((child: any) => {
              if (child.children) {
                return child.children
                  .map((textNode: any) => textNode.text || "")
                  .join("");
              }
              return "";
            })
            .join("\n");
        }
      } else if (typeof productData.description === 'string') {
        descriptionText = productData.description;
      }
      
      reset({
        name: productData.name || "",
        description: descriptionText,
        price: productData.price || 0,
        quantity: productData.quantity || 0,
        unit: (productData.unit as ProductFormData["unit"]) || "unit",
        minOrderQuantity: productData.minOrderQuantity || 1,
        maxOrderQuantity: productData.maxOrderQuantity || undefined,
        lowStockThreshold: productData.lowStockThreshold || 10,
        allowBackorder: productData.allowBackorder ?? false,
        refundPolicy: (productData.refundPolicy as ProductFormData["refundPolicy"]) || "30-day",
        isPrivate: productData.isPrivate ?? false,
        category: categoryIds,
        image: imageId,
        cover: coverId,
        gallery: galleryIds,
      }, { keepDefaultValues: false });
      
      hasPopulatedRef.current = true;
      initialGalleryRef.current = [...galleryIds];
    } else if (mode === "create") {
      initialGalleryRef.current = [];
      hasPopulatedRef.current = false;
    }
  }, [productData, mode, isLoadingCategories, categoriesData]);
  
  // Reset the hasPopulated flag when dialog opens/closes or mode changes
  useEffect(() => {
    if (!open || mode === "create") {
      hasPopulatedRef.current = false;
    }
  }, [open, mode]);

  // Cleanup orphaned images when dialog closes
  useEffect(() => {
    if (!open && !hasSubmittedRef.current) {
      const currentGallery = watch("gallery") || [];
      const initialGallery = initialGalleryRef.current;
      
      // Find images that were added but not saved (orphaned)
      const orphanedImages = currentGallery.filter(id => !initialGallery.includes(id));
      
      if (orphanedImages.length > 0) {
        orphanedImages.forEach(async (id) => {
          try {
            await fetch(`/api/media?id=${id}&t=${Date.now()}`, { 
              method: 'DELETE',
              cache: 'no-store',
            });
          } catch (error) {
            console.error('Failed to delete orphaned image:', id, error);
          }
        });
      }
      
      // Reset form when dialog closes with clean state
      reset({
        category: [], // Reset category to empty array
        quantity: 0,
        unit: "unit",
        minOrderQuantity: 1,
        lowStockThreshold: 10,
        allowBackorder: false,
        refundPolicy: "30-day",
        isPrivate: false,
        gallery: [], // Clear gallery
      });
    }
    
    // Reset submit flag when dialog opens
    if (open) {
      hasSubmittedRef.current = false;
      
      if (mode === "create") {
        reset({
          category: [],
          quantity: 0,
          unit: "unit",
          minOrderQuantity: 1,
          lowStockThreshold: 10,
          allowBackorder: false,
          refundPolicy: "30-day",
          isPrivate: false,
          gallery: [],
        });
        initialGalleryRef.current = [];
        hasPopulatedRef.current = false;
      }
      // For edit mode, don't reset - let the population useEffect handle it
    }
  }, [open, mode]);

  // Create mutation
  const createMutation = useMutation(trpc.products.createProduct.mutationOptions({
    onSuccess: () => {
      toast.success("Product created successfully!");
      queryClient.invalidateQueries({ queryKey: [["products"]] });
      hasSubmittedRef.current = true; // Mark as submitted to prevent cleanup
      onClose();
      reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create product");
    },
  }));

  // Update mutation
  const updateMutation = useMutation(trpc.products.updateProduct.mutationOptions({
    onSuccess: () => {
      toast.success("Product updated successfully!");
      queryClient.invalidateQueries({ queryKey: [["products"]] });
      hasSubmittedRef.current = true; // Mark as submitted to prevent cleanup
      onClose();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update product");
    },
  }));

  const onSubmit = (data: ProductFormData) => {
    // Automatically set the first gallery image as the main product image
    if (data.gallery && data.gallery.length > 0) {
      data.image = data.gallery[0]!;
      // Optionally set second image as cover
      if (data.gallery.length > 1) {
        data.cover = data.gallery[1];
      }
    } else if (!data.image) {
      toast.error("Please upload at least one product image");
      return;
    }

    // Convert plain text description to Lexical format
    let lexicalDescription = undefined;
    if (data.description && typeof data.description === 'string') {
      lexicalDescription = {
        root: {
          type: "root",
          format: "",
          indent: 0,
          version: 1,
          children: [
            {
              type: "paragraph",
              format: "",
              indent: 0,
              version: 1,
              children: [
                {
                  type: "text",
                  format: 0,
                  text: data.description,
                  mode: "normal",
                  style: "",
                  detail: 0,
                  version: 1,
                },
              ],
              direction: "ltr",
            },
          ],
          direction: "ltr",
        },
      };
    } else if (data.description && typeof data.description === 'object') {
      // If it's already in Lexical format, use it as is
      lexicalDescription = data.description;
    }

    // Sanitize data: handle optional numeric fields and category
    const sanitizedData: any = {
      name: data.name,
      description: lexicalDescription,
      price: data.price,
      quantity: data.quantity,
      unit: data.unit,
      minOrderQuantity: data.minOrderQuantity || 1,
      lowStockThreshold: data.lowStockThreshold || 10,
      allowBackorder: data.allowBackorder || false,
      category: Array.isArray(data.category) 
        ? data.category.map(cat => typeof cat === 'string' ? cat : (cat as any)?.id || cat)
        : [typeof data.category === 'string' ? data.category : (data.category as any)?.id || data.category],
      image: data.image,
      refundPolicy: data.refundPolicy,
      isPrivate: data.isPrivate || false,
    };

    // Only add maxOrderQuantity if it has a valid value
    if (data.maxOrderQuantity && !isNaN(Number(data.maxOrderQuantity)) && Number(data.maxOrderQuantity) > 0) {
      sanitizedData.maxOrderQuantity = Number(data.maxOrderQuantity);
    }

    // Only add cover if present
    if (data.cover) {
      sanitizedData.cover = data.cover;
    }

    // Only add gallery if present
    if (data.gallery && data.gallery.length > 0) {
      sanitizedData.gallery = data.gallery;
    }

    if (mode === "create") {
      createMutation.mutate(sanitizedData);
    } else if (mode === "edit" && productId) {
      updateMutation.mutate({ id: productId, ...sanitizedData });
    }
  };

  const categories = categoriesData || [];
  
  // Extract the current category IDs for edit mode
  const currentCategoryData = useMemo(() => {
    if (mode === "edit" && productData?.category) {
      if (Array.isArray(productData.category)) {
        return productData.category.map(cat => ({
          id: typeof cat === 'string' ? cat : cat.id,
          name: typeof cat === 'string' ? 'Category' : cat.name,
        }));
      } else if (typeof productData.category === 'string') {
        return [{ id: productData.category, name: 'Current Category' }];
      } else {
        return [{ id: productData.category.id, name: productData.category.name }];
      }
    }
    return [];
  }, [mode, productData?.category]);
  
  // Build category options - organize with parent categories and their subcategories
  const categoryOptions = useMemo(() => {
    const parentCategories: Array<{ 
      id: string; 
      name: string; 
      subcategories: Array<{ id: string; name: string }> 
    }> = [];
    const seenParentIds = new Set<string>();

    // If editing, ensure current categories are available
    const currentCatIds = new Set(currentCategoryData.map(c => c.id));

    // Process all categories
    categories.forEach((cat) => {
      if (!seenParentIds.has(cat.id)) {
        const subcats = (cat.subcategories || []).map((sub: any) => ({
          id: sub.id,
          name: sub.name
        }));
        
        parentCategories.push({ 
          id: cat.id, 
          name: cat.name, 
          subcategories: subcats 
        });
        seenParentIds.add(cat.id);
      }
    });

    // Sort: "Others" category last, rest alphabetically
    parentCategories.sort((a, b) => {
      if (a.name.toLowerCase() === 'others') return 1;
      if (b.name.toLowerCase() === 'others') return -1;
      return a.name.localeCompare(b.name);
    });

    return parentCategories;
  }, [categories, currentCategoryData]);

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Product" : "Edit Product"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Add a new product to your store"
              : "Update product information"}
          </DialogDescription>
        </DialogHeader>

        {isLoadingProduct && mode === "edit" ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-gray-600">Loading product...</span>
          </div>
        ) : isLoadingCategories ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-gray-600">Loading categories...</span>
          </div>
        ) : mode === "edit" && (!productData || !categoriesData) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-gray-600">Waiting for data...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* 1. Category */}
            <div>
              <Label htmlFor="category">Categories *</Label>
              <Controller
                name="category"
                control={control}
                rules={{ 
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return "Please select at least one category";
                    }
                    return true;
                  }
                }}
                render={({ field }) => {
                  const selectedCategories = Array.isArray(field.value) ? field.value : [];
                  
                  const toggleCategory = (categoryId: string, isParent: boolean, subcategoryIds?: string[]) => {
                    if (isParent && subcategoryIds && subcategoryIds.length > 0) {
                      // Parent category clicked - toggle parent and all subcategories
                      const allIds = [categoryId, ...subcategoryIds];
                      const allSelected = allIds.every(id => selectedCategories.includes(id));
                      
                      if (allSelected) {
                        // Deselect parent and all subcategories
                        const newSelection = selectedCategories.filter(id => !allIds.includes(id));
                        field.onChange(newSelection);
                      } else {
                        // Select parent and all subcategories
                        const newSelection = [...new Set([...selectedCategories, ...allIds])];
                        field.onChange(newSelection);
                      }
                    } else {
                      // Single category/subcategory toggle
                      const newSelection = selectedCategories.includes(categoryId)
                        ? selectedCategories.filter(id => id !== categoryId)
                        : [...selectedCategories, categoryId];
                      field.onChange(newSelection);
                    }
                  };
                  
                  const toggleExpanded = (categoryId: string) => {
                    const newExpanded = new Set(expandedCategories);
                    if (newExpanded.has(categoryId)) {
                      newExpanded.delete(categoryId);
                    } else {
                      newExpanded.add(categoryId);
                    }
                    setExpandedCategories(newExpanded);
                  };

                  // Calculate dynamic height based on selections and screen size
                  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
                  const baseHeight = isMobile ? 80 : 200; // 2.5x smaller on mobile (200 / 2.5 = 80)
                  const selectedHeight = Math.min(selectedCategories.length * (isMobile ? 11 : 28), isMobile ? 48 : 120);
                  const maxHeight = baseHeight + selectedHeight;
                  
                  return (
                    <div 
                      className="border rounded-md p-3 overflow-y-auto bg-white transition-all duration-200"
                      style={{ maxHeight: `${maxHeight}px` }}
                    >
                      {isLoadingCategories ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          Loading categories...
                        </div>
                      ) : categoryOptions.length === 0 ? (
                        <div className="text-sm text-gray-500 text-center py-4">
                          No categories available. Please contact your administrator.
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {categoryOptions.map((parent) => {
                            const subcatIds = parent.subcategories.map(s => s.id);
                            const isExpanded = expandedCategories.has(parent.id);
                            const isParentSelected = selectedCategories.includes(parent.id);
                            const allSubcatsSelected = subcatIds.length > 0 && subcatIds.every(id => selectedCategories.includes(id));
                            const someSubcatsSelected = subcatIds.length > 0 && subcatIds.some(id => selectedCategories.includes(id)) && !allSubcatsSelected;
                            
                            return (
                              <div key={parent.id} className="space-y-1">
                                {/* Parent Category */}
                                <div className="flex items-center space-x-2 hover:bg-gray-50 rounded px-1 py-1">
                                  {parent.subcategories.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => toggleExpanded(parent.id)}
                                      className="p-0.5 hover:bg-gray-200 rounded"
                                    >
                                      {isExpanded ? (
                                        <ChevronDown className="h-3.5 w-3.5" />
                                      ) : (
                                        <ChevronRight className="h-3.5 w-3.5" />
                                      )}
                                    </button>
                                  )}
                                  {parent.subcategories.length === 0 && (
                                    <div className="w-5" />
                                  )}
                                  <Checkbox
                                    id={`category-${parent.id}`}
                                    checked={isParentSelected || allSubcatsSelected}
                                    className={someSubcatsSelected ? "data-[state=checked]:bg-orange-300" : ""}
                                    onCheckedChange={() => toggleCategory(parent.id, true, subcatIds)}
                                  />
                                  <Label 
                                    htmlFor={`category-${parent.id}`}
                                    className="cursor-pointer text-sm font-medium flex-1"
                                  >
                                    {parent.name}
                                    {parent.subcategories.length > 0 && (
                                      <span className="text-xs text-gray-500 ml-1">
                                        ({parent.subcategories.length})
                                      </span>
                                    )}
                                  </Label>
                                </div>
                                
                                {/* Subcategories (Collapsible) */}
                                {isExpanded && parent.subcategories.length > 0 && (
                                  <div className="ml-8 space-y-1 border-l-2 border-gray-200 pl-3">
                                    {parent.subcategories.map((sub) => (
                                      <div 
                                        key={sub.id}
                                        className="flex items-center space-x-2 hover:bg-gray-50 rounded px-1 py-0.5"
                                      >
                                        <Checkbox
                                          id={`category-${sub.id}`}
                                          checked={selectedCategories.includes(sub.id)}
                                          onCheckedChange={() => toggleCategory(sub.id, false)}
                                        />
                                        <Label 
                                          htmlFor={`category-${sub.id}`}
                                          className="cursor-pointer text-sm font-normal text-gray-700"
                                        >
                                          {sub.name}
                                        </Label>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {selectedCategories.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-gray-600 font-medium mb-2">
                            Selected ({selectedCategories.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {selectedCategories.map(catId => {
                              // Find the category name from parent or subcategory
                              let catName = '';
                              for (const parent of categoryOptions) {
                                if (parent.id === catId) {
                                  catName = parent.name;
                                  break;
                                }
                                const subcat = parent.subcategories.find(s => s.id === catId);
                                if (subcat) {
                                  catName = subcat.name;
                                  break;
                                }
                              }
                              
                              return catName ? (
                                <span
                                  key={catId}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full"
                                >
                                  {catName}
                                  <button
                                    type="button"
                                    onClick={() => toggleCategory(catId, false)}
                                    className="hover:text-orange-900"
                                  >
                                    ×
                                  </button>
                                </span>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              {errors.category && (
                <p className="text-sm text-red-600 mt-1">{errors.category.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Select categories. Clicking a parent category selects all subcategories.
              </p>
            </div>

            {/* 2. Product Photos & Videos */}
            <div>
              <Label>Product Photos & Videos *</Label>
              <ImageUpload
                value={watch("gallery") || []}
                onChange={(value) => setValue("gallery", value)}
                maxImages={24}
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload up to 24 images. First image will be used as the main product image.
              </p>
              {errors.gallery && (
                <p className="text-sm text-red-600 mt-1">{errors.gallery.message as string}</p>
              )}
            </div>

            {/* 3. Product Name */}
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                {...register("name", { required: "Product name is required" })}
                placeholder="Enter product name"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* 4. Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your product"
                rows={4}
              />
            </div>

            {/* 5. Price */}
            <div>
              <Label htmlFor="price">Price (RWF) *</Label>
              <Input
                id="price"
                type="number"
                step="1"
                {...register("price", { 
                  required: "Price is required",
                  valueAsNumber: true,
                  min: { value: 0, message: "Price must be positive" }
                })}
                placeholder="0"
              />
              {errors.price && (
                <p className="text-sm text-red-600 mt-1">{errors.price.message}</p>
              )}
            </div>

            {/* 6. Quantity & Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity Available *</Label>
                <Input
                  id="quantity"
                  type="number"
                  {...register("quantity", { 
                    required: "Quantity is required",
                    valueAsNumber: true,
                    min: { value: 0, message: "Quantity cannot be negative" }
                  })}
                  placeholder="0"
                />
                {errors.quantity && (
                  <p className="text-sm text-red-600 mt-1">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit">Unit of Measurement *</Label>
                <Select
                  value={watch("unit")}
                  onValueChange={(value) => setValue("unit", value as ProductFormData["unit"])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unit">Unit(s)</SelectItem>
                    <SelectItem value="piece">Piece(s)</SelectItem>
                    <SelectItem value="box">Box(es)</SelectItem>
                    <SelectItem value="pack">Pack(s)</SelectItem>
                    <SelectItem value="bag">Bag(s)</SelectItem>
                    <SelectItem value="kg">Kilogram(s)</SelectItem>
                    <SelectItem value="gram">Gram(s)</SelectItem>
                    <SelectItem value="meter">Meter(s)</SelectItem>
                    <SelectItem value="cm">Centimeter(s)</SelectItem>
                    <SelectItem value="liter">Liter(s)</SelectItem>
                    <SelectItem value="sqm">Square Meter(s)</SelectItem>
                    <SelectItem value="cbm">Cubic Meter(s)</SelectItem>
                    <SelectItem value="set">Set(s)</SelectItem>
                    <SelectItem value="pair">Pair(s)</SelectItem>
                    <SelectItem value="roll">Roll(s)</SelectItem>
                    <SelectItem value="sheet">Sheet(s)</SelectItem>
                    <SelectItem value="carton">Carton(s)</SelectItem>
                    <SelectItem value="pallet">Pallet(s)</SelectItem>
                    <SelectItem value="hour">Hour(s)</SelectItem>
                    <SelectItem value="day">Day(s)</SelectItem>
                    <SelectItem value="week">Week(s)</SelectItem>
                    <SelectItem value="month">Month(s)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 7. Min/Max Order Quantities */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="minOrderQuantity">Minimum Order Quantity</Label>
                <Input
                  id="minOrderQuantity"
                  type="number"
                  {...register("minOrderQuantity", { valueAsNumber: true })}
                  placeholder="1"
                  defaultValue={1}
                />
                {errors.minOrderQuantity && (
                  <p className="text-sm text-red-600 mt-1">{errors.minOrderQuantity.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="maxOrderQuantity">Maximum Order Quantity (Optional)</Label>
                <Input
                  id="maxOrderQuantity"
                  type="number"
                  {...register("maxOrderQuantity", { valueAsNumber: true })}
                  placeholder="No limit"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for no limit
                </p>
                {errors.maxOrderQuantity && (
                  <p className="text-sm text-red-600 mt-1">{errors.maxOrderQuantity.message}</p>
                )}
              </div>
            </div>

            {/* 8. Stock Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold</Label>
                <Input
                  id="lowStockThreshold"
                  type="number"
                  {...register("lowStockThreshold", { valueAsNumber: true })}
                  placeholder="10"
                  defaultValue={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Alert when stock falls below this number
                </p>
              </div>

              <div>
                <Label htmlFor="allowBackorder" className="block mb-2">Pre-Order Settings</Label>
                <div className="flex items-center space-x-2 h-10">
                  <Checkbox
                    id="allowBackorder"
                    checked={watch("allowBackorder")}
                    onCheckedChange={(checked) => setValue("allowBackorder", checked as boolean)}
                  />
                  <Label htmlFor="allowBackorder" className="cursor-pointer">
                    Allow pre-orders when out of stock
                  </Label>
                </div>
              </div>
            </div>

            {/* 9. Refund Policy */}
            <div>
              <Label htmlFor="refundPolicy">Refund Policy</Label>
              <Select
                value={watch("refundPolicy")}
                onValueChange={(value) => setValue("refundPolicy", value as ProductFormData["refundPolicy"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30-day">30-day refund</SelectItem>
                  <SelectItem value="14-day">14-day refund</SelectItem>
                  <SelectItem value="7-day">7-day refund</SelectItem>
                  <SelectItem value="3-day">3-day refund</SelectItem>
                  <SelectItem value="1-day">1-day refund</SelectItem>
                  <SelectItem value="no-refunds">No refunds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 10. Privacy Setting */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={watch("isPrivate")}
                onCheckedChange={(checked) => setValue("isPrivate", checked as boolean)}
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                Make this product private (only visible on your store)
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mode === "create" ? "Create Product" : "Update Product"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

