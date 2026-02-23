'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft, Calendar, Mail, Phone, MessageCircle, FileText, Send, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { TenderStatusBadge } from '../components/tender-status-badge'
import { TenderTypeBadge } from '../components/tender-type-badge'

const CONTACT_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="size-3.5" />,
  phone: <Phone className="size-3.5" />,
  chat: <MessageCircle className="size-3.5" />,
}

export function TenderDetailView({ tenderId }: { tenderId: string }) {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tender, isLoading } = useQuery({
    ...trpc.tenders.getById.queryOptions({ id: tenderId }),
    enabled: !!session.data?.user,
  })

  // Fetch current user's bid on this tender (if any)
  const { data: myBidsData } = useQuery({
    ...trpc.tenders.getMyBids.queryOptions({ limit: 100 }),
    enabled: !!session.data?.user,
    select: (data) => data.bids.find((b: any) => {
      const tid = typeof b.tender === 'object' ? b.tender?.id : b.tender
      return tid === tenderId
    }),
  })

  const updateStatusMutation = useMutation(
    trpc.tenders.updateStatus.mutationOptions({
      onSuccess: () => {
        toast.success('Tender status updated')
        queryClient.invalidateQueries(trpc.tenders.getById.queryFilter({ id: tenderId }))
        queryClient.invalidateQueries(trpc.tenders.list.queryFilter())
      },
      onError: (err) => toast.error(err.message),
    }),
  )

  // Start chat mutation
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

  if (!tender) {
    return (
      <div className="px-4 py-20 text-center text-gray-400">
        Tender not found
      </div>
    )
  }

  const user = session.data?.user
  const ownerId = typeof tender.createdBy === 'object' ? tender.createdBy?.id : tender.createdBy
  const isOwner = user && String(user.id) === String(ownerId)
  const creatorName =
    typeof tender.createdBy === 'object'
      ? tender.createdBy?.username || tender.createdBy?.email
      : 'Unknown'
  const tenantName =
    typeof tender.tenant === 'object' && tender.tenant ? tender.tenant.name : null

  // Owner's tenant phone (for bidders to call)
  const ownerTenantPhone =
    typeof tender.tenant === 'object' && tender.tenant
      ? (tender.tenant as any).contactPhone
      : null
  // Owner's email
  const ownerEmail =
    typeof tender.createdBy === 'object' ? tender.createdBy?.email : null

  const isDeadlinePassed = tender.responseDeadline
    ? new Date(tender.responseDeadline) < new Date()
    : false

  const myBid = myBidsData
  const hasSubmittedBid = !!myBid
  const canBid = tender.status === 'open' && !isOwner && !isDeadlinePassed && !hasSubmittedBid

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

  const handleChatWithOwner = () => {
    if (!ownerId) return
    startChatMutation.mutate({ participantId: ownerId as string })
  }

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <button
        onClick={() => router.push('/tenders')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tenders
      </button>

      {/* Header */}
      <div className="border border-gray-200 rounded-xl bg-white p-5 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl font-bold">{tender.title}</h1>
            {tender.tenderNumber && (
              <p className="text-xs text-gray-400 font-mono mt-0.5">{tender.tenderNumber}</p>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <TenderTypeBadge type={tender.type} />
            <TenderStatusBadge status={tender.status} />
          </div>
        </div>

        {/* Meta */}
        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
          <span>
            Created by <strong>{creatorName}</strong>
            {tenantName && <span className="text-gray-400"> ({tenantName})</span>}
          </span>
          {tender.responseDeadline && (
            <span className={`flex items-center gap-1 ${isDeadlinePassed ? 'text-red-500' : ''}`}>
              <Calendar className="size-3" />
              {isDeadlinePassed ? 'Deadline passed' : `Due ${new Date(tender.responseDeadline).toLocaleString()}`}
            </span>
          )}
          {tender.contactPreference && (
            <span className="flex items-center gap-1">
              {CONTACT_ICONS[tender.contactPreference]}
              Prefers {tender.contactPreference}
            </span>
          )}
          <span className="flex items-center gap-1">
            <FileText className="size-3" />
            {tender.bidCount || 0} bid{(tender.bidCount || 0) !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Description */}
        <div className="border-t pt-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
          {richTextToPlain(tender.description) || 'No description provided.'}
        </div>

        {/* Documents */}
        {tender.documents && tender.documents.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Attached Documents</p>
            <div className="flex flex-wrap gap-2">
              {tender.documents.map((doc: any, i: number) => {
                const file = typeof doc.file === 'object' ? doc.file : null
                return file ? (
                  <a
                    key={i}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="size-3 text-gray-400" />
                    {file.filename || `Document ${i + 1}`}
                  </a>
                ) : null
              })}
            </div>
          </div>
        )}
      </div>

      {/* Bidder's bid status banner */}
      {hasSubmittedBid && !isOwner && (
        <div className={`rounded-xl border p-4 flex items-center gap-3 ${
          myBid.status === 'shortlisted' ? 'bg-green-50 border-green-200' :
          myBid.status === 'rejected' ? 'bg-red-50 border-red-200' :
          myBid.status === 'withdrawn' ? 'bg-gray-50 border-gray-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <CheckCircle className={`size-5 shrink-0 ${
            myBid.status === 'shortlisted' ? 'text-green-600' :
            myBid.status === 'rejected' ? 'text-red-500' :
            myBid.status === 'withdrawn' ? 'text-gray-400' :
            'text-blue-600'
          }`} />
          <div className="flex-1">
            <p className="text-sm font-medium">
              {myBid.status === 'submitted' && 'Your bid has been submitted'}
              {myBid.status === 'shortlisted' && 'Your bid has been shortlisted!'}
              {myBid.status === 'rejected' && 'Your bid was not selected'}
              {myBid.status === 'withdrawn' && 'You withdrew your bid'}
            </p>
            {myBid.amount != null && (
              <p className="text-xs text-gray-500 mt-0.5">Quoted amount: {myBid.amount?.toLocaleString()} {myBid.currency || 'RWF'}</p>
            )}
          </div>
          <TenderStatusBadge status={myBid.status} />
        </div>
      )}

      {/* Contact actions for shortlisted bidders */}
      {hasSubmittedBid && myBid.status === 'shortlisted' && !isOwner && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">Contact the tender owner to proceed</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={handleChatWithOwner}
              disabled={startChatMutation.isPending}
            >
              <MessageCircle className="size-3.5" />
              Chat
            </Button>
            {ownerTenantPhone && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href={`tel:${ownerTenantPhone}`}>
                  <Phone className="size-3.5" />
                  Call {ownerTenantPhone}
                </a>
              </Button>
            )}
            {ownerEmail && (
              <Button size="sm" variant="outline" className="gap-1.5" asChild>
                <a href={`mailto:${ownerEmail}`}>
                  <Mail className="size-3.5" />
                  Email
                </a>
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Owner actions */}
        {isOwner && tender.status === 'draft' && (
          <Button
            variant="elevated"
            className="bg-orange-400"
            onClick={() => updateStatusMutation.mutate({ id: tenderId, status: 'open' })}
            disabled={updateStatusMutation.isPending}
          >
            {updateStatusMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Publish Tender
          </Button>
        )}
        {isOwner && tender.status === 'open' && (
          <Button
            variant="outline"
            onClick={() => updateStatusMutation.mutate({ id: tenderId, status: 'closed' })}
            disabled={updateStatusMutation.isPending}
          >
            Close Tender
          </Button>
        )}
        {isOwner && ['draft', 'open'].includes(tender.status) && (
          <Button
            variant="outline"
            className="text-red-600 border-red-200 hover:bg-red-50"
            onClick={() => updateStatusMutation.mutate({ id: tenderId, status: 'cancelled' })}
            disabled={updateStatusMutation.isPending}
          >
            Cancel Tender
          </Button>
        )}
        {isOwner && (
          <Button variant="elevated" className="bg-white" onClick={() => router.push(`/tenders/${tenderId}/bids`)}>
            View Bids ({tender.bidCount || 0})
          </Button>
        )}

        {/* Bidder action */}
        {canBid && (
          <Button
            variant="elevated"
            className="gap-1.5 bg-orange-400"
            onClick={() => router.push(`/tenders/${tenderId}/bid`)}
          >
            <Send className="size-4" />
            Submit Bid
          </Button>
        )}
      </div>
    </div>
  )
}
