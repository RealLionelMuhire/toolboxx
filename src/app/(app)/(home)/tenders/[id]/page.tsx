import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { TenderDetailView } from '@/modules/tenders/ui/views/tender-detail-view'

export const dynamic = 'force-dynamic'

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.tenders.getById.queryOptions({ id }))

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TenderDetailSkeleton />}>
        <TenderDetailView tenderId={id} />
      </Suspense>
    </HydrationBoundary>
  )
}

function TenderDetailSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-3xl mx-auto space-y-5">
      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
      <div className="border border-gray-200 rounded-xl bg-white p-5 space-y-3">
        <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
        <div className="border-t pt-3 space-y-2">
          <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-28 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
