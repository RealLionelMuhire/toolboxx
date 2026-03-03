'use client'

import { useParams } from 'next/navigation'
import { EditTenderView } from '@/modules/tenders/ui/views/edit-tender-view'

export default function EditTenderPage() {
  const { id } = useParams<{ id: string }>()
  return <EditTenderView tenderId={id} />
}
