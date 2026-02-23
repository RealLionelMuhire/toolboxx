'use client'

import { useParams } from 'next/navigation'
import { SubmitBidView } from '@/modules/tenders/ui/views/submit-bid-view'

export default function SubmitBidPage() {
  const { id } = useParams<{ id: string }>()
  return <SubmitBidView tenderId={id} />
}
