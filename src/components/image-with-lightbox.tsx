'use client'

import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { ImageLightbox } from './image-lightbox'

interface ImageWithLightboxProps {
  src: string
  alt?: string
  className?: string
}

export function ImageWithLightbox({ src, alt = '', className = 'h-10 w-10 object-cover rounded border' }: ImageWithLightboxProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative group inline-block focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 rounded overflow-hidden"
      >
        <img src={src} alt={alt} className={className} />
        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Maximize2 className="size-4 text-white" />
        </span>
      </button>
      <ImageLightbox
        images={[{ url: src, alt: alt || 'Image' }]}
        initialIndex={0}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
