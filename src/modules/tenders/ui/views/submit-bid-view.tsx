'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { DocumentUpload } from '../components/document-upload'

type LineItemState = { price: string; quantity: string; specification: string; location: string }

export function SubmitBidView({ tenderId }: { tenderId: string }) {
  const trpc = useTRPC()
  const router = useRouter()
  const [message, setMessage] = useState('')
  const [amount, setAmount] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [documents, setDocuments] = useState<{ file: string }[]>([])
  const [lineItems, setLineItems] = useState<LineItemState[]>([])
  const [useDefaultLocation, setUseDefaultLocation] = useState(false)

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: tender, isLoading: tenderLoading } = useQuery({
    ...trpc.tenders.getById.queryOptions({ id: tenderId }),
    enabled: !!session.data?.user,
  })

  const { data: myBid, isLoading: bidLoading } = useQuery({
    ...trpc.tenders.getMyBidForTender.queryOptions({ tenderId }),
    enabled: !!session.data?.user && !!tenderId,
  })

  const { data: currentTenant } = useQuery({
    ...trpc.tenants.getCurrentTenant.queryOptions(),
    enabled: !!session.data?.user,
    retry: false,
  })

  const defaultLocation = (currentTenant as any)?.location ?? ''

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

  const updateMutation = useMutation(
    trpc.tenders.updateBid.mutationOptions({
      onSuccess: () => {
        toast.success('Bid updated')
        router.push(`/tenders/${tenderId}`)
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to update bid')
      },
    }),
  )

  const isEditMode = !!myBid
  const tenderItems = useMemo(() => (tender?.items as any[]) ?? [], [tender?.items])

  // Prefill form when editing existing bid
  useEffect(() => {
    if (!isEditMode || !myBid) return
    const bid = myBid as any
    if (bid.message != null) {
      const root = bid.message?.root
      if (root?.children?.length) {
        const text = root.children.map((p: any) => p.children?.map((c: any) => c.text).join('')).join('\n')
        setMessage(text || '')
      } else setMessage('')
    }
    setAmount(bid.amount != null ? String(bid.amount) : '')
    setValidUntil(bid.validUntil ? new Date(bid.validUntil).toISOString().slice(0, 10) : '')
    const docs = (bid.documents as any[]) ?? []
    setDocuments(docs.map((d: any) => ({ file: typeof d.file === 'string' ? d.file : d.file?.id })).filter((d: any) => d.file))
  }, [isEditMode, myBid?.id])

  // Initialize lineItems from tender items count or from existing bid
  useEffect(() => {
    if (!tender) return
    const items = tenderItems
    if (items.length === 0) {
      setLineItems([])
      return
    }
    if (isEditMode && myBid?.lineItems && Array.isArray(myBid.lineItems)) {
      const existing = myBid.lineItems as { price?: number; quantity?: number; specification?: string; location?: string }[]
      setLineItems(
        items.map((_: any, i: number) => {
          const row = existing[i]
          return {
            price: row?.price != null ? String(row.price) : '',
            quantity: row?.quantity != null ? String(row.quantity) : '',
            specification: row?.specification ?? '',
            location: row?.location ?? '',
          }
        }),
      )
    } else {
      setLineItems(
        items.map((item: any) => ({
          price: '',
          quantity: item.quantity != null ? String(item.quantity) : '',
          specification: item.specification ?? '',
          location: '',
        })),
      )
    }
  }, [tender?.id, tenderItems.length, isEditMode, myBid?.id])

  // When "use default location" is checked, fill all locations
  useEffect(() => {
    if (!useDefaultLocation || !defaultLocation) return
    setLineItems((prev) => prev.map((row) => ({ ...row, location: defaultLocation })))
  }, [useDefaultLocation, defaultLocation])

  if (tenderLoading || !session.isFetched || (isEditMode && bidLoading)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!tender) {
    return <div className="px-4 py-20 text-center text-gray-400">Tender not found</div>
  }

  if (!isEditMode && tender.status !== 'open') {
    return (
      <div className="px-4 py-20 text-center text-gray-400">
        This tender is not accepting bids
      </div>
    )
  }

  if (isEditMode && tender.status !== 'draft' && tender.status !== 'open') {
    return (
      <div className="px-4 py-20 text-center text-gray-400">
        This tender is closed; you can no longer edit your bid.
      </div>
    )
  }

  const setLineItem = (index: number, field: keyof LineItemState, value: string) => {
    setLineItems((prev) => {
      const next = [...prev]
      if (next[index]) next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const tenderCurrency = (tender as any).currency ?? 'USD'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const payload = {
      message: message.trim()
        ? { root: { children: [{ children: [{ text: message }], type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, type: 'root', version: 1 } }
        : undefined,
      documents: documents.length > 0 ? documents : undefined,
      amount: amount ? parseFloat(amount) : undefined,
      currency: tenderCurrency,
      validUntil: validUntil || undefined,
      lineItems:
        tenderItems.length > 0
          ? lineItems.map((row) => ({
              price: parseFloat(row.price) || 0,
              quantity: parseFloat(row.quantity) || 0.001,
              specification: row.specification || undefined,
              location: (row.location?.trim() || defaultLocation) || undefined,
            }))
          : undefined,
    }

    if (isEditMode && myBid) {
      updateMutation.mutate({ bidId: myBid.id, ...payload })
    } else {
      submitMutation.mutate({ tenderId, ...payload })
    }
  }

  const pending = submitMutation.isPending || updateMutation.isPending

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-4xl mx-auto space-y-5">
      <Link
        href={`/tenders/${tenderId}`}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="size-4" /> Back to tender
      </Link>

      <div>
        <h1 className="text-xl font-bold">{isEditMode ? 'Update your bid' : 'Submit Bid'}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Responding to: <strong>{tender.title}</strong>
        </p>
        {isEditMode && (
          <p className="text-xs text-gray-500 mt-1">
            You're editing your existing bid. Changes replace your previous submission; the buyer will see this version only.
          </p>
        )}
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

        <div className="space-y-1.5">
          <Label>Attachments (optional)</Label>
          <DocumentUpload value={documents} onChange={setDocuments} maxFiles={10} />
        </div>

        {tenderItems.length > 0 && (
          <>
            <div>
              <Label className="mb-2 block">Tender items (buyer requirements)</Label>
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

            <div>
              <Label className="mb-2 block">Your offering per line</Label>
              <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
                <table className="w-full min-w-[600px] border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-50 text-left text-sm">
                      <th className="p-2 font-medium">Price</th>
                      <th className="p-2 font-medium">Quantity</th>
                      <th className="p-2 font-medium">Specification</th>
                      <th className="p-2 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((row, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            className="h-8 w-full min-w-0"
                            value={row.price}
                            onChange={(e) => setLineItem(i, 'price', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={0.001}
                            step={0.001}
                            className="h-8 w-full min-w-0"
                            value={row.quantity}
                            onChange={(e) => setLineItem(i, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 w-full min-w-0"
                            value={row.specification}
                            onChange={(e) => setLineItem(i, 'specification', e.target.value)}
                            placeholder="Your spec"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-8 w-full min-w-0"
                            value={row.location}
                            onChange={(e) => setLineItem(i, 'location', e.target.value)}
                            placeholder="Location"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {defaultLocation && (
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    id="defaultLoc"
                    checked={useDefaultLocation}
                    onCheckedChange={(v) => setUseDefaultLocation(!!v)}
                  />
                  <Label htmlFor="defaultLoc" className="text-sm font-normal cursor-pointer">
                    Use my default location ({defaultLocation})
                  </Label>
                </div>
              )}
            </div>
          </>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="amount">Total amount</Label>
            <Input
              id="amount"
              type="number"
              min={0}
              step={100}
              placeholder="e.g. 500000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
              {tenderCurrency}
            </div>
            <p className="text-[10px] text-gray-400">Set by the buyer; you quote in this currency.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="validUntil">Quote valid until (optional)</Label>
            <Input
              id="validUntil"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>
        <p className="text-[10px] text-gray-400">
          Informational only — no on-platform payment.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="elevated" className="bg-orange-400" disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            {isEditMode ? 'Update bid' : 'Submit bid'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
