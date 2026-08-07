"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Eye,
  Users,
  Package,
  TrendingUp,
  Store,
  Star,
  ShoppingBag,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  BarChart3,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { generateTenantURL } from "@/lib/utils";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

const statusColors: Record<string, string> = {
  in_stock: "bg-emerald-100 text-emerald-700",
  low_stock: "bg-amber-100 text-amber-700",
  out_of_stock: "bg-red-100 text-red-700",
  pre_order: "bg-blue-100 text-blue-700",
};

const verificationBadge: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: <Clock className="h-3.5 w-3.5" /> },
  document_verified: { label: "Document Verified", color: "bg-blue-100 text-blue-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  physically_verified: { label: "Physically Verified", color: "bg-emerald-100 text-emerald-700", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-700", icon: <XCircle className="h-3.5 w-3.5" /> },
};

// ────────────────────────────────────────────────────────────
// Stat Card
// ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  sub?: string;
  accent?: string;
}

function StatCard({ label, value, icon, sub, accent = "from-indigo-500 to-purple-600" }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white shadow-sm">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-5`} />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-500">{label}</span>
          <div className={`p-2 rounded-xl bg-gradient-to-br ${accent} text-white shadow-sm`}>
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-gray-900">{typeof value === "number" ? fmt(value) : value}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Product Row
// ────────────────────────────────────────────────────────────

interface ProductRow {
  id: string;
  name: string;
  price: number;
  stockStatus: string;
  viewCount: number;
  uniqueViewCount: number;
  totalSold: number;
  reviewCount: number;
  reviewRating: number;
  isPrivate: boolean;
}

function ProductInsightRow({ product, currency }: { product: ProductRow; currency: string }) {
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors group">
      <td className="py-3 pl-4 pr-3">
        <div className="flex flex-col">
          <span className="font-medium text-gray-800 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </span>
          {product.isPrivate && (
            <span className="text-[10px] text-amber-500 font-medium">Private listing</span>
          )}
        </div>
      </td>
      <td className="py-3 px-3 text-sm text-gray-600 whitespace-nowrap">
        {currency} {product.price.toLocaleString()}
      </td>
      <td className="py-3 px-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[product.stockStatus] ?? "bg-gray-100 text-gray-600"}`}>
          {product.stockStatus?.replace("_", " ")}
        </span>
      </td>
      <td className="py-3 px-3 text-sm text-right text-gray-700">
        <div className="flex items-center justify-end gap-1">
          <Eye className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold">{fmt(product.viewCount)}</span>
          <span className="text-gray-400 text-xs">({fmt(product.uniqueViewCount)} unique)</span>
        </div>
      </td>
      <td className="py-3 px-3 text-sm text-right text-gray-700">
        <div className="flex items-center justify-end gap-1">
          <ShoppingBag className="h-3.5 w-3.5 text-gray-400" />
          <span className="font-semibold">{fmt(product.totalSold)}</span>
        </div>
      </td>
      <td className="py-3 pl-3 pr-4 text-sm text-right">
        {product.reviewCount > 0 ? (
          <div className="flex items-center justify-end gap-1">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
            <span className="font-semibold text-gray-700">{product.reviewRating.toFixed(1)}</span>
            <span className="text-gray-400 text-xs">({product.reviewCount})</span>
          </div>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        )}
      </td>
    </tr>
  );
}

// ────────────────────────────────────────────────────────────
// Main View
// ────────────────────────────────────────────────────────────

interface TenantInsightsViewProps {
  /** When provided (super-admin drill-down), show this specific tenant's data */
  tenantId?: string;
}

