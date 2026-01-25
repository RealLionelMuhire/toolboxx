import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getIconByName } from "@/components/admin/icon-picker";

import { CategoriesGetManyOutput } from "@/modules/categories/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CategoriesSidebar = ({
  open,
  onOpenChange,
}: Props) => {
  const trpc = useTRPC();
  const { data, error } = useQuery({
    ...trpc.categories.getMany.queryOptions(),
    staleTime: 10 * 60 * 1000, // 10 minutes - categories don't change often
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  const { data: categoryCounts } = useQuery({
    ...trpc.products.getCategoryCounts.queryOptions(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const router = useRouter();

  const [parentCategories, setParentCategories] = useState<CategoriesGetManyOutput | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoriesGetManyOutput[1] | null>(null);

  // Handle loading and error states
  if (error) {
    console.error('Categories loading error:', error);
  }

  // If we have parent categories, show those, otherwise show root categories
  const currentCategories = parentCategories ?? data ?? [];

  // Sort categories: "Others" last, rest alphabetically
  const sortedCategories = [...currentCategories].sort((a, b) => {
    if (a.name.toLowerCase() === 'others') return 1;
    if (b.name.toLowerCase() === 'others') return -1;
    return a.name.localeCompare(b.name);
  });

  // Helper to get count for a category and its subcategories
  const getCategoryCount = (category: CategoriesGetManyOutput[1]): number => {
    if (!categoryCounts) return 0;
    
    let count = categoryCounts[category.id] || 0;
    
    // Add counts from subcategories
    if (category.subcategories && category.subcategories.length > 0) {
      category.subcategories.forEach((subcat: any) => {
        count += categoryCounts[subcat.id] || 0;
      });
    }
    
    return count;
  };

  const handleOpenChange = (open: boolean) => {
    setSelectedCategory(null);
    setParentCategories(null);
    onOpenChange(open);
  };

  const handleCategoryClick = (category: CategoriesGetManyOutput[1]) => {
    if (category.subcategories && category.subcategories.length > 0) {
      setParentCategories(category.subcategories as CategoriesGetManyOutput);
      setSelectedCategory(category);
    } else {
      // This is a leaf category (no subcategories)
      if (parentCategories && selectedCategory) {
        //  This is a subcategory - navigate to /category/subcategory
        router.push(`/${selectedCategory.slug}/${category.slug}`);
      } else {
        // This is a main category - navigat to /category
        if (category.slug === "all") {
          router.push("/");
        } else {
          router.push(`/${category.slug}`);
        }
      }

      handleOpenChange(false);
    }
  }

  const handleBackClick = () => {
    if (parentCategories) {
      setParentCategories(null);
      setSelectedCategory(null);
    }
  }

  const backgroundColor = selectedCategory?.color || "white";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="left"
        className="p-0 transition-none"
        style={{ backgroundColor }}
      >
        <SheetHeader className="p-4 border-b">
          <SheetTitle>
            Categories
          </SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex flex-col overflow-y-auto h-full pb-2">
          {parentCategories && (
            <button
              onClick={handleBackClick}
              className="w-full text-left p-4 hover:bg-black hover:text-white flex items-center text-base font-medium cursor-pointer"
            >
              <ChevronLeftIcon className="size-4 mr-2" />
              Back
            </button>
          )}
          {sortedCategories.map((category) => {
            const count = getCategoryCount(category);
            const Icon = (category as any).icon ? getIconByName((category as any).icon) : null;
            return (
              <button
                key={category.slug}
                onClick={() => handleCategoryClick(category)}
                className="w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center text-base font-medium cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {Icon && <Icon className="h-5 w-5" />}
                  <span>{category.name} ({count})</span>
                </span>
                {category.subcategories && category.subcategories.length > 0 && (
                  <ChevronRightIcon className="size-4" />
                )}
              </button>
            );
          })}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};
