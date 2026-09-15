'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CircleCheck,
  Loader2,
  Upload,
  Video,
} from 'lucide-react'
import { useCurrentUser, useStore } from '@/lib/mock-store'
import { formatRelative } from '@/lib/format'
import type { Analysis } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { StatusBadge } from '@/components/status-badge'
import { ViolationBadge } from '@/components/violation-badge'
import { cn } from '@/lib/utils'

export default function DashboardPage() {
  const { analyses } = useStore()
  const user = useCurrentUser()

  const mine = useMemo(
    () =>
      analyses
        .filter((a) => a.userId === user?.id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [analyses, user?.id],
  )

  const stats = useMemo(() => {
    const total = mine.length
    const violations = mine.filter(
      (a) => a.status === 'COMPLETED' && a.result?.violation,
    ).length
    const clean = mine.filter(
      (a) => a.status === 'COMPLETED' && a.result && !a.result.violation,
    ).length
    const active = mine.filter(
      (a) => a.status === 'PENDING' || a.status === 'PROCESSING',
    ).length
    return { total, violations, clean, active }
  }, [mine])

  const recent = mine.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">대시보드</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {user?.name}님, 신호위반 분석 현황을 확인하세요.
          </p>
        </div>
        <Button size="lg" nativeButton={false} render={<Link href="/upload" />}>
          <Upload className="size-4" />새 영상 분석
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="전체 분석"
          value={stats.total}
          icon={<Video className="size-5" />}
          tone="neutral"
        />
        <StatCard
          label="위반 검출"
          value={stats.violations}
          icon={<AlertTriangle className="size-5" />}
          tone="danger"
        />
        <StatCard
          label="위반 없음"
          value={stats.clean}
          icon={<CircleCheck className="size-5" />}
          tone="success"
        />
        <StatCard
          label="처리 중"
          value={stats.active}
          icon={<Loader2 className={cn('size-5', stats.active > 0 && 'animate-spin')} />}
          tone="info"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle>최근 분석</CardTitle>
            <CardDescription>가장 최근에 업로드한 영상입니다.</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false} render={<Link href="/history" />}
          >
            전체 보기
            <ArrowRight className="size-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <EmptyState />
          ) : (
            <ul className="divide-y divide-border">
              {recent.map((a) => (
                <RecentRow key={a.id} analysis={a} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ReactNode
  tone: 'neutral' | 'danger' | 'success' | 'info'
}) {
  const tones: Record<typeof tone, string> = {
    neutral: 'bg-muted text-foreground',
    danger: 'bg-red-50 text-red-600',
    success: 'bg-emerald-50 text-emerald-600',
    info: 'bg-blue-50 text-blue-600',
  }
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </div>
        <div
          className={cn(
            'flex size-11 items-center justify-center rounded-xl',
            tones[tone],
          )}
        >
          {icon}
        </div>
      </CardContent>
    </Card>
  )
}

function RecentRow({ analysis }: { analysis: Analysis }) {
  const href =
    analysis.status === 'COMPLETED'
      ? `/analysis/${analysis.id}/result`
      : `/analysis/${analysis.id}`
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-4 py-3 transition-colors hover:bg-muted/40 -mx-2 rounded-lg px-2"
      >
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Video className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{analysis.fileName}</p>
          <p className="truncate text-xs text-muted-foreground">
            {analysis.location} · {formatRelative(analysis.createdAt)}
          </p>
        </div>
        <div className="hidden sm:block">
          <ViolationBadge analysis={analysis} />
        </div>
        <StatusBadge status={analysis.status} />
      </Link>
    </li>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Video className="size-6" />
      </div>
      <div>
        <p className="text-sm font-medium">아직 분석한 영상이 없습니다.</p>
        <p className="text-sm text-muted-foreground">
          첫 번째 교통 영상을 업로드해 분석을 시작하세요.
        </p>
      </div>
      <Button nativeButton={false} render={<Link href="/upload" />}>
        <Upload className="size-4" />
        영상 업로드
      </Button>
    </div>
  )
}
