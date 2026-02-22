'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, ThumbsUp, ThumbsDown, User, MessageCircle, Phone, Mail } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { formatCurrency } from '@/lib/utils'

export function TenderBidsView({ tenderId }: { tenderId: string }) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tender } = useQuery({
    ...trpc.tenders.getById.queryOptions({ id: tenderId }),
    enabled: !!session.data?.user,
  })

  const { data, isLoading } = useQuery({
    ...trpc.tenders.listBids.queryOptions({ tenderId, limit: 100 }),
    enabled: !!session.data?.user,
  })

  const updateBidMutation = useMutation(
    trpc.tenders.updateBidStatus.mutationOptions({
      onSuccess: () => {
        toast.success('Bid status updated')
        queryClient.invalidateQueries(trpc.tenders.listBids.queryFilter({ tenderId }))
      },
      onError: (err) => toast.error(err.message),
    }),
  )

  const startChatMutation = useMutation(
    trpc.chat.startConversation.mutationOptions({
      onSuccess: (data) => {
        router.push(`/chat/${data.id}`)
      },
      onError: (err) => toast.error(err.message || 'Failed to start chat'),
    }),
  )

  if (isLoading || !session.isFetched) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  const bids = data?.bids || []

  function richTextToPlain(root: any): string {
    if (!root) return ''
    if (typeof root === 'string') return root
    const extract = (node: any): string => {
      if (node.text) return node.text
      if (node.children) return node.children.map(extract).join('')
      return ''
    }
    if (root.root) return extract(root.root)
    return extract(root)
  }

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-3xl mx-auto space-y-5">
      <button
        onClick={() => router.push(`/tenders/${tenderId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </button>

      <div>
        <h1 className="text-xl font-bold">Bids</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {tender?.title} &mdash; {bids.length} bid{bids.length !== 1 ? 's' : ''}
        </p>
      </div>

      {bids.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No bids yet</div>
      ) : (
        <div className="grid gap-3">
          {bids.map((bid: any) => {
            const bidder =
              typeof bid.submittedBy === 'object'
                ? bid.submittedBy
                : null
            const bidderName = bidder?.username || bidder?.email || 'Unknown'
            const bidderId = bidder?.id || bid.submittedBy
            const bidderEmail = bidder?.email || null
            const msgText = richTextToPlain(bid.message)

            return (
              <div
                key={bid.id}
                className="border border-gray-200 rounded-xl bg-white p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <User className="size-4 text-gray-400" />
                    {bidderName}
                  </div>
                  <TenderStatusBadge status={bid.status} />
                </div>

                {msgText && (
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{msgText}</p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  {bid.amount != null && (
                    <span>
                      Amount: <strong>{formatCurrency(bid.amount)}</strong>
                    </span>
                  )}
                  {bid.validUntil && (
                    <span>Valid until {new Date(bid.validUntil).toLocaleDateString()}</span>
                  )}
                  <span>{new Date(bid.createdAt).toLocaleString()}</span>
                </div>

                {/* Shortlist / Reject actions (only for submitted bids) */}
                {bid.status === 'submitted' && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                      disabled={updateBidMutation.isPending}
                      onClick={() =>
                        updateBidMutation.mutate({ bidId: bid.id, status: 'shortlisted' })
                      }
                    >
                      <ThumbsUp className="size-3" /> Shortlist
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                      disabled={updateBidMutation.isPending}
                      onClick={() =>
                        updateBidMutation.mutate({ bidId: bid.id, status: 'rejected' })
                      }
                    >
                      <ThumbsDown className="size-3" /> Reject
                    </Button>
                  </div>
                )}

                {/* Contact actions for shortlisted bids */}
                {bid.status === 'shortlisted' && (
                  <div className="flex flex-wrap gap-2 pt-1 border-t mt-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      disabled={startChatMutation.isPending}
                      onClick={() => startChatMutation.mutate({ participantId: bidderId })}
                    >
                      <MessageCircle className="size-3.5" />
                      Chat with {bidderName.split(' ')[0] || 'Bidder'}
                    </Button>
                    {bidderEmail && (
                      <Button size="sm" variant="outline" className="gap-1.5" asChild>
                        <a href={`mailto:${bidderEmail}`}>
                          <Mail className="size-3.5" />
                          Email
                        </a>
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
