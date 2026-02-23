'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function SubmitBidView({ tenderId }: { tenderId: string }) {
  const trpc = useTRPC()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [validUntil, setValidUntil] = useState('')

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tender, isLoading: tenderLoading } = useQuery({
    ...trpc.tenders.getById.queryOptions({ id: tenderId }),
    enabled: !!session.data?.user,
  })

  const submitMutation = useMutation(
    trpc.tenders.submitBid.mutationOptions({
      onSuccess: () => {
        toast.success('Bid submitted successfully')
        router.push(`/tenders/${tenderId}`)
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to submit bid')
      },
    }),
  )

  if (tenderLoading || !session.isFetched) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!tender) {
    return <div className="px-4 py-20 text-center text-gray-400">Tender not found</div>
  }

  if (tender.status !== 'open') {
    return (
      <div className="px-4 py-20 text-center text-gray-400">
        This tender is not accepting bids
      </div>
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    submitMutation.mutate({
      tenderId,
      message: message.trim()
        ? { root: { children: [{ children: [{ text: message }], type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, type: 'root', version: 1 } }
        : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      validUntil: validUntil || undefined,
    })
  }

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-2xl mx-auto space-y-5">
      <button
        onClick={() => router.push(`/tenders/${tenderId}`)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </button>

      <div>
        <h1 className="text-xl font-bold">Submit Bid</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Responding to: <strong>{tender.title}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 border border-gray-200 rounded-xl bg-white p-5">
        <div className="space-y-1.5">
          <Label htmlFor="message">Proposal / Cover Message</Label>
          <Textarea
            id="message"
            placeholder="Describe your offering, experience, timeline..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Quoted Amount (optional)</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={100}
              placeholder="e.g. 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            <p className="text-[10px] text-gray-400">
              Informational only — no on-platform payment
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Quote Valid Until (optional)</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="elevated" className="bg-orange-400" disabled={submitMutation.isPending}>
            {submitMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Submit Bid
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
