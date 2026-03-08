'use client'

import { useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, ThumbsUp, ThumbsDown, User, MessageCircle, Mail, FileText, ChevronDown, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { formatCurrency } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

export function TenderBidsView({ tenderId }: { tenderId: string }) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [sortBy, setSortBy] = useState<'amount' | 'createdAt'>('amount')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [locationFilter, setLocationFilter] = useState<string | null>(null)
  const [expandedBids, setExpandedBids] = useState<Set<string>>(new Set())

  const toggleBid = useCallback((bidId: string) => {
    setExpandedBids((prev) => {
      const next = new Set(prev)
      if (next.has(bidId)) next.delete(bidId)
      else next.add(bidId)
      return next
    })
  }, [])

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tenderAuth } = useQuery({
    ...trpc.tenders.getById.queryOptions({ id: tenderId }),
    enabled: !!session.data?.user,
  })

  const { data: tenderPublic } = useQuery({
    ...trpc.tenders.getTenderForBids.queryOptions({ id: tenderId }),
    enabled: !session.data?.user && session.isFetched,
  })

  const tender = tenderAuth ?? tenderPublic

  const { data, isLoading } = useQuery({
    ...trpc.tenders.listBids.queryOptions({
      tenderId,
      limit: 100,
    }),
    enabled: true,
  })

  const allBids = data?.bids ?? []
  const locationOptions = useMemo(() => {
    const all = allBids.flatMap((b: any) =>
      (b.lineItems || []).map((li: any) => li.location).filter(Boolean),
    )
    return [...new Set(all)] as string[]
  }, [allBids])

  const ownerId = tender && typeof tender.createdBy === 'object' ? tender.createdBy?.id : tender?.createdBy
  const isOwner = !!session.data?.user && !!ownerId && String(session.data.user.id) === String(ownerId)

  const bids = useMemo(() => {
    let list = [...allBids]
    if (locationFilter) {
      list = list.filter((b: any) =>
        (b.lineItems || []).some((li: any) => li.location === locationFilter),
      )
    }
    list.sort((a: any, b: any) => {
      if (sortBy === 'amount') {
        const va = a.amount ?? Infinity
        const vb = b.amount ?? Infinity
        return sortOrder === 'asc' ? va - vb : vb - va
      }
      const va = new Date(a.createdAt).getTime()
      const vb = new Date(b.createdAt).getTime()
      return sortOrder === 'asc' ? va - vb : vb - va
    })
    return list
  }, [allBids, locationFilter, sortBy, sortOrder])

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

  const tenderItems = useMemo(() => (tender?.items as any[]) ?? [], [tender?.items])

  if (isLoading || (!session.data?.user && !tender && session.isFetched)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

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
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-5xl mx-auto space-y-5">
      <Link
        href={`/tenders/${tenderId}`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </Link>

      <div>
        <h1 className="text-xl font-bold">Bids</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {tender?.title} &mdash; {bids.length} bid{bids.length !== 1 ? 's' : ''}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          You see each bidder&apos;s latest submission only. They can update their bid until the tender closes.
        </p>
      </div>

      {bids.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort:</span>
            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'amount' | 'createdAt')}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="amount">By amount</SelectItem>
                <SelectItem value="createdAt">By date</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortOrder}
              onValueChange={(v) => setSortOrder(v as 'asc' | 'desc')}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">{sortBy === 'amount' ? 'Lowest first' : 'Oldest first'}</SelectItem>
                <SelectItem value="desc">{sortBy === 'amount' ? 'Highest first' : 'Newest first'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {locationOptions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Location:</span>
              <Select
                value={locationFilter ?? 'all'}
                onValueChange={(v) => setLocationFilter(v === 'all' ? null : v)}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  {locationOptions.map((loc) => (
                    <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}

      {tenderItems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Tender items (reference)</h3>
          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
            <table className="w-full min-w-[500px] border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-gray-50 text-left text-sm">
                  <th className="p-2 font-medium">Item</th>
                  <th className="p-2 font-medium">Quantity</th>
                  <th className="p-2 font-medium">Unit</th>
                  <th className="p-2 font-medium">Specification</th>
                </tr>
              </thead>
              <tbody>
                {tenderItems.map((item: any, i: number) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="p-2">{item.name ?? '—'}</td>
                    <td className="p-2">{item.quantity ?? '—'}</td>
                    <td className="p-2">{item.unit ?? '—'}</td>
                    <td className="p-2 text-gray-600">{item.specification ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {bids.length === 0 ? (
        <div className="py-16 text-center text-gray-400 text-sm">No bids yet</div>
      ) : (
        <div className="space-y-3">
          {bids.map((bid: any) => {
            const bidder =
              typeof bid.submittedBy === 'object' ? bid.submittedBy : null
            const bidderName = bidder?.username || bidder?.email || 'Unknown'
            const bidderId = bidder?.id || bid.submittedBy
            const bidderEmail = bidder?.email || null
            const msgText = richTextToPlain(bid.message)
            const lineItems = (bid.lineItems || []) as { price?: number; quantity?: number; specification?: string; location?: string }[]
            const currency = bid.currency || 'RWF'
            const isExpanded = expandedBids.has(bid.id)

            return (
              <Collapsible
                key={bid.id}
                open={isExpanded}
                onOpenChange={() => toggleBid(bid.id)}
              >
                <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full p-4 text-left flex flex-wrap items-center justify-between gap-2 hover:bg-gray-50/80 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isExpanded ? (
                          <ChevronDown className="size-4 shrink-0 text-gray-400" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-gray-400" />
                        )}
                        <User className="size-4 shrink-0 text-gray-400" />
                        <span className="font-medium truncate">{bidderName}</span>
                        <TenderStatusBadge status={bid.status} />
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm">
                          Total: {bid.amount != null
                            ? <strong>{formatCurrency(bid.amount, currency)}</strong>
                            : <span className="text-gray-400">—</span>}
                        </span>
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-0 space-y-2 border-t border-gray-100">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 pt-2">
                        {bid.validUntil && (
                          <span>Valid until {new Date(bid.validUntil).toLocaleDateString()}</span>
                        )}
                        <span>{new Date(bid.createdAt).toLocaleString()}</span>
                      </div>

                      {msgText && (
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{msgText}</p>
                      )}

                      {bid.documents && bid.documents.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {bid.documents.map((doc: any, di: number) => {
                            const file = typeof doc.file === 'object' ? doc.file : null
                            const url = file?.url
                            const filename = file?.filename || `Document ${di + 1}`
                            if (!url) return null
                            return (
                              <a
                                key={di}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                              >
                                <FileText className="size-3" />
                                {filename}
                              </a>
                            )
                          })}
                        </div>
                      )}

                      {bid.images && bid.images.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          <span className="text-xs font-medium text-gray-500 w-full">Bidder images</span>
                          {bid.images.map((img: any, ii: number) => {
                            const file = typeof img.file === 'object' ? img.file : null
                            const url = file?.url
                            if (!url) return null
                            return (
                              <a
                                key={ii}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img
                                  src={url}
                                  alt={file?.alt || `Image ${ii + 1}`}
                                  className="h-20 w-20 object-cover rounded border hover:opacity-90 transition"
                                />
                              </a>
                            )
                          })}
                        </div>
                      )}

                      {lineItems.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-500 mb-1">Line items</p>
                          <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                            <table className="w-full min-w-[500px] border border-gray-100 rounded-lg text-sm">
                              <thead>
                                <tr className="bg-gray-50 text-left">
                                  <th className="p-2 font-medium">Price</th>
                                  <th className="p-2 font-medium">Quantity</th>
                                  <th className="p-2 font-medium">Spec</th>
                                  <th className="p-2 font-medium">Location</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lineItems.map((li: any, idx: number) => (
                                  <tr key={idx} className="border-t border-gray-100">
                                    <td className="p-2">{li.price != null ? formatCurrency(li.price, currency) : '—'}</td>
                                    <td className="p-2">{li.quantity ?? '—'}</td>
                                    <td className="p-2 text-gray-600">{li.specification ?? '—'}</td>
                                    <td className="p-2">{li.location ?? '—'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {bid.status === 'submitted' && isOwner && (
                        <div className="flex gap-2 pt-2 border-t mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                            disabled={updateBidMutation.isPending}
                            onClick={(e) => {
                              e.preventDefault()
                              updateBidMutation.mutate({ bidId: bid.id, status: 'shortlisted' })
                            }}
                          >
                            <ThumbsUp className="size-3" /> Shortlist
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                            disabled={updateBidMutation.isPending}
                            onClick={(e) => {
                              e.preventDefault()
                              updateBidMutation.mutate({ bidId: bid.id, status: 'rejected' })
                            }}
                          >
                            <ThumbsDown className="size-3" /> Reject
                          </Button>
                        </div>
                      )}

                      {bid.status === 'shortlisted' && isOwner && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1.5"
                            disabled={startChatMutation.isPending}
                            onClick={(e) => {
                              e.preventDefault()
                              startChatMutation.mutate({ participantId: bidderId })
                            }}
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
                  </CollapsibleContent>
                </div>
              </Collapsible>
            )
          })}
        </div>
      )}
    </div>
  )
}
