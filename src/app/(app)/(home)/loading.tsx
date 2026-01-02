import { ProductListSkeleton } from "@/modules/products/ui/components/product-list";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-12 lg:py-16">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded-lg w-3/4 mb-4"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-1/2"></div>
          </div>
        </div>
      </div>
      
      {/* Products Section */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse mb-6">
          <div className="h-8 bg-gray-200 rounded-lg w-48 mb-4"></div>
        </div>
        <ProductListSkeleton narrowView={false} viewMode="grid" />
      </div>
    </div>
  );
}
