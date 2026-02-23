import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { TenderBidsView } from '@/modules/tenders/ui/views/tender-bids-view'

export const dynamic = 'force-dynamic'

export default async function TenderBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.tenders.getById.queryOptions({ id }))
  void queryClient.prefetchQuery(trpc.tenders.listBids.queryOptions({ tenderId: id, limit: 100 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TenderBidsSkeleton />}>
        <TenderBidsView tenderId={id} />
      </Suspense>
    </HydrationBoundary>
  )
}

function TenderBidsSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-3xl mx-auto space-y-5">
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-6 w-24 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl bg-white p-4 space-y-2">
            <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/3 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
