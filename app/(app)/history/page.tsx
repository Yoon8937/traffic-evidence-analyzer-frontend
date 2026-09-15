'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, Upload, Video } from 'lucide-react'
import { useCurrentUser, useStore } from '@/lib/mock-store'
import { formatDateTime } from '@/lib/format'
import type { AnalysisStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatusBadge } from '@/components/status-badge'
import { ViolationBadge } from '@/components/violation-badge'

type Filter = 'ALL' | AnalysisStatus

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'PROCESSING', label: '분석 중' },
  { value: 'COMPLETED', label: '완료' },
  { value: 'FAILED', label: '실패' },
]

export default function HistoryPage() {
  const router = useRouter()
  const { analyses } = useStore()
  const user = useCurrentUser()
  const [filter, setFilter] = useState<Filter>('ALL')
  const [query, setQuery] = useState('')

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return analyses
      .filter((a) => a.userId === user?.id)
      .filter((a) => {
        if (filter === 'ALL') return true
        if (filter === 'PROCESSING')
          return a.status === 'PROCESSING' || a.status === 'PENDING'
        return a.status === filter
      })
      .filter(
        (a) =>
          !q ||
          a.fileName.toLowerCase().includes(q) ||
          a.location.toLowerCase().includes(q) ||
          a.cameraId.toLowerCase().includes(q),
      )
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [analyses, user?.id, filter, query])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">분석 내역</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            업로드한 모든 영상의 분석 이력을 확인합니다.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/upload" />}>
          <Upload className="size-4" />새 영상 분석
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            {FILTERS.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>
                {f.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="파일명, 위치, 카메라 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Video className="size-6" />
              </div>
              <p className="text-sm text-muted-foreground">
                조건에 맞는 분석 내역이 없습니다.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>파일명</TableHead>
                  <TableHead className="hidden md:table-cell">
                    촬영 위치
                  </TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>결과</TableHead>
                  <TableHead className="hidden sm:table-cell">
                    업로드 시각
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => {
                  const href =
                    a.status === 'COMPLETED'
                      ? `/analysis/${a.id}/result`
                      : `/analysis/${a.id}`
                  return (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => router.push(href)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                            <Video className="size-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="max-w-[180px] truncate text-sm font-medium">
                              {a.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {a.cameraId}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden max-w-[220px] truncate text-sm text-muted-foreground md:table-cell">
                        {a.location}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={a.status} />
                      </TableCell>
                      <TableCell>
                        <ViolationBadge analysis={a} />
                      </TableCell>
                      <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">
                        {formatDateTime(a.createdAt)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
