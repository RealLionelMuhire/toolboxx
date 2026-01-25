"use client";

import { useState, useMemo, useEffect } from "react";
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
import { COUNTRIES, getCountryByCode } from "@/lib/location-data";
import { getIconByName } from "@/components/admin/icon-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  
  // Sync selected categories with URL state
  useEffect(() => {
    if (filters.categories && filters.categories.length > 0) {
      setSelectedCategoryIds(filters.categories);
    }
  }, []);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(filters.categories || []);
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
      categories: selectedCategoryIds.length > 0 ? selectedCategoryIds : undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      tags: filters.tags || undefined,
      search: filters.search || undefined,
      sort: undefined,
      tenantSlug: undefined,
      locationCountry: filters.locationCountry || undefined,
      locationProvince: filters.locationProvince || undefined,
      locationDistrict: filters.locationDistrict || undefined,
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
      categories: [],
      minPrice: "",
      maxPrice: "",
      tags: [],
      locationCountry: "",
      locationProvince: "",
      locationDistrict: "",
    });
    setSelectedCategoryIds([]);
  };

  const onChange = (key: keyof typeof filters, value: unknown) => {
    console.log("onChange called:", { key, value, currentFilters: filters });
    setFilters({ [key]: value });
  };

  // Debug log for location country changes
  useEffect(() => {
    console.log("filters.locationCountry updated:", filters.locationCountry, "truthy:", !!filters.locationCountry);
    if (filters.locationCountry) {
      const country = getCountryByCode(filters.locationCountry);
      console.log("Location Country Changed:", {
        code: filters.locationCountry,
        country: country?.name,
        hasProvinces: !!country?.provinces,
        provinceCount: country?.provinces?.length || 0,
      });
    }
  }, [filters.locationCountry]);

  // Process categories into parent-child structure
  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    
    const parentCategories: Array<{ 
      id: string; 
      name: string;
      slug: string;
      icon?: string;
      subcategories: Array<{ id: string; name: string; slug: string; icon?: string }> 
    }> = [];
    const seenParentIds = new Set<string>();
    
    categories.forEach((cat: any) => {
      if (!cat.parent && !seenParentIds.has(cat.id)) {
        const subcats = categories
          .filter(c => {
            const parentId = typeof c.parent === 'string' ? c.parent : c.parent?.id;
            return parentId === cat.id;
          })
          .map((sub: any) => ({
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            icon: sub.icon
          }));
        
        parentCategories.push({ 
          id: cat.id, 
          name: cat.name,
          slug: cat.slug,
          icon: cat.icon,
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
    let newSelectedIds: string[];
    
    if (isParent && subcategoryIds && subcategoryIds.length > 0) {
      // Parent category clicked - toggle parent and all subcategories
      const allIds = [categoryId, ...subcategoryIds];
      const allSelected = allIds.every(id => selectedCategoryIds.includes(id));
      
      if (allSelected) {
        // Deselect parent and all subcategories
        newSelectedIds = selectedCategoryIds.filter(id => !allIds.includes(id));
      } else {
        // Select parent and all subcategories
        newSelectedIds = [...new Set([...selectedCategoryIds, ...allIds])];
      }
    } else {
      // Single category/subcategory toggle
      newSelectedIds = selectedCategoryIds.includes(categoryId)
        ? selectedCategoryIds.filter(id => id !== categoryId)
        : [...selectedCategoryIds, categoryId];
    }
    
    setSelectedCategoryIds(newSelectedIds);
    setFilters({ categories: newSelectedIds });
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
    // Stay on homepage and apply filters with selected categories
    // The filters are already set in the URL via nuqs
    // Just close the sidebar - the product list will update automatically
    onOpenChange(false);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      // Don't clear selections on close - keep them in URL state
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
          {/* Filters Section */}
          <div className="border rounded-md bg-white m-4">
            {/* Categories Filter */}
            <ProductFilter title="Categories">
              {categoryOptions.length === 0 ? (
                <div className="text-sm text-gray-500 text-center py-4">
                  Loading categories...
                </div>
              ) : (
                <div className="space-y-1 max-h-96 overflow-y-auto">
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
                            className="cursor-pointer text-sm font-medium flex-1 flex items-center gap-2"
                          >
                            {parent.icon && (() => {
                              const Icon = getIconByName(parent.icon);
                              return Icon ? <Icon className="h-4 w-4" /> : null;
                            })()}
                            <span>{parent.name}</span>
                            <span className="text-xs text-gray-500">
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
                                    className="cursor-pointer text-sm font-normal text-gray-700 flex-1 flex items-center gap-2"
                                  >
                                    {sub.icon && (() => {
                                      const Icon = getIconByName(sub.icon);
                                      return Icon ? <Icon className="h-4 w-4 opacity-70" /> : null;
                                    })()}
                                    <span>{sub.name}</span>
                                    <span className="text-xs text-gray-500">
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
            </ProductFilter>
            
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
            
            <ProductFilter title="Location">
              <div className="space-y-3">
                {/* Country Filter */}
                <div className="space-y-2">
                  <Label className="text-sm">Country</Label>
                  <Select
                    value={filters.locationCountry || undefined}
                    onValueChange={(value) => {
                      setFilters({
                        locationCountry: value || "",
                        locationProvince: "",
                        locationDistrict: "",
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Province Filter */}
                {filters.locationCountry && filters.locationCountry.trim() !== "" && (
                  <div className="space-y-2">
                    <Label className="text-sm">
                      Province/Region
                    </Label>
                    <Select
                      value={filters.locationProvince || undefined}
                      onValueChange={(value) => {
                        setFilters({
                          locationProvince: value || "",
                          locationDistrict: "",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All regions" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCountryByCode(filters.locationCountry)?.provinces?.map((province) => (
                          <SelectItem key={province.code} value={province.code}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* District Filter */}
                {filters.locationCountry && filters.locationCountry.trim() !== "" && 
                 filters.locationProvince && filters.locationProvince.trim() !== "" && (
                  <div className="space-y-2">
                    <Label className="text-sm">District</Label>
                    <Select
                      value={filters.locationDistrict || undefined}
                      onValueChange={(value) => setFilters({ locationDistrict: value || "" })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All districts" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCountryByCode(filters.locationCountry)
                          ?.provinces?.find((p) => p.code === filters.locationProvince)
                          ?.districts?.map((district) => (
                            <SelectItem key={district.code} value={district.code}>
                              {district.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
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




