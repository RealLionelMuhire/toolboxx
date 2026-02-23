'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const TendersListView = dynamic(
  () => import('@/modules/tenders/ui/views/tenders-list-view').then((m) => m.TendersListView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function TendersPage() {
  return <TendersListView />
}
