import { CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AnalysisStatus } from '@/lib/types'

interface StatusMeta {
  label: string
  icon: LucideIcon
  dot: string
  className: string
  spin?: boolean
}

export const STATUS_META: Record<AnalysisStatus, StatusMeta> = {
  PENDING: {
    label: '대기 중',
    icon: Clock,
    dot: 'bg-amber-500',
    className: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  },
  PROCESSING: {
    label: '분석 중',
    icon: Loader2,
    dot: 'bg-blue-500',
    className: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
    spin: true,
  },
  COMPLETED: {
    label: '완료',
    icon: CheckCircle2,
    dot: 'bg-emerald-500',
    className: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  },
  FAILED: {
    label: '실패',
    icon: XCircle,
    dot: 'bg-red-500',
    className: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  },
}

export function StatusBadge({
  status,
  className,
}: {
  status: AnalysisStatus
  className?: string
}) {
  const meta = STATUS_META[status]
  const Icon = meta.icon
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        meta.className,
        className,
      )}
    >
      <Icon className={cn('size-3.5', meta.spin && 'animate-spin')} />
      {meta.label}
    </span>
  )
}
