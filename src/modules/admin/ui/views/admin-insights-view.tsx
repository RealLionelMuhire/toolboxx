"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Store,
  Eye,
  Users,
  Package,
  TrendingUp,
  Search,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  BarChart3,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { TenantInsightsView } from "@/modules/tenants/ui/views/tenant-insights-view";

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  document_verified: "bg-blue-100 text-blue-700",
  physically_verified: "bg-emerald-100 text-emerald-700",
  rejected: "bg-red-100 text-red-700",
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3 w-3" />,
  document_verified: <CheckCircle2 className="h-3 w-3" />,
  physically_verified: <CheckCircle2 className="h-3 w-3" />,
  rejected: <XCircle className="h-3 w-3" />,
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
// Sort helpers
// ────────────────────────────────────────────────────────────

type SortKey = "name" | "storeViewCount" | "productCount" | "totalProductViews" | "totalRevenue" | "createdAt";
type SortDir = "asc" | "desc";

// ────────────────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────────────────

export function AdminInsightsView() {
  const trpc = useTRPC();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("storeViewCount");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d" | "all">("all");

  const { data, isLoading, error } = useQuery(trpc.tenants.getAdminInsights.queryOptions({ timeRange }));

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  if (isLoading) {
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
        <p className="text-gray-500 text-sm">{error?.message ?? "Failed to load admin insights"}</p>
      </div>
    );
  }

  const { platform, tenants } = data;

  type TenantRow = (typeof tenants)[number];

  // Filter + sort
  const filtered = tenants
    .filter((t: TenantRow) =>
      !search ||
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: TenantRow, b: TenantRow) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      if (typeof av === "string" && typeof bv === "string") {
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });

  const SortIcon = ({ col }: { col: SortKey }) =>
    sortKey === col ? (
      sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5 inline ml-1" /> : <ChevronDown className="h-3.5 w-3.5 inline ml-1" />
    ) : null;

  // If a tenant is selected, show their drill-down
  if (selectedTenantId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => setSelectedTenantId(null)}
            className="inline-flex items-center gap-2 mb-6 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors"
          >
            ← Back to All Tenants
          </button>
          <TenantInsightsView tenantId={selectedTenantId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Platform Analytics</h1>
            <p className="text-sm text-gray-500 mt-1">
              Cross-tenant visitor insights for all stores
            </p>
          </div>
          <div>
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
          </div>
        </div>

        {/* ── Platform Stats ── */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Platform Overview</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Stores"
              value={platform.totalTenants}
              icon={<Store className="h-4 w-4" />}
              sub={`${platform.verifiedTenants} verified`}
              accent="from-indigo-500 to-purple-600"
            />
            <StatCard
              label="Total Store Visits"
              value={platform.totalStoreViews}
              icon={<Eye className="h-4 w-4" />}
              sub="All store pages combined"
              accent="from-violet-500 to-purple-600"
            />
            <StatCard
              label="Total Product Views"
              value={platform.totalProductViews}
              icon={<TrendingUp className="h-4 w-4" />}
              sub="All products combined"
              accent="from-emerald-500 to-teal-600"
            />
            <StatCard
              label="Verified Tenants"
              value={platform.verifiedTenants}
              icon={<CheckCircle2 className="h-4 w-4" />}
              sub={`${platform.totalTenants - platform.verifiedTenants} pending`}
              accent="from-cyan-500 to-blue-600"
            />
          </div>
        </div>

        {/* ── Tenant Table ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Table header with search */}
          <div className="px-6 py-4 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-800">
              Tenant Breakdown
              <span className="text-xs font-normal text-gray-400 ml-2">({filtered.length} stores)</span>
            </h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tenants…"
                className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-colors w-full sm:w-56"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
                  <th
                    className="py-3 pl-4 pr-3 cursor-pointer hover:text-indigo-600 select-none"
                    onClick={() => handleSort("name")}
                  >
                    Store <SortIcon col="name" />
                  </th>
                  <th className="py-3 px-3">Status</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-indigo-600 select-none"
                    onClick={() => handleSort("storeViewCount")}
                  >
                    Store Visits <SortIcon col="storeViewCount" />
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-indigo-600 select-none"
                    onClick={() => handleSort("productCount")}
                  >
                    Products <SortIcon col="productCount" />
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-indigo-600 select-none"
                    onClick={() => handleSort("totalProductViews")}
                  >
                    Product Views <SortIcon col="totalProductViews" />
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-indigo-600 select-none"
                    onClick={() => handleSort("totalRevenue")}
                  >
                    Revenue <SortIcon col="totalRevenue" />
                  </th>
                  <th className="py-3 pl-3 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      No tenants found
                    </td>
                  </tr>
                ) : (
                  filtered.map((tenant: TenantRow) => {
                    const badge = statusColors[tenant.verificationStatus ?? "pending"];
                    const icon = statusIcons[tenant.verificationStatus ?? "pending"];
                    return (
                      <tr
                        key={tenant.id}
                        className="border-b border-gray-50 hover:bg-indigo-50/30 transition-colors group"
                      >
                        {/* Store name */}
                        <td className="py-3 pl-4 pr-3">
                          <button
                            onClick={() => setSelectedTenantId(tenant.id)}
                            className="text-left group/btn"
                          >
                            <p className="text-sm font-semibold text-gray-800 group-hover/btn:text-indigo-600 transition-colors">
                              {tenant.name}
                            </p>
                            <p className="text-[11px] text-gray-400">{tenant.slug}</p>
                          </button>
                        </td>

                        {/* Verification status */}
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${badge}`}>
                            {icon}
                            {tenant.verificationStatus?.replace("_", " ") ?? "pending"}
                          </span>
                        </td>

                        {/* Store visits */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Eye className="h-3.5 w-3.5 text-gray-300" />
                            <span className="text-sm font-semibold text-gray-700">{fmt(tenant.storeViewCount)}</span>
                            <span className="text-[11px] text-gray-400">({fmt(tenant.storeUniqueViewCount)} uniq)</span>
                          </div>
                        </td>

                        {/* Product count */}
                        <td className="py-3 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Package className="h-3.5 w-3.5 text-gray-300" />
                            <span className="text-sm font-semibold text-gray-700">{tenant.productCount}</span>
                          </div>
                        </td>

                        {/* Product views */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm font-semibold text-gray-700">{fmt(tenant.totalProductViews)}</span>
                        </td>

                        {/* Revenue */}
                        <td className="py-3 px-3 text-right">
                          <span className="text-sm font-semibold text-gray-700">
                            {tenant.currency ?? "RWF"} {fmt(tenant.totalRevenue)}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 pl-3 pr-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedTenantId(tenant.id)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="View insights"
                            >
                              <BarChart3 className="h-4 w-4" />
                            </button>
                            <Link
                              href={`/tenants/${tenant.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Open store"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
