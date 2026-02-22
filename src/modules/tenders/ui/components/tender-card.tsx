'use client'

import Link from 'next/link'
import { Calendar, FileText, User } from 'lucide-react'
import { TenderStatusBadge } from './tender-status-badge'
import { TenderTypeBadge } from './tender-type-badge'

interface TenderCardProps {
  id: string
  title: string
  tenderNumber?: string
  type: string
  status: string
  createdBy?: { username?: string; email?: string } | string
  tenant?: { name?: string } | string | null
  responseDeadline?: string | null
  bidCount?: number
  createdAt?: string
}

export function TenderCard({
  id,
  title,
  tenderNumber,
  type,
  status,
  createdBy,
  tenant,
  responseDeadline,
  bidCount = 0,
  createdAt,
}: TenderCardProps) {
  const creatorName =
    typeof createdBy === 'object' && createdBy
      ? createdBy.username || createdBy.email || 'Unknown'
      : 'Unknown'

  const tenantName =
    typeof tenant === 'object' && tenant ? tenant.name : null

  const isDeadlinePassed = responseDeadline
    ? new Date(responseDeadline) < new Date()
    : false

  return (
    <Link
      href={`/tenders/${id}`}
      className="block border border-gray-200 rounded-xl bg-white p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm sm:text-base font-semibold line-clamp-2 flex-1">
          {title}
        </h3>
        <div className="flex items-center gap-1.5 shrink-0">
          <TenderTypeBadge type={type} />
          <TenderStatusBadge status={status} />
        </div>
      </div>

      {tenderNumber && (
        <p className="text-xs text-gray-400 mb-2 font-mono">{tenderNumber}</p>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <User className="size-3" />
          {creatorName}
          {tenantName && (
            <span className="text-gray-400">({tenantName})</span>
          )}
        </span>

        {responseDeadline && (
          <span
            className={`flex items-center gap-1 ${isDeadlinePassed ? 'text-red-500' : ''}`}
          >
            <Calendar className="size-3" />
            {isDeadlinePassed ? 'Expired' : 'Due'}{' '}
            {new Date(responseDeadline).toLocaleDateString()}
          </span>
        )}

        <span className="flex items-center gap-1">
          <FileText className="size-3" />
          {bidCount} bid{bidCount !== 1 ? 's' : ''}
        </span>

        {createdAt && (
          <span className="text-gray-400">
            {new Date(createdAt).toLocaleDateString()}
          </span>
        )}
      </div>
    </Link>
  )
}
