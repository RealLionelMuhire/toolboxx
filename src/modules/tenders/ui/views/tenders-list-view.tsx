'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, FileX } from 'lucide-react'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TenderCard } from '../components/tender-card'

type TabValue = 'all' | 'mine'

export function TendersListView() {
  const trpc = useTRPC()
  const router = useRouter()
  const [tab, setTab] = useState<TabValue>('all')
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined)

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const isLoggedIn = !!session.data?.user

  const { data, isLoading } = useQuery({
    ...trpc.tenders.list.queryOptions({
      mine: tab === 'mine',
      status: statusFilter as any,
      limit: 50,
      page: 1,
    }),
    enabled: isLoggedIn,
  })

  if (!isLoggedIn && session.isFetched) {
    router.push('/sign-in?redirect=/tenders')
    return null
  }

  const tenders = data?.tenders || []

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
        <Button onClick={() => router.push('/tenders/new')} className="gap-1.5">
          <Plus className="size-4" />
          <span className="hidden sm:inline">New Tender</span>
        </Button>
      </div>

      {/* Tabs + filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabValue)}>
          <TabsList>
            <TabsTrigger value="all">All Open</TabsTrigger>
            <TabsTrigger value="mine">My Tenders</TabsTrigger>
          </TabsList>
        </Tabs>

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
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-gray-400" />
        </div>
      ) : tenders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <FileX className="size-10" />
          <p className="text-sm">No tenders found</p>
        </div>
      ) : (
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
              createdAt={t.createdAt}
            />
          ))}
        </div>
      )}
    </div>
  )
}
