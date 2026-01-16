"use client";

import { useState, useMemo } from "react";
import { ChevronDownIcon, ChevronRightIcon, ChevronLeftIcon } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import { useTRPC } from "@/trpc/client";
import { useProductFilters } from "@/modules/products/hooks/use-product-filters";
import { TagsFilter } from "@/modules/products/ui/components/tags-filter";
import { PriceFilter } from "@/modules/products/ui/components/price-filter";
import { CategoriesGetManyOutput } from "@/modules/categories/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductFilterProps {
  title: string;
  className?: string;
  children: React.ReactNode;
}

const ProductFilter = ({ title, className, children }: ProductFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const Icon = isOpen ? ChevronDownIcon : ChevronRightIcon;

  return (
    <div className={cn(
      "p-3 md:p-4 border-b flex flex-col gap-2",
      className
    )}>
      <div
        onClick={() => setIsOpen((current) => !current)}
        className="flex items-center justify-between cursor-pointer"
      >
        <p className="font-medium">{title}</p>
        <Icon className="size-5" />
      </div>
      {isOpen && children}
    </div>
  );
};

export const FiltersSidebar = ({
  open,
  onOpenChange,
}: Props) => {
  const trpc = useTRPC();
  const router = useRouter();
  const params = useParams();
  
  const [filters, setFilters] = useProductFilters();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Fetch categories and counts
  const { data: categories } = useQuery({
    ...trpc.categories.getMany.queryOptions(),
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: categoryCounts } = useQuery({
    ...trpc.products.getCategoryCounts.queryOptions(),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  // Count products matching current filters
  const { data: productsCount } = useQuery({
    ...trpc.products.getMany.queryOptions({
      cursor: 1,
      limit: 1,
      category: selectedCategoryIds.length > 0 ? selectedCategoryIds[0] : null,
      minPrice: filters.minPrice || null,
      maxPrice: filters.maxPrice || null,
      tags: filters.tags || null,
      search: filters.search || null,
      sort: null,
      tenantSlug: null,
    }),
    staleTime: 0, // Always fresh for accurate count
  });

  const totalMatchingProducts = productsCount?.totalDocs || 0;

  const categoryParam = params.category as string | undefined;
  const activeCategory = categoryParam || "all";

  const hasAnyFilters = Object.entries(filters).some(([key, value]) => {
    if (key === "sort") return false;

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === "string") {
      return value !== "";
    }

    return value !== null;
  });

  const onClear = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      tags: [],
    });
  };

  const onChange = (key: keyof typeof filters, value: unknown) => {
    setFilters({ ...filters, [key]: value });
  };

  // Process categories into parent-child structure
  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    
    const parentCategories: Array<{ 
      id: string; 
      name: string;
      slug: string;
      subcategories: Array<{ id: string; name: string; slug: string }> 
    }> = [];
    const seenParentIds = new Set<string>();
    
    categories.forEach((cat) => {
      if (!cat.parent && !seenParentIds.has(cat.id)) {
        const subcats = categories
          .filter(c => {
            const parentId = typeof c.parent === 'string' ? c.parent : c.parent?.id;
            return parentId === cat.id;
          })
          .map(sub => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug
          }));
        
        parentCategories.push({ 
          id: cat.id, 
          name: cat.name,
          slug: cat.slug,
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
  }, [categories]);

  const getCategoryCount = (categoryId: string): number => {
    return categoryCounts?.[categoryId] || 0;
  };

  const toggleCategory = (categoryId: string, isParent: boolean, subcategoryIds?: string[]) => {
    if (isParent && subcategoryIds && subcategoryIds.length > 0) {
      // Parent category clicked - toggle parent and all subcategories
      const allIds = [categoryId, ...subcategoryIds];
      const allSelected = allIds.every(id => selectedCategoryIds.includes(id));
      
      if (allSelected) {
        // Deselect parent and all subcategories
        setSelectedCategoryIds(selectedCategoryIds.filter(id => !allIds.includes(id)));
      } else {
        // Select parent and all subcategories
        setSelectedCategoryIds([...new Set([...selectedCategoryIds, ...allIds])]);
      }
    } else {
      // Single category/subcategory toggle
      setSelectedCategoryIds(
        selectedCategoryIds.includes(categoryId)
          ? selectedCategoryIds.filter(id => id !== categoryId)
          : [...selectedCategoryIds, categoryId]
      );
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

  const handleApplyFilters = () => {
    // Navigate to the selected category if any
    if (selectedCategoryIds.length > 0) {
      // Find the first selected category in categoryOptions
      const firstSelected = categoryOptions.find(cat => 
        selectedCategoryIds.includes(cat.id) || 
        cat.subcategories.some(sub => selectedCategoryIds.includes(sub.id))
      );
      
      if (firstSelected) {
        const selectedSubcategory = firstSelected.subcategories.find(sub => 
          selectedCategoryIds.includes(sub.id)
        );
        
        if (selectedSubcategory) {
          router.push(`/${firstSelected.slug}/${selectedSubcategory.slug}`);
        } else {
          router.push(`/${firstSelected.slug}`);
        }
      }
    }
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedCategoryIds([]);
      setExpandedCategories(new Set());
    }
    onOpenChange(open);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="p-0 transition-none w-full sm:w-[400px]"
      >
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            {hasAnyFilters && (
              <button 
                className="underline cursor-pointer text-sm" 
                onClick={() => onClear()} 
                type="button"
              >
                Clear
              </button>
            )}
          </div>
        </SheetHeader>
        <ScrollArea className="flex flex-col overflow-y-auto h-[calc(100vh-180px)]">
          {/* Categories Section */}
          <div className="border-b bg-white">
            <div className="p-3 md:p-4 border-b bg-gray-50">
              <p className="font-semibold text-base">Categories</p>
            </div>
            <div className="p-3 md:p-4">
              {categoryOptions.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading categories...
                </div>
              ) : (
                <div className="space-y-1">
                  {categoryOptions.map((parent) => {
                    const subcatIds = parent.subcategories.map(s => s.id);
                    const isExpanded = expandedCategories.has(parent.id);
                    const isParentSelected = selectedCategoryIds.includes(parent.id);
                    const allSubcatsSelected = subcatIds.length > 0 && subcatIds.every(id => selectedCategoryIds.includes(id));
                    const someSubcatsSelected = subcatIds.length > 0 && subcatIds.some(id => selectedCategoryIds.includes(id)) && !allSubcatsSelected;
                    const parentCount = getCategoryCount(parent.id);
                    
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
                                <ChevronDownIcon className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronRightIcon className="h-3.5 w-3.5" />
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
                            <span className="text-xs text-gray-500 ml-1">
                              ({parentCount})
                            </span>
                          </Label>
                        </div>
                        
                        {/* Subcategories (Collapsible) */}
                        {isExpanded && parent.subcategories.length > 0 && (
                          <div className="ml-8 space-y-1 border-l-2 border-gray-200 pl-3">
                            {parent.subcategories.map((sub) => {
                              const subCount = getCategoryCount(sub.id);
                              return (
                                <div 
                                  key={sub.id}
                                  className="flex items-center space-x-2 hover:bg-gray-50 rounded px-1 py-0.5"
                                >
                                  <Checkbox
                                    id={`category-${sub.id}`}
                                    checked={selectedCategoryIds.includes(sub.id)}
                                    onCheckedChange={() => toggleCategory(sub.id, false)}
                                  />
                                  <Label 
                                    htmlFor={`category-${sub.id}`}
                                    className="cursor-pointer text-sm font-normal text-gray-700 flex-1"
                                  >
                                    {sub.name}
                                    <span className="text-xs text-gray-500 ml-1">
                                      ({subCount})
                                    </span>
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Filters Section */}
          <div className="border rounded-md bg-white m-4">
            <ProductFilter title="Sort By">
              <div className="space-y-2">
                {[
                  { value: "curated", label: "Curated (Default)" },
                  { value: "price_low_to_high", label: "Price: Low to High" },
                  { value: "price_high_to_low", label: "Price: High to Low" },
                  { value: "newest", label: "Newest Arrivals" },
                  { value: "oldest", label: "Oldest First" },
                  { value: "trending", label: "Trending" },
                  { value: "hot_and_new", label: "Hot & New" },
                ].map((sortOption) => (
                  <div key={sortOption.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`sort-${sortOption.value}`}
                      checked={filters.sort === sortOption.value}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onChange("sort", sortOption.value);
                        }
                      }}
                    />
                    <Label htmlFor={`sort-${sortOption.value}`} className="text-sm font-normal cursor-pointer">
                      {sortOption.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ProductFilter>
            
            <ProductFilter title="Price">
              <PriceFilter
                minPrice={filters.minPrice}
                maxPrice={filters.maxPrice}
                onMinPriceChange={(value) => onChange("minPrice", value)}
                onMaxPriceChange={(value) => onChange("maxPrice", value)}
              />
            </ProductFilter>
            
            <ProductFilter title="Availability">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={filters.tags?.includes("in-stock") || false}
                    onCheckedChange={(checked) => {
                      const currentTags = filters.tags || [];
                      if (checked) {
                        onChange("tags", [...currentTags, "in-stock"]);
                      } else {
                        onChange("tags", currentTags.filter(t => t !== "in-stock"));
                      }
                    }}
                  />
                  <Label htmlFor="in-stock" className="text-sm font-normal cursor-pointer">
                    In Stock
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pre-order"
                    checked={filters.tags?.includes("pre-order") || false}
                    onCheckedChange={(checked) => {
                      const currentTags = filters.tags || [];
                      if (checked) {
                        onChange("tags", [...currentTags, "pre-order"]);
                      } else {
                        onChange("tags", currentTags.filter(t => t !== "pre-order"));
                      }
                    }}
                  />
                  <Label htmlFor="pre-order" className="text-sm font-normal cursor-pointer">
                    Pre-Order Available
                  </Label>
                </div>
              </div>
            </ProductFilter>
            
            <ProductFilter title="Unit Type">
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {[
                  { value: "unit", label: "Unit(s)" },
                  { value: "piece", label: "Piece(s)" },
                  { value: "box", label: "Box(es)" },
                  { value: "pack", label: "Pack(s)" },
                  { value: "bag", label: "Bag(s)" },
                  { value: "kg", label: "Kilogram(s)" },
                  { value: "gram", label: "Gram(s)" },
                  { value: "meter", label: "Meter(s)" },
                  { value: "cm", label: "Centimeter(s)" },
                  { value: "liter", label: "Liter(s)" },
                  { value: "sqm", label: "Square Meter(s)" },
                  { value: "cbm", label: "Cubic Meter(s)" },
                  { value: "set", label: "Set(s)" },
                  { value: "pair", label: "Pair(s)" },
                  { value: "roll", label: "Roll(s)" },
                  { value: "sheet", label: "Sheet(s)" },
                  { value: "carton", label: "Carton(s)" },
                  { value: "pallet", label: "Pallet(s)" },
                  { value: "hour", label: "Hour(s) - Rental" },
                  { value: "day", label: "Day(s) - Rental" },
                  { value: "week", label: "Week(s) - Rental" },
                  { value: "month", label: "Month(s) - Rental" },
                ].map((unit) => (
                  <div key={unit.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`unit-${unit.value}`}
                      checked={filters.tags?.includes(`unit-${unit.value}`) || false}
                      onCheckedChange={(checked) => {
                        const currentTags = filters.tags || [];
                        if (checked) {
                          onChange("tags", [...currentTags, `unit-${unit.value}`]);
                        } else {
                          onChange("tags", currentTags.filter(t => t !== `unit-${unit.value}`));
                        }
                      }}
                    />
                    <Label htmlFor={`unit-${unit.value}`} className="text-sm font-normal cursor-pointer">
                      {unit.label}
                    </Label>
                  </div>
                ))}
              </div>
            </ProductFilter>
            
            <ProductFilter title="Tags" className="border-b-0">
              <TagsFilter
                value={filters.tags}
                onChange={(value) => onChange("tags", value)}
              />
            </ProductFilter>
          </div>
        </ScrollArea>
        
        {/* Fixed Bottom Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg">
          <Button
            onClick={handleApplyFilters}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-6 text-base"
          >
            Show ({totalMatchingProducts})
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};




