'use client'

import { useState } from 'react'
import Link from 'next/link'
import { OptimizedLink } from '@/components/optimized-link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, FileX } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { formatCurrency } from '@/lib/utils'

export function MyBidsView() {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [withdrawBidId, setWithdrawBidId] = useState<string | null>(null)

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
        setWithdrawBidId(null)
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
          <Button variant="outline" size="sm" asChild>
            <Link href="/tenders">Browse Tenders</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {bids.map((bid: any) => {
            const tender =
              typeof bid.tender === 'object' ? bid.tender : null
            const tenderTitle = tender?.title || 'Unknown Tender'
            const tenderId = tender?.id || bid.tender
            const tenderStatus = tender?.status

            return (
              <div
                key={bid.id}
                className="border border-gray-200 rounded-xl bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/tenders/${tenderId}`}
                    className="text-sm font-semibold text-left hover:text-blue-600 transition-colors line-clamp-1"
                  >
                    {tenderTitle}
                  </Link>
                  <TenderStatusBadge status={bid.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {bid.amount != null && (
                    <span>
                      Amount: <strong>{formatCurrency(bid.amount, bid.currency || 'RWF')}</strong>
                    </span>
                  )}
                  {bid.validUntil && (
                    <span>Valid until {new Date(bid.validUntil).toLocaleDateString()}</span>
                  )}
                  <span>Submitted {new Date(bid.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {bid.status === 'submitted' && (tenderStatus === 'draft' || tenderStatus === 'open') && (
                    <Button size="sm" variant="elevated" className="bg-orange-400" asChild>
                      <OptimizedLink href={`/tenders/${tenderId}/bid`} prefetch={true}>Update bid</OptimizedLink>
                    </Button>
                  )}
                  {bid.status === 'submitted' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={withdrawMutation.isPending}
                      onClick={() => setWithdrawBidId(bid.id)}
                    >
                      Withdraw Bid
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!withdrawBidId} onOpenChange={(open) => !open && setWithdrawBidId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Withdraw Bid?</AlertDialogTitle>
            <AlertDialogDescription>
              This will withdraw your bid from the tender. The tender owner will be notified. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Bid</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => withdrawBidId && withdrawMutation.mutate({ bidId: withdrawBidId })}
              className="bg-red-600 hover:bg-red-700"
            >
              Withdraw
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
