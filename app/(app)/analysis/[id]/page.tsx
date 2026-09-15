'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  FileVideo,
  Loader2,
  RotateCw,
  TriangleAlert,
} from 'lucide-react'
import { retryAnalysis, useStore } from '@/lib/mock-store'
import { formatBytes, formatDateTime, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { StatusBadge } from '@/components/status-badge'
import { ViolationBadge } from '@/components/violation-badge'

const STEPS = [
  { label: '영상 업로드 완료', threshold: 0 },
  { label: '프레임 추출', threshold: 20 },
  { label: '차량 객체 검출', threshold: 45 },
  { label: '신호 상태 판독', threshold: 70 },
  { label: '위반 판정 및 결과 생성', threshold: 90 },
]

export default function AnalysisStatusPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const { analyses } = useStore()

  const analysis = useMemo(
    () => analyses.find((a) => a.id === params.id) ?? null,
    [analyses, params.id],
  )

  if (!analysis) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-lg font-semibold">분석을 찾을 수 없습니다.</p>
        <p className="mt-1 text-sm text-muted-foreground">
          삭제되었거나 잘못된 접근입니다.
        </p>
        <Button className="mt-6" nativeButton={false} render={<Link href="/history" />}>
          분석 내역으로
        </Button>
      </div>
    )
  }

  const isActive =
    analysis.status === 'PENDING' || analysis.status === 'PROCESSING'
  const currentStep = STEPS.reduce(
    (acc, s, i) => (analysis.progress >= s.threshold ? i : acc),
    0,
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between gap-4">
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
            <h2 className="text-xl font-semibold tracking-tight">분석 상태</h2>
            <p className="text-sm text-muted-foreground">
              업로드된 영상의 실시간 처리 현황
            </p>
          </div>
        </div>
        <StatusBadge status={analysis.status} />
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 py-5">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileVideo className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{analysis.fileName}</p>
            <p className="truncate text-sm text-muted-foreground">
              {analysis.location} · {analysis.cameraId}
            </p>
          </div>
          <div className="hidden text-right text-sm text-muted-foreground sm:block">
            <p>{formatBytes(analysis.fileSizeBytes)}</p>
            <p>{formatDuration(analysis.durationSec)}</p>
          </div>
        </CardContent>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Loader2 className="size-4 animate-spin text-primary" />
              영상 분석 진행 중
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-semibold tabular-nums">
                  {analysis.progress}%
                </span>
              </div>
              <Progress value={analysis.progress} />
            </div>

            <ol className="space-y-3">
              {STEPS.map((step, i) => {
                const done = i < currentStep
                const active = i === currentStep
                return (
                  <li key={step.label} className="flex items-center gap-3">
                    <span
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full text-xs',
                        done && 'bg-primary text-primary-foreground',
                        active &&
                          'bg-primary/10 text-primary ring-2 ring-primary/30',
                        !done && !active && 'bg-muted text-muted-foreground',
                      )}
                    >
                      {done ? (
                        <Check className="size-3.5" />
                      ) : active ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        i + 1
                      )}
                    </span>
                    <span
                      className={cn(
                        'text-sm',
                        active
                          ? 'font-medium text-foreground'
                          : done
                            ? 'text-foreground'
                            : 'text-muted-foreground',
                      )}
                    >
                      {step.label}
                    </span>
                  </li>
                )
              })}
            </ol>
            <p className="text-xs text-muted-foreground">
              분석이 완료되면 이 페이지가 자동으로 업데이트됩니다.
            </p>
          </CardContent>
        </Card>
      )}

      {analysis.status === 'COMPLETED' && (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-7" />
            </div>
            <div>
              <p className="text-lg font-semibold">분석이 완료되었습니다</p>
              <p className="mt-1 text-sm text-muted-foreground">
                판독 결과를 확인하세요.
              </p>
            </div>
            <ViolationBadge analysis={analysis} />
            <Button
              size="lg"
              className="mt-2"
              nativeButton={false} render={<Link href={`/analysis/${analysis.id}/result`} />}
            >
              결과 상세 보기
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis.status === 'FAILED' && (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-red-100 text-red-600">
              <TriangleAlert className="size-7" />
            </div>
            <div>
              <p className="text-lg font-semibold">분석에 실패했습니다</p>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                {analysis.errorMessage}
              </p>
            </div>
            <Button size="lg" onClick={() => retryAnalysis(analysis.id)}>
              <RotateCw className="size-4" />
              다시 분석
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="text-center text-xs text-muted-foreground">
        업로드 시각 · {formatDateTime(analysis.createdAt)}
      </p>
    </div>
  )
}
