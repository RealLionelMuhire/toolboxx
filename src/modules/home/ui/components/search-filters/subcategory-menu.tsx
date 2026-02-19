import Link from "next/link";

import { CategoriesGetManyOutput } from "@/modules/categories/types";

interface Props {
  category: CategoriesGetManyOutput[1];
  isOpen: boolean;
}

export const SubcategoryMenu = ({
  category,
  isOpen,
}: Props) => {
  // Handle both flat array (from router) and Payload join object shape
  const subcategories = Array.isArray(category.subcategories)
    ? category.subcategories
    : (category.subcategories as any)?.docs ?? [];

  if (!isOpen || subcategories.length === 0) {
    return null;
  }

  const backgroundColor = category.color || "#F5F5F5";

  return (
    <div className="pt-3 w-60">
      <div
        style={{ backgroundColor }}
        className="w-60 text-black rounded-md overflow-hidden border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-x-[2px] -translate-y-[2px]"
      >
        <div>
          {subcategories.map((subcategory: any) => (
            <Link
              key={subcategory.slug}
              href={`/${category.slug}/${subcategory.slug}`}
              className="w-full text-left p-4 hover:bg-black hover:text-white flex justify-between items-center underline font-medium"
            >
              {subcategory.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};
