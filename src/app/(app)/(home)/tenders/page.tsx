import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { TendersListView } from '@/modules/tenders/ui/views/tenders-list-view'

export const dynamic = 'force-dynamic'

export default async function TendersPage() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TendersPageSkeleton />}>
        <TendersListView />
      </Suspense>
    </HydrationBoundary>
  )
}

function TendersPageSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2" />
        </div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="h-9 w-56 bg-gray-200 rounded-lg animate-pulse" />
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
