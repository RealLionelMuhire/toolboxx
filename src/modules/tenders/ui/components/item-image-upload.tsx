'use client'

import { useState, useEffect } from 'react'
import { ImageIcon, X, Loader2, Maximize2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ImageLightbox } from '@/components/image-lightbox'

const MAX_SIZE_MB = 5

async function uploadFile(file: File): Promise<string | null> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('alt', file.name.replace(/\.[^/.]+$/, '') || file.name)

  const res = await fetch('/api/media', {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Upload failed: ${res.status}`)
  }

  const data = await res.json()
  return data?.doc?.id ?? null
}

interface ItemImageUploadProps {
  value: string | null
  onChange: (mediaId: string | null) => void
  disabled?: boolean
}

export function ItemImageUpload({ value, onChange, disabled }: ItemImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null)
      return
    }
    let cancelled = false
    fetch(`/api/media?ids=${value}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data?.docs?.[0]?.url) setPreviewUrl(data.docs[0].url)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [value])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      e.target.value = ''
      return
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`Image must be under ${MAX_SIZE_MB}MB`)
      e.target.value = ''
      return
    }

    setIsUploading(true)
    try {
      const mediaId = await uploadFile(file)
      if (mediaId) {
        onChange(mediaId)
        toast.success('Image added')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="flex items-center gap-2">
      {value ? (
        <div className="flex items-center gap-1.5">
          {previewUrl && (
            <>
              <button
                type="button"
                onClick={() => setLightboxOpen(true)}
                className="relative group h-10 w-10 rounded border overflow-hidden focus:outline-none focus:ring-2 focus:ring-orange-400"
              >
                <img src={previewUrl} alt="Item" className="h-full w-full object-cover" />
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Maximize2 className="size-4 text-white" />
                </span>
              </button>
              <ImageLightbox
                images={[{ url: previewUrl, alt: 'Item image' }]}
                initialIndex={0}
                open={lightboxOpen}
                onOpenChange={setLightboxOpen}
              />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setPreviewUrl(null)
            }}
            className="p-0.5 hover:bg-red-100 rounded text-red-500"
            disabled={disabled}
            aria-label="Remove image"
          >
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <input
            type="file"
            id="item-image-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => document.getElementById('item-image-upload')?.click()}
            className="gap-1 shrink-0"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <ImageIcon className="size-3.5" />
            )}
            {isUploading ? '...' : 'Image'}
          </Button>
        </>
      )}
    </div>
  )
}
