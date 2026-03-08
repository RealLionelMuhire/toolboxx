'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { useTRPC } from '@/trpc/client'
import { useQuery } from '@tanstack/react-query'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface ProductSearchResult {
  id: string
  name: string
  unit: string
  image?: string | null
}

interface ProductSearchInputProps {
  value: string
  placeholder?: string
  onChange: (name: string, productId?: string, unit?: string, imageId?: string | null) => void
  disabled?: boolean
  className?: string
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])
  return debouncedValue
}

export function ProductSearchInput({ value, placeholder, onChange, disabled, className }: ProductSearchInputProps) {
  const trpc = useTRPC()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const debouncedQuery = useDebounce(searchQuery, 300)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverInputRef = useRef<HTMLInputElement>(null)

  const { data: results, isFetching } = useQuery({
    ...trpc.products.searchAutocomplete.queryOptions({
      search: debouncedQuery,
      limit: 10,
    }),
    enabled: open && debouncedQuery.length >= 2,
  })

  useEffect(() => {
    if (open) {
      setSearchQuery('')
      setTimeout(() => popoverInputRef.current?.focus(), 50)
    }
  }, [open])

  const handleSelect = (product: ProductSearchResult) => {
    onChange(product.name, product.id, product.unit || 'unit', product.image ?? null)
    setOpen(false)
  }

  return (
    <div className={cn('flex gap-1', className)}>
      <Input
        ref={inputRef}
        placeholder={placeholder ?? 'Product / item name'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="flex-1 min-w-[100px]"
      />
      <Popover open={open} onOpenChange={setOpen} modal={false}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 touch-manipulation select-none"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            disabled={disabled}
            aria-label="Search catalog"
          >
            <Search className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 p-2 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-1 duration-75"
          sideOffset={4}
        >
          <Input
            ref={popoverInputRef}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-2"
          />
          <div className="max-h-48 overflow-y-auto">
            {debouncedQuery.length < 2 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Type 2+ characters to search</p>
            ) : isFetching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : results && results.length > 0 ? (
              <div className="space-y-0.5">
                {results.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="w-full text-left px-2 py-1.5 rounded hover:bg-gray-100 text-sm"
                    onClick={() => handleSelect(product)}
                  >
                    <span className="font-medium">{product.name}</span>
                    <span className="text-muted-foreground ml-2">({product.unit})</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center">No products found</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
