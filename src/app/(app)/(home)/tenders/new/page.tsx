'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const CreateTenderView = dynamic(
  () => import('@/modules/tenders/ui/views/create-tender-view').then((m) => m.CreateTenderView),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <Loader2 className="size-6 animate-spin text-gray-400" />
      </div>
    ),
  },
)

export default function NewTenderPage() {
  return <CreateTenderView />
}
