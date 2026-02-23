'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const TenderBidsView = dynamic(
  () => import('@/modules/tenders/ui/views/tender-bids-view').then((m) => m.TenderBidsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function TenderBidsPage() {
  const params = useParams<{ id: string }>()
  return <TenderBidsView tenderId={params.id} />
}
