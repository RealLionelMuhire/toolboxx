'use client'

import { Badge } from '@/components/ui/badge'

export function TenderTypeBadge({ type }: { type: string }) {
  return (
    <Badge variant="secondary" className="text-xs font-medium">
      {type === 'rfq' ? 'RFQ' : 'RFP'}
    </Badge>
  )
}
