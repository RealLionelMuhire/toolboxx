'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, FileX } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { formatCurrency } from '@/lib/utils'

export function MyBidsView() {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const isLoggedIn = !!session.data?.user

  const { data, isLoading } = useQuery({
    ...trpc.tenders.getMyBids.queryOptions({ limit: 50 }),
    enabled: isLoggedIn,
  })

  const withdrawMutation = useMutation(
    trpc.tenders.withdrawBid.mutationOptions({
      onSuccess: () => {
        toast.success('Bid withdrawn')
        queryClient.invalidateQueries(trpc.tenders.getMyBids.queryFilter())
      },
      onError: (err) => toast.error(err.message),
    }),
  )

  if (!isLoggedIn && session.isFetched) {
    router.push('/sign-in?redirect=/my-bids')
    return null
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const bids = data?.bids || []

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 space-y-4">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">My Bids</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track the status of bids you have submitted
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-2">
          <FileX className="size-10" />
          <p className="text-sm">You haven&apos;t submitted any bids yet</p>
          <Button variant="outline" size="sm" onClick={() => router.push('/tenders')}>
            Browse Tenders
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {bids.map((bid: any) => {
            const tender =
              typeof bid.tender === 'object' ? bid.tender : null
            const tenderTitle = tender?.title || 'Unknown Tender'
            const tenderId = tender?.id || bid.tender

            return (
              <div
                key={bid.id}
                className="border border-gray-200 rounded-xl bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    onClick={() => router.push(`/tenders/${tenderId}`)}
                    className="text-sm font-semibold text-left hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {tenderTitle}
                  </button>
                  <TenderStatusBadge status={bid.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {bid.amount != null && (
                    <span>
                      Amount: <strong>{formatCurrency(bid.amount)}</strong>
                    </span>
                  )}
                  {bid.validUntil && (
                    <span>Valid until {new Date(bid.validUntil).toLocaleDateString()}</span>
                  )}
                  <span>Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                </div>

                {bid.status === 'submitted' && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                    disabled={withdrawMutation.isPending}
                    onClick={() => withdrawMutation.mutate({ bidId: bid.id })}
                  >
                    Withdraw Bid
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
