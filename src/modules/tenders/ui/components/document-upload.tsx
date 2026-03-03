'use client'

import { useState, useCallback } from 'react'
import { FileText, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
]
const MAX_SIZE_MB = 10

interface DocumentUploadProps {
  value: { file: string }[]
  onChange: (value: { file: string }[]) => void
  maxFiles?: number
}

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

export function DocumentUpload({
  value = [],
  onChange,
  maxFiles = 10,
}: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false)

  const loadFileMeta = useCallback(async (mediaId: string) => {
    try {
      const res = await fetch(`/api/media?ids=${mediaId}`)
      if (!res.ok) return null
      const data = await res.json()
      const doc = data.docs?.[0]
      return doc ? { url: doc.url, filename: doc.filename || 'Document' } : null
    } catch {
      return null
    }
  }, [])

  const [fileMeta, setFileMeta] = useState<Record<string, { url: string; filename: string }>>({})
  const [loadedIds, setLoadedIds] = useState<Set<string>>(new Set())

  const ensureMetaLoaded = useCallback(
    async (ids: string[]) => {
      const toLoad = ids.filter((id) => id && !loadedIds.has(id))
      if (toLoad.length === 0) return
      const updates: Record<string, { url: string; filename: string }> = {}
      for (const id of toLoad) {
        const meta = await loadFileMeta(id)
        if (meta) updates[id] = meta
      }
      setFileMeta((prev) => ({ ...prev, ...updates }))
      setLoadedIds((prev) => new Set([...prev, ...toLoad]))
    },
    [loadFileMeta, loadedIds],
  )

  if (value.length > 0) {
    const ids = value.map((d) => d.file).filter(Boolean)
    if (ids.some((id) => !loadedIds.has(id))) {
      ensureMetaLoaded(ids)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    if (value.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`)
      e.target.value = ''
      return
    }

    setIsUploading(true)
    const newDocs: { file: string }[] = []

    try {
      for (const file of files) {
        const isAllowed =
          file.type.startsWith('image/') ||
          file.type.startsWith('video/') ||
          ALLOWED_TYPES.includes(file.type)

        if (!isAllowed) {
          toast.error(`${file.name} has an unsupported file type`)
          continue
        }

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error(`${file.name} exceeds ${MAX_SIZE_MB}MB limit`)
          continue
        }

        const mediaId = await uploadFile(file)
        if (mediaId) {
          newDocs.push({ file: mediaId })
        }
      }

      if (newDocs.length > 0) {
        onChange([...value, ...newDocs])
        toast.success(`${newDocs.length} file(s) uploaded`)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      e.target.value = ''
    }
  }

  const removeDoc = (index: number) => {
    const next = value.filter((_, i) => i !== index)
    onChange(next)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((doc, i) => {
          const mediaId = doc.file
          const meta = fileMeta[mediaId]
          const url = meta?.url ?? '#'
          const filename = meta?.filename ?? `Document ${i + 1}`

          return (
            <div
              key={`${mediaId}-${i}`}
              className="flex items-center gap-2 px-2.5 py-1.5 border rounded-lg bg-gray-50 hover:bg-gray-100"
            >
              <FileText className="size-3.5 text-gray-500 shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs truncate max-w-[160px] hover:text-blue-600"
              >
                {filename}
              </a>
              <button
                type="button"
                onClick={() => removeDoc(i)}
                className="p-0.5 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600"
                aria-label="Remove"
              >
                <X className="size-3.5" />
              </button>
            </div>
          )
        })}
      </div>
      {value.length < maxFiles && (
        <div>
          <input
            type="file"
            id="document-upload"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/*,video/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={isUploading}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => document.getElementById('document-upload')?.click()}
            className="gap-1.5"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <FileText className="size-3.5" />
            )}
            {isUploading ? 'Uploading...' : 'Add document'}
          </Button>
          <p className="text-xs text-gray-500 mt-1">
            PDF, Word, Excel, TXT, images, videos. Max {MAX_SIZE_MB}MB per file.
          </p>
        </div>
      )}
    </div>
  )
}
