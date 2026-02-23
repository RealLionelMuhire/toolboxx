'use client'

import { useParams } from 'next/navigation'
import { TenderDetailView } from '@/modules/tenders/ui/views/tender-detail-view'

export default function TenderDetailPage() {
  const { id } = useParams<{ id: string }>()
  return <TenderDetailView tenderId={id} />
}
