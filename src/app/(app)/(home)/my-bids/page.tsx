'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const MyBidsView = dynamic(
  () => import('@/modules/tenders/ui/views/my-bids-view').then((m) => m.MyBidsView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function MyBidsPage() {
  return <MyBidsView />
}
