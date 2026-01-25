import { useEffect, useState } from "react";
import { SlidersHorizontal, SearchIcon, FilterIcon, ArrowUpDown } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { FiltersSidebar } from "./filters-sidebar";
import { SortSheet } from "./sort-sheet";

interface Props {
  disabled?: boolean;
  defaultValue?: string | undefined;
  onChange?: (value: string) => void;
};

export const SearchInput = ({
  disabled,
  defaultValue,
  onChange,
}: Props) => {
  const [searchValue, setSearchValue] = useState(defaultValue || "");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onChange?.(searchValue)
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchValue, onChange]);

  return (
    <>
      <FiltersSidebar open={isFiltersOpen} onOpenChange={setIsFiltersOpen} />
      <SortSheet open={isSortOpen} onOpenChange={setIsSortOpen} />
      <div className="flex items-center gap-2 w-full min-w-0">
        <div className="relative w-full min-w-0 flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            className="pl-8 w-full min-w-0"
            placeholder="Search products"
            disabled={disabled}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
        {/* Sort button - Mobile only, to the LEFT of filter */}
        <Button
          variant="elevated"
          className="size-12 shrink-0 flex lg:hidden"
          onClick={() => setIsSortOpen(true)}
          title="Sort"
        >
          <ArrowUpDown className="size-5" />
        </Button>
        {/* Filter button - Mobile */}
        <Button
          variant="elevated"
          className="size-12 shrink-0 flex lg:hidden"
          onClick={() => setIsFiltersOpen(true)}
          title="Categories & Filters"
        >
          <SlidersHorizontal />
        </Button>
        {/* Sort button - Desktop */}
        <Button
          variant="elevated"
          className="hidden lg:flex shrink-0 whitespace-nowrap"
          onClick={() => setIsSortOpen(true)}
        >
          <ArrowUpDown className="mr-2 size-4" />
          <span>Sort</span>
        </Button>
        {/* Filter button - Desktop */}
        <Button
          variant="elevated"
          className="hidden lg:flex shrink-0 whitespace-nowrap"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <FilterIcon className="mr-2" />
          <span>Filters</span>
        </Button>
      </div>
    </>
  );
};
