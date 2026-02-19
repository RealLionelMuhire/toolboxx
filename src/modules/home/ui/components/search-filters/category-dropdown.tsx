"use client";

import Link from "next/link";
import { useRef, useState, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

import { CategoriesGetManyOutput } from "@/modules/categories/types";

import { SubcategoryMenu } from "./subcategory-menu";

interface Props {
  category: CategoriesGetManyOutput[1];
  isActive?: boolean;
  isNavigationHovered?: boolean;
};

export const CategoryDropdown = ({
  category,
  isActive,
  isNavigationHovered
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Track hover over the button area and the menu separately using a timer
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const subcategories = Array.isArray(category.subcategories)
    ? category.subcategories
    : (category.subcategories as any)?.docs ?? [];

  const openMenu = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (subcategories.length > 0) {
      setIsOpen(true);
    }
  }, [subcategories.length]);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 100); // Small delay to allow pointer to travel to the menu
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={openMenu}
      onMouseLeave={scheduleClose}
    >
      <div className="relative">
        <Button
          variant="elevated"
          className={cn(
            "h-11 px-4 bg-transparent border-transparent rounded-full hover:bg-white hover:border-primary text-black",
            isActive && !isNavigationHovered && "bg-white border-primary",
            isOpen && "bg-white border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[4px] -translate-y-[4px]"
          )}
        >
          <Link
            href={category.slug === "all" ? "/" : `/${category.slug}`}
          >
            {category.name}
          </Link>
        </Button>
        {subcategories.length > 0 && (
          <div
            className={cn(
              "opacity-0 absolute -bottom-3 w-0 h-0 border-l-[10px] border-r-[10px] border-b-[10px] border-l-transparent border-r-transparent border-b-black left-1/2 -translate-x-1/2",
              isOpen && "opacity-100"
            )}
          />
        )}
      </div>

      {/* The menu itself also cancels/extends the hover so the delayed close is cancelled */}
      <div
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        className="absolute left-0"
        style={{ top: "100%", zIndex: 100 }}
      >
        <SubcategoryMenu
          category={category}
          isOpen={isOpen}
        />
      </div>
    </div>
  );
};
