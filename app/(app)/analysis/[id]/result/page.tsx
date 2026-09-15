'use client'

import { useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Car,
  CircleCheck,
  Gauge,
  Hash,
  MapPin,
  ShieldAlert,
  TrafficCone,
} from 'lucide-react'
import { useStore } from '@/lib/mock-store'
import { formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { SignalState } from '@/lib/types'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const SIGNAL_META: Record<
  SignalState,
  { label: string; dot: string; text: string }
> = {
  RED: { label: '적색', dot: 'bg-red-500', text: 'text-red-600' },
  YELLOW: { label: '황색', dot: 'bg-amber-500', text: 'text-amber-600' },
  GREEN: { label: '녹색', dot: 'bg-emerald-500', text: 'text-emerald-600' },
}

export default function AnalysisResultPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { analyses } = useStore()

  const analysis = useMemo(
    () => analyses.find((a) => a.id === params.id) ?? null,
    [analyses, params.id],
  )

  useEffect(() => {
    if (analysis && analysis.status !== 'COMPLETED') {
      router.replace(`/analysis/${analysis.id}`)
    }
  }, [analysis, router])

  if (!analysis || !analysis.result || analysis.status !== 'COMPLETED') {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-lg font-semibold">결과를 불러오는 중입니다…</p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/history" />}>
          분석 내역으로
        </Button>
      </div>
    )
  }

  const r = analysis.result
  const violation = r.violation

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          aria-label="뒤로"
          onClick={() => router.push('/history')}
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">분석 결과</h2>
          <p className="text-sm text-muted-foreground">{analysis.fileName}</p>
        </div>
      </div>

      {/* Verdict banner */}
      <div
        className={cn(
          'flex flex-col items-start gap-4 rounded-xl border p-6 sm:flex-row sm:items-center sm:justify-between',
          violation
            ? 'border-red-200 bg-red-50'
            : 'border-emerald-200 bg-emerald-50',
        )}
      >
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'flex size-14 shrink-0 items-center justify-center rounded-full',
              violation
                ? 'bg-red-100 text-red-600'
                : 'bg-emerald-100 text-emerald-600',
            )}
          >
            {violation ? (
              <ShieldAlert className="size-7" />
            ) : (
              <CircleCheck className="size-7" />
            )}
          </div>
          <div>
            <p
              className={cn(
                'text-xl font-bold',
                violation ? 'text-red-700' : 'text-emerald-700',
              )}
            >
              {violation ? '신호 위반 검출됨' : '위반 사항 없음'}
            </p>
            <p
              className={cn(
                'mt-0.5 text-sm',
                violation ? 'text-red-600/80' : 'text-emerald-600/80',
              )}
            >
              {violation
                ? r.violationType
                : '해당 차량은 신호를 준수했습니다.'}
            </p>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            판독 신뢰도
          </p>
          <p
            className={cn(
              'text-2xl font-bold tabular-nums',
              violation ? 'text-red-700' : 'text-emerald-700',
            )}
          >
            {r.confidence}%
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Evidence */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-base">캡처 프레임</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-black">
              <Image
                src="/images/intersection-frame.png"
                alt="분석 대상 교차로 캡처 프레임"
                fill
                className="object-cover opacity-95"
              />
              <div className="absolute left-3 top-3 flex items-center gap-2 rounded-md bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur">
                <span
                  className={cn(
                    'size-2 rounded-full',
                    SIGNAL_META[r.signalAtEntry].dot,
                  )}
                />
                진입 시 신호 · {SIGNAL_META[r.signalAtEntry].label}
              </div>
              <div className="absolute right-3 top-3 rounded-md bg-black/60 px-2.5 py-1 font-mono text-xs text-white backdrop-blur">
                t = {r.entryTime}
              </div>
              <div
                className={cn(
                  'absolute bottom-3 left-3 rounded-md px-2.5 py-1 font-mono text-xs font-semibold text-white backdrop-blur',
                  violation ? 'bg-red-600/80' : 'bg-emerald-600/80',
                )}
              >
                {r.plateNumber}
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              정지선 통과 시점의 대표 프레임과 신호 상태를 표시합니다.
            </p>
          </CardContent>
        </Card>

        {/* Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">판독 상세</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <DetailRow
              icon={<Car className="size-4" />}
              label="차량 종류"
              value={r.vehicleType}
            />
            <DetailRow
              icon={<Hash className="size-4" />}
              label="차량 번호"
              value={r.plateNumber}
              mono
            />
            <DetailRow
              icon={<Gauge className="size-4" />}
              label="진입 속도"
              value={`${r.speedKmh} km/h`}
            />
            <DetailRow
              icon={<TrafficCone className="size-4" />}
              label="진입 시 신호"
              value={SIGNAL_META[r.signalAtEntry].label}
              valueClassName={SIGNAL_META[r.signalAtEntry].text}
            />
            <DetailRow
              icon={<MapPin className="size-4" />}
              label="촬영 위치"
              value={analysis.location}
            />
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">신호 상태 타임라인</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="relative space-y-4 border-l border-border pl-6">
            {r.timeline.map((ev, i) => {
              const meta = SIGNAL_META[ev.signal]
              const isEntry = ev.label.includes('통과')
              return (
                <li key={i} className="relative">
                  <span
                    className={cn(
                      'absolute -left-[27px] top-1 size-3 rounded-full ring-4 ring-background',
                      meta.dot,
                    )}
                  />
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {ev.time}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        isEntry ? 'font-semibold' : 'font-medium',
                        isEntry &&
                          (violation ? 'text-red-600' : 'text-emerald-600'),
                      )}
                    >
                      {ev.label}
                    </span>
                  </div>
                </li>
              )
            })}
          </ol>
        </CardContent>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <span>
          카메라 {analysis.cameraId} · 분석 완료{' '}
          {formatDateTime(analysis.updatedAt)}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/history" />}>
            분석 내역
          </Button>
          <Button size="sm" nativeButton={false} render={<Link href="/upload" />}>
            새 영상 분석
          </Button>
        </div>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  label,
  value,
  mono,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
  valueClassName?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          'text-sm font-medium',
          mono && 'font-mono',
          valueClassName,
        )}
      >
        {value}
      </span>
    </div>
  )
}
