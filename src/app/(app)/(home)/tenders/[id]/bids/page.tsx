'use client'

import { useParams } from 'next/navigation'
import { TenderBidsView } from '@/modules/tenders/ui/views/tender-bids-view'

export default function TenderBidsPage() {
  const { id } = useParams<{ id: string }>()
  return <TenderBidsView tenderId={id} />
}
