import { TenderDetailView } from '@/modules/tenders/ui/views/tender-detail-view'

export const dynamic = 'force-dynamic'

export default async function TenderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TenderDetailView tenderId={id} />
}
