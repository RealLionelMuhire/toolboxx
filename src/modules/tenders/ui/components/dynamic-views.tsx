'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const Spinner = () => (
  <div className="flex justify-center py-20">
    <Loader2 className="size-6 animate-spin text-gray-400" />
  </div>
)

export const DynamicTendersListView = dynamic(
  () => import('../views/tenders-list-view').then((m) => m.TendersListView),
  { ssr: false, loading: Spinner },
)

export const DynamicCreateTenderView = dynamic(
  () => import('../views/create-tender-view').then((m) => m.CreateTenderView),
  { ssr: false, loading: Spinner },
)

export const DynamicTenderDetailView = dynamic(
  () => import('../views/tender-detail-view').then((m) => m.TenderDetailView),
  { ssr: false, loading: Spinner },
)

export const DynamicSubmitBidView = dynamic(
  () => import('../views/submit-bid-view').then((m) => m.SubmitBidView),
  { ssr: false, loading: Spinner },
)

export const DynamicTenderBidsView = dynamic(
  () => import('../views/tender-bids-view').then((m) => m.TenderBidsView),
  { ssr: false, loading: Spinner },
)

export const DynamicMyBidsView = dynamic(
  () => import('../views/my-bids-view').then((m) => m.MyBidsView),
  { ssr: false, loading: Spinner },
)
