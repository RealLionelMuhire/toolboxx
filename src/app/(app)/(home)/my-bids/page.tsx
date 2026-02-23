import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { MyBidsView } from '@/modules/tenders/ui/views/my-bids-view'

export const dynamic = 'force-dynamic'

export default async function MyBidsPage() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.tenders.getMyBids.queryOptions({ limit: 50 }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<MyBidsSkeleton />}>
        <MyBidsView />
      </Suspense>
    </HydrationBoundary>
  )
}

function MyBidsSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 space-y-4">
      <div className="h-7 w-28 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="border border-gray-200 rounded-xl bg-white p-4 space-y-2">
            <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  )
}