export function TenantInsightsView({ tenantId }: TenantInsightsViewProps = {}) {
  const trpc = useTRPC();
  const router = useRouter();

  const { data: session, isFetched: sessionFetched } = useQuery(trpc.auth.session.queryOptions());

  // Redirect if not authenticated
  useEffect(() => {
    if (sessionFetched && !session?.user) router.push("/");
  }, [sessionFetched, session?.user, router]);

  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("all");

  const { data, isLoading, error } = useQuery(
    trpc.tenants.getTenantInsights.queryOptions({ tenantId, timeRange })
  );

  if (isLoading || !sessionFetched) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <BarChart3 className="h-12 w-12 text-gray-300" />
        <p className="text-gray-500 text-sm">{error?.message ?? "No data available"}</p>
      </div>
    );
  }

  const { tenant, summary, products } = data;
  const currency = tenant.currency ?? "RWF";
  const badge = verificationBadge[tenant.verificationStatus ?? "pending"];

  // Sort products by views desc by default
  const sortedProducts = [...products].sort((a, b) => b.viewCount - a.viewCount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{tenant.name} Insights</h1>
              {badge && (
                <div className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1.5 ${statusColors[tenant.verificationStatus ?? "pending"]}`}>
                  {badge.icon}
                  {badge.label}
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Performance metrics for {tenant.slug}.toolbay.com
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as any)}
              className="px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg shadow-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="30d">Last 30 Days</option>
              <option value="7d">Last 7 Days</option>
              <option value="24h">Last 24 Hours</option>
            </select>
            {!tenantId && (
              <Link 
                href={`/tenants/${tenant.slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
              >
                View Live Store <ExternalLink className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Store Stats ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Store Page Traffic</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Store Page Visits"
              value={tenant.storeViewCount}
              icon={<Eye className="h-4 w-4" />}
              sub="Total page loads"
              accent="from-indigo-500 to-purple-600"
            />
            <StatCard
              label="Unique Visitors"
              value={tenant.storeUniqueViewCount}
              icon={<Users className="h-4 w-4" />}
              sub="Per browser session"
              accent="from-violet-500 to-purple-600"
            />
            <StatCard
              label="Product Page Views"
              value={summary.totalProductViews}
              icon={<TrendingUp className="h-4 w-4" />}
              sub="All products combined"
              accent="from-emerald-500 to-teal-600"
            />
            <StatCard
              label="Unique Product Views"
              value={summary.totalUniqueProductViews}
              icon={<BarChart3 className="h-4 w-4" />}
              sub="Per-session deduped"
              accent="from-cyan-500 to-blue-600"
            />
          </div>
        </div>

        {/* ── Product & Revenue Stats ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Sales & Inventory</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              label="Active Products"
              value={summary.totalProducts}
              icon={<Package className="h-4 w-4" />}
              sub="Non-archived listings"
              accent="from-orange-500 to-red-500"
            />
            <StatCard
              label="Total Items Sold"
              value={summary.totalSold}
              icon={<ShoppingBag className="h-4 w-4" />}
              sub="Across all products"
              accent="from-pink-500 to-rose-600"
            />
            <StatCard
              label="Total Revenue"
              value={`${currency} ${tenant.totalRevenue.toLocaleString()}`}
              icon={<ArrowUpRight className="h-4 w-4" />}
              sub="After platform fees"
              accent="from-amber-500 to-orange-600"
            />
          </div>
        </div>

        {/* ── Product Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Product Performance</h2>
            <span className="text-xs text-gray-400">{products.length} products · sorted by views</span>
          </div>

          {sortedProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Package className="h-12 w-12 text-gray-200" />
              <p className="text-gray-400 text-sm">No products yet</p>
              <Link
                href="/admin/collections/products/create"
                className="text-indigo-500 text-sm font-medium hover:underline"
              >
                Add your first product →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gray-50/80 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                    <th className="py-3 pl-4 pr-3">Product</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Stock</th>
                    <th className="py-3 px-3 text-right">Views</th>
                    <th className="py-3 px-3 text-right">Sold</th>
                    <th className="py-3 pl-3 pr-4 text-right">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedProducts.map((product) => (
                    <ProductInsightRow key={product.id} product={product} currency={currency} />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        {!tenantId && (
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/admin/collections/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
            >
              <Package className="h-4 w-4" />
              Manage Products
            </Link>
            <Link
              href="/admin/collections/products/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              + Add Product
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
            >
              ← Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
