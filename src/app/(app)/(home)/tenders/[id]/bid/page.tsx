import { SubmitBidView } from '@/modules/tenders/ui/views/submit-bid-view'

export const dynamic = 'force-dynamic'

export default async function SubmitBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <SubmitBidView tenderId={id} />
}
