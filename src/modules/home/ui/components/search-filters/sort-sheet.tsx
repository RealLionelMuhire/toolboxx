"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";

import { useProductFilters } from "@/modules/products/hooks/use-product-filters";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export const SortSheet = ({ open, onOpenChange }: Props) => {
    const [filters, setFilters] = useProductFilters();

    const sortOptions = [
        { value: "curated" as const, label: "Curated (Default)" },
        { value: "price_low_to_high" as const, label: "Price: Low to High" },
        { value: "price_high_to_low" as const, label: "Price: High to Low" },
        { value: "newest" as const, label: "Newest Arrivals" },
        { value: "oldest" as const, label: "Oldest First" },
        { value: "trending" as const, label: "Trending" },
        { value: "hot_and_new" as const, label: "Hot & New" },
    ];

    const handleSortChange = (value: typeof sortOptions[number]["value"]) => {
        setFilters({ sort: value });
        onOpenChange(false); // Close sheet after selection
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="left" className="w-full sm:w-[400px]">
                <SheetHeader className="pb-4 border-b">
                    <SheetTitle>Sort By</SheetTitle>
                </SheetHeader>
                <div className="py-4 space-y-3">
                    {sortOptions.map((sortOption) => (
                        <div
                            key={sortOption.value}
                            className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                            onClick={() => handleSortChange(sortOption.value)}
                        >
                            <Checkbox
                                id={`sort-sheet-${sortOption.value}`}
                                checked={filters.sort === sortOption.value}
                                onCheckedChange={(checked) => {
                                    if (checked) {
                                        handleSortChange(sortOption.value);
                                    }
                                }}
                            />
                            <Label
                                htmlFor={`sort-sheet-${sortOption.value}`}
                                className="text-base font-normal cursor-pointer flex-1"
                            >
                                {sortOption.label}
                            </Label>
                        </div>
                    ))}
                </div>
            </SheetContent>
        </Sheet>
    );
};
