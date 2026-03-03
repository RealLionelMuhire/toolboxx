'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { OptimizedLink } from '@/components/optimized-link'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, FileX, ChevronLeft, ChevronRight, LayoutGrid, Table } from 'lucide-react'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TenderCard } from '../components/tender-card'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { formatCurrency } from '@/lib/utils'

type TabValue = 'all' | 'mine' | 'my-bids'

export function TendersListView() {
  const trpc = useTRPC()
  const router = useRouter()
  const [tab, setTab] = useState<TabValue>('all')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const isLoggedIn = !!session.data?.user

  const { data, isLoading } = useQuery({
    ...trpc.tenders.list.queryOptions({
      mine: tab === 'mine',
      status: statusFilter && statusFilter !== 'all' ? (statusFilter as 'draft' | 'open' | 'closed' | 'cancelled') : undefined,
      limit: 20,
      page,
    }),
    enabled: isLoggedIn && tab !== 'my-bids',
  })

  const { data: myBidsData, isLoading: myBidsLoading } = useQuery({
    ...trpc.tenders.getMyBids.queryOptions({ limit: 50, page: 1 }),
    enabled: isLoggedIn && tab === 'my-bids',
  })

  if (!isLoggedIn && session.isFetched) {
    router.push('/sign-in?redirect=/tenders')
    return null
  }

  const tenders = data?.tenders || []
  const totalPages = data?.totalPages ?? 1
  const currentPage = data?.page ?? 1
  const myBids = myBidsData?.bids ?? []

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Tenders</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Browse open tenders or create your own RFQ/RFP
          </p>
        </div>
        <Button variant="elevated" className="gap-1.5 bg-orange-400" asChild>
          <OptimizedLink href="/tenders/new">
            <Plus className="size-4" />
            <span className="hidden sm:inline">New Tender</span>
          </OptimizedLink>
        </Button>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => { setTab(v as TabValue); setPage(1) }}>
          <TabsList>
            <TabsTrigger value="all">All Open</TabsTrigger>
            <TabsTrigger value="mine">My Tenders</TabsTrigger>
            <TabsTrigger value="my-bids">My Bids</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab !== 'my-bids' && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 border rounded p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Cards view"
              >
                <LayoutGrid className="size-3.5" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                aria-label="Table view"
              >
                <Table className="size-3.5" />
              </button>
            </div>
          </div>
        )}
        {tab === 'mine' && (
          <div className="flex gap-1.5 text-xs">
            {['all', 'draft', 'open', 'closed', 'cancelled'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s === 'all' ? undefined : s)}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  (s === 'all' && !statusFilter) || statusFilter === s
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      {tab === 'my-bids' ? (
        myBidsLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : myBids.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
            <FileX className="size-10" />
            <p className="text-sm">You haven&apos;t submitted any bids yet</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/tenders">Browse Tenders</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {myBids.map((bid: any) => {
              const tender = typeof bid.tender === 'object' ? bid.tender : null
              const tenderTitle = tender?.title || 'Unknown Tender'
              const tenderId = tender?.id || bid.tender
              return (
                <Link
                  key={bid.id}
                  href={`/tenders/${tenderId}`}
                  className="block border border-gray-200 rounded-xl bg-white p-4 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold line-clamp-1">{tenderTitle}</span>
                    <TenderStatusBadge status={bid.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 mt-2">
                    {bid.amount != null && (
                      <span>Amount: <strong>{formatCurrency(bid.amount, bid.currency || 'RWF')}</strong></span>
                    )}
                    <span>Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )
      ) : isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : tenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <FileX className="size-10" />
          <p className="text-sm">No tenders found</p>
        </div>
      ) : viewMode === 'table' ? (
        <>
          <div className="overflow-x-auto border rounded-xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-3 font-medium">Tender #</th>
                  <th className="text-left py-3 px-3 font-medium">Title</th>
                  <th className="text-left py-3 px-3 font-medium">Type</th>
                  <th className="text-left py-3 px-3 font-medium">Status</th>
                  <th className="text-left py-3 px-3 font-medium">Items</th>
                  <th className="text-left py-3 px-3 font-medium">Bids</th>
                  <th className="text-left py-3 px-3 font-medium">Deadline</th>
                  <th className="text-left py-3 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenders.map((t: any) => {
                  const itemsCount = (t.items as any[])?.length ?? 0
                  return (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="py-2 px-3 font-mono text-xs">{t.tenderNumber || '—'}</td>
                      <td className="py-2 px-3">
                        <Link href={`/tenders/${t.id}`} className="font-medium hover:text-blue-600">
                          {t.title}
                        </Link>
                      </td>
                      <td className="py-2 px-3">{t.type?.toUpperCase()}</td>
                      <td className="py-2 px-3">
                        <TenderStatusBadge status={t.status} />
                      </td>
                      <td className="py-2 px-3">{itemsCount > 0 ? `${itemsCount} items` : '—'}</td>
                      <td className="py-2 px-3">{t.bidCount ?? 0}</td>
                      <td className="py-2 px-3">
                        {t.responseDeadline
                          ? new Date(t.responseDeadline).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="py-2 px-3">
                        <Link href={`/tenders/${t.id}`} className="text-blue-600 hover:underline text-xs">
                          View
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="grid gap-3">
            {tenders.map((t: any) => (
              <TenderCard
                key={t.id}
                id={t.id}
                title={t.title}
                tenderNumber={t.tenderNumber}
                type={t.type}
                status={t.status}
                createdBy={t.createdBy}
                tenant={t.tenant}
                responseDeadline={t.responseDeadline}
                bidCount={t.bidCount}
                itemsCount={(t.items as any[])?.length ?? 0}
                createdAt={t.createdAt}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="size-4" /> Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
