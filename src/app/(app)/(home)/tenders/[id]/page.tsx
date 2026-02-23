'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const TenderDetailView = dynamic(
  () => import('@/modules/tenders/ui/views/tender-detail-view').then((m) => m.TenderDetailView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function TenderDetailPage() {
  const params = useParams<{ id: string }>()
  return <TenderDetailView tenderId={params.id} />
}
