'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-gray-100 text-gray-700 border-gray-300' },
  open: { label: 'Open', className: 'bg-green-100 text-green-700 border-green-300' },
  closed: { label: 'Closed', className: 'bg-blue-100 text-blue-700 border-blue-300' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-300' },
  // Bid statuses
  submitted: { label: 'Submitted', className: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  shortlisted: { label: 'Shortlisted', className: 'bg-green-100 text-green-700 border-green-300' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700 border-red-300' },
  withdrawn: { label: 'Withdrawn', className: 'bg-gray-100 text-gray-500 border-gray-300' },
}

export function TenderStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || { label: status, className: '' }
  return (
    <Badge variant="outline" className={cn('text-xs font-medium', config.className)}>
      {config.label}
    </Badge>
  )
}
