'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, ChevronDownIcon, ChevronRightIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { getIconByName } from '@/components/admin/icon-picker'
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
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

  // Build parent→subcategory tree (same logic as filters sidebar)
  const categoryOptions = useMemo(() => {
    if (!categories) return []
    const parents: Array<{
      id: string; name: string; slug: string; icon?: string
      subcategories: Array<{ id: string; name: string; slug: string; icon?: string }>
    }> = []

    categories.forEach((cat: any) => {
      if (cat.slug === 'all') return
      const rawSubs = Array.isArray(cat.subcategories)
        ? cat.subcategories
        : (cat.subcategories?.docs ?? [])
      parents.push({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        icon: cat.icon,
        subcategories: rawSubs.map((s: any) => ({ id: s.id, name: s.name, slug: s.slug, icon: s.icon })),
      })
    })

    parents.sort((a, b) => {
      if (a.name.toLowerCase() === 'others' || a.name.toLowerCase() === 'other') return 1
      if (b.name.toLowerCase() === 'others' || b.name.toLowerCase() === 'other') return -1
      return a.name.localeCompare(b.name)
    })
    return parents
  }, [categories])

  const toggleCategory = (categoryId: string, isParent: boolean, subcategoryIds?: string[]) => {
    let next: string[]

    if (isParent) {
      if (subcategoryIds && subcategoryIds.length > 0) {
        const allIds = [categoryId, ...subcategoryIds]
        const allSelected = allIds.every((id) => selectedCategories.includes(id))
        const someSubsSelected = subcategoryIds.some((id) => selectedCategories.includes(id))

        if (someSubsSelected && !allSelected) {
          next = [...new Set([...selectedCategories, categoryId])]
        } else if (allSelected) {
          next = selectedCategories.filter((id) => !allIds.includes(id))
        } else {
          next = [...new Set([...selectedCategories, ...allIds])]
          setExpandedCategories((prev) => new Set([...prev, categoryId]))
        }
      } else {
        next = selectedCategories.includes(categoryId)
          ? selectedCategories.filter((id) => id !== categoryId)
          : [...selectedCategories, categoryId]
      }
    } else {
      const parentOption = categoryOptions.find((p) => p.subcategories.some((s) => s.id === categoryId))
      if (parentOption) {
        const allSubIds = parentOption.subcategories.map((s) => s.id)
        const allSubsSelected = allSubIds.every((id) => selectedCategories.includes(id))

        if (allSubsSelected) {
          const withoutSiblings = selectedCategories.filter((id) => !allSubIds.includes(id))
          next = [...new Set([...withoutSiblings, parentOption.id, categoryId])]
        } else if (selectedCategories.includes(categoryId)) {
          next = selectedCategories.filter((id) => id !== categoryId)
          const remaining = allSubIds.filter((id) => next.includes(id))
          if (remaining.length === 0) {
            next = next.filter((id) => id !== parentOption.id)
          }
        } else {
          next = [...new Set([...selectedCategories, parentOption.id, categoryId])]
          setExpandedCategories((prev) => new Set([...prev, parentOption.id]))
        }
      } else {
        next = selectedCategories.includes(categoryId)
          ? selectedCategories.filter((id) => id !== categoryId)
          : [...selectedCategories, categoryId]
      }
    }

    setSelectedCategories(next)
  }

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const n = new Set(prev)
      n.has(categoryId) ? n.delete(categoryId) : n.add(categoryId)
      return n
    })
  }

  if (!isLoggedIn && session.isFetched) {
    router.push('/sign-in?redirect=/tenders/new')
    return null
  }

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

        {/* Category picker — mirrors the Filters sidebar style */}
        <div className="space-y-1.5">
          <Label>Category *</Label>
          <p className="text-xs text-gray-400">Only vendors with products in these categories will be notified</p>
          <div className="border rounded-md bg-white mt-1">
            {categoryOptions.length === 0 ? (
              <div className="text-sm text-gray-500 text-center py-4">Loading categories...</div>
            ) : (
              <div className="space-y-0.5 max-h-72 overflow-y-auto p-2">
                {categoryOptions.map((parent) => {
                  const subcatIds = parent.subcategories.map((s) => s.id)
                  const isExpanded = expandedCategories.has(parent.id)
                  const isParentSelected = selectedCategories.includes(parent.id)
                  const allSubsSelected = subcatIds.length > 0 && subcatIds.every((id) => selectedCategories.includes(id))
                  const someSubsSelected = subcatIds.length > 0 && subcatIds.some((id) => selectedCategories.includes(id)) && !allSubsSelected
                  const isParentDisabled = someSubsSelected

                  const ParentIcon = getIconByName(parent.icon)

                  return (
                    <div key={parent.id} className="space-y-0.5">
                      <div className="flex items-center space-x-2 hover:bg-gray-50 rounded px-1 py-1">
                        {parent.subcategories.length > 0 ? (
                          <button
                            type="button"
                            onClick={() => toggleExpanded(parent.id)}
                            className="p-0.5 hover:bg-gray-200 rounded"
                          >
                            {isExpanded ? (
                              <ChevronDownIcon className="h-3.5 w-3.5" />
                            ) : (
                              <ChevronRightIcon className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : (
                          <div className="w-5" />
                        )}
                        <Checkbox
                          id={`tcat-${parent.id}`}
                          checked={isParentSelected || allSubsSelected}
                          disabled={isParentDisabled}
                          className={someSubsSelected ? 'data-[state=checked]:bg-orange-300' : ''}
                          onCheckedChange={() => toggleCategory(parent.id, true, subcatIds)}
                        />
                        <Label
                          htmlFor={`tcat-${parent.id}`}
                          className="cursor-pointer text-sm font-medium flex-1 flex items-center gap-2"
                        >
                          {ParentIcon && <ParentIcon className="h-4 w-4" />}
                          <span>{parent.name}</span>
                        </Label>
                      </div>

                      {isExpanded && parent.subcategories.length > 0 && (
                        <div className="ml-8 space-y-0.5 border-l-2 border-gray-200 pl-3">
                          {parent.subcategories.map((sub) => {
                            const SubIcon = getIconByName(sub.icon)
                            return (
                              <div key={sub.id} className="flex items-center space-x-2 hover:bg-gray-50 rounded px-1 py-0.5">
                                <Checkbox
                                  id={`tcat-${sub.id}`}
                                  checked={selectedCategories.includes(sub.id)}
                                  onCheckedChange={() => toggleCategory(sub.id, false)}
                                />
                                <Label
                                  htmlFor={`tcat-${sub.id}`}
                                  className="cursor-pointer text-sm font-normal text-gray-700 flex-1 flex items-center gap-2"
                                >
                                  {SubIcon && <SubIcon className="h-4 w-4 opacity-70" />}
                                  <span>{sub.name}</span>
                                </Label>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
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
          <Button type="submit" variant="elevated" className="bg-orange-400" disabled={createMutation.isPending}>
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
