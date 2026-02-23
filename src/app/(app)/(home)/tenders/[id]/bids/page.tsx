import { DynamicTenderBidsView } from '@/modules/tenders/ui/components/dynamic-views'

export const dynamic = 'force-dynamic'

export default async function TenderBidsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DynamicTenderBidsView tenderId={id} />
}
