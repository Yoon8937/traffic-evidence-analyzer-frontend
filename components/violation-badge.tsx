import { AlertTriangle, CircleCheck, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Analysis } from '@/lib/types'

export function ViolationBadge({
  analysis,
  className,
}: {
  analysis: Analysis
  className?: string
}) {
  if (analysis.status !== 'COMPLETED' || !analysis.result) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground',
          className,
        )}
      >
        <MinusCircle className="size-3.5" />
        판독 전
      </span>
    )
  }

  if (analysis.result.violation) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 ring-1 ring-red-200',
          className,
        )}
      >
        <AlertTriangle className="size-3.5" />
        위반 검출
      </span>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200',
        className,
      )}
    >
      <CircleCheck className="size-3.5" />
      위반 없음
    </span>
  )
}
