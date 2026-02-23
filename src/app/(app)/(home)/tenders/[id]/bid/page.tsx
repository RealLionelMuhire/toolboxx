'use client'

import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

const SubmitBidView = dynamic(
  () => import('@/modules/tenders/ui/views/submit-bid-view').then((m) => m.SubmitBidView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function SubmitBidPage() {
  const params = useParams<{ id: string }>()
  return <SubmitBidView tenderId={params.id} />
}
