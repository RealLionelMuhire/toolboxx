import { Suspense } from 'react'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { getQueryClient, trpc } from '@/trpc/server'
import { CreateTenderView } from '@/modules/tenders/ui/views/create-tender-view'

export const dynamic = 'force-dynamic'

export default async function NewTenderPage() {
  const queryClient = getQueryClient()

  void queryClient.prefetchQuery(trpc.auth.session.queryOptions())
  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions())

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<CreateTenderSkeleton />}>
        <CreateTenderView />
      </Suspense>
    </HydrationBoundary>
  )
}

function CreateTenderSkeleton() {
  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-2xl mx-auto space-y-5">
      <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
      <div className="h-4 w-72 bg-gray-200 rounded animate-pulse" />
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-28 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-40 w-full bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  )
}
