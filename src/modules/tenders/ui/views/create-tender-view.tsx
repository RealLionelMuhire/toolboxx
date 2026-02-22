'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CreateTenderView() {
  const trpc = useTRPC()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<'rfq' | 'rfp'>('rfq')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [responseDeadline, setResponseDeadline] = useState('')
  const [contactPreference, setContactPreference] = useState<'email' | 'phone' | 'chat'>('email')

  const session = useQuery({
    ...trpc.auth.session.queryOptions(),
    staleTime: 0,
    refetchOnMount: 'always',
  })

  const { data: categories } = useQuery(trpc.categories.getMany.queryOptions())

  const isLoggedIn = !!session.data?.user

  const createMutation = useMutation(
    trpc.tenders.create.mutationOptions({
      onSuccess: (data) => {
        toast.success('Tender created as draft')
        router.push(`/tenders/${data.id}`)
      },
      onError: (err) => {
        toast.error(err.message || 'Failed to create tender')
      },
    }),
  )

  if (!isLoggedIn && session.isFetched) {
    router.push('/sign-in?redirect=/tenders/new')
    return null
  }

  const handleToggleCategory = (catId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId],
    )
  }

  // Flatten categories + subcategories for the picker, skip the virtual "All"
  const allCategories = (categories || []).flatMap((cat: any) => {
    if (cat.id === 'all') return []
    const subs = (cat.subcategories || []).map((sub: any) => ({
      id: sub.id,
      name: `${cat.name} / ${sub.name}`,
    }))
    return [{ id: cat.id, name: cat.name }, ...subs]
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required')
      return
    }

    if (selectedCategories.length === 0) {
      toast.error('Select at least one category so relevant vendors are notified')
      return
    }

    createMutation.mutate({
      title: title.trim(),
      description: { root: { children: [{ children: [{ text: description }], type: 'paragraph', version: 1 }], direction: null, format: '', indent: 0, type: 'root', version: 1 } },
      type,
      category: selectedCategories,
      responseDeadline: responseDeadline || undefined,
      contactPreference,
    })
  }

  return (
    <div className="px-2 sm:px-4 lg:px-12 py-4 md:py-8 max-w-2xl mx-auto">
      <h1 className="text-xl sm:text-2xl font-bold mb-1">Create Tender</h1>
      <p className="text-sm text-gray-500 mb-6">
        Create a Request for Quotation (RFQ) or Request for Proposal (RFP).
        It will start as a draft — publish it when ready.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="title">Title *</Label>
          <Input
            id="title"
            placeholder="e.g. Supply of Office Furniture"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description / Requirements *</Label>
          <Textarea
            id="description"
            placeholder="Describe what you need, specifications, quantities, delivery expectations..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={6}
          />
        </div>

        {/* Category picker */}
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <p className="text-xs text-gray-400">Only vendors with products in these categories will be notified</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {allCategories.map((cat: any) => {
              const selected = selectedCategories.includes(cat.id)
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleToggleCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full border text-xs transition-colors ${
                    selected
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {cat.name}
                  {selected && <X className="size-3 ml-1 inline" />}
                </button>
              )
            })}
          </div>
          {selectedCategories.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">{selectedCategories.length} selected</p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as 'rfq' | 'rfp')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rfq">Request for Quotation (RFQ)</SelectItem>
                <SelectItem value="rfp">Request for Proposal (RFP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Contact Preference</Label>
            <Select value={contactPreference} onValueChange={(v) => setContactPreference(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="chat">In-App Chat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="deadline">Response Deadline (optional)</Label>
          <Input
            id="deadline"
            type="datetime-local"
            value={responseDeadline}
            onChange={(e) => setResponseDeadline(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending && <Loader2 className="size-4 animate-spin mr-1.5" />}
            Create Draft
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}
