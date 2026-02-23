import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { SubmitBidView } from '@/modules/tenders/ui/views/submit-bid-view'

export const dynamic = 'force-dynamic'

export default async function SubmitBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.tenders.getById.queryOptions({ id }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<SubmitBidSkeleton />}>
        <SubmitBidView tenderId={id} />
      </Suspense>
    </HydrationBoundary>
  )
}

function SubmitBidSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-2xl mx-auto space-y-5">
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="border border-gray-200 rounded-xl bg-white p-5 space-y-4">
        <div className="h-28 w-full bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
