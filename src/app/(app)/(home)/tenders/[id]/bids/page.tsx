import { TenderBidsView } from '@/modules/tenders/ui/views/tender-bids-view'

export const dynamic = 'force-dynamic'

export default async function TenderBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <TenderBidsView tenderId={id} />
}
