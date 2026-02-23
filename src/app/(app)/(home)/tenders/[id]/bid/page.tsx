import { DynamicSubmitBidView } from '@/modules/tenders/ui/components/dynamic-views'

export const dynamic = 'force-dynamic'

export default async function SubmitBidPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <DynamicSubmitBidView tenderId={id} />
}
