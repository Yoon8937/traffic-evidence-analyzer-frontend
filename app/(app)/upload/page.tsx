'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileVideo,
  Loader2,
  MapPin,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { createAnalysis } from '@/lib/mock-store'
import { formatBytes, formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SelectedFile {
  name: string
  size: number
  duration: number
}

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<SelectedFile | null>(null)
  const [location, setLocation] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  function acceptFile(f: File) {
    if (!f.type.startsWith('video/')) {
      toast.error('영상 파일만 업로드할 수 있습니다.')
      return
    }
    // Simulated duration for a mock pipeline.
    const duration = Math.floor(8 + Math.random() * 40)
    setFile({ name: f.name, size: f.size, duration })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      toast.error('분석할 영상을 선택하세요.')
      return
    }
    setSubmitting(true)
    const id = createAnalysis({
      fileName: file.name,
      fileSizeBytes: file.size,
      durationSec: file.duration,
      location: location.trim() || '위치 미지정',
      cameraId: cameraId.trim() || `CAM-${Math.floor(1000 + Math.random() * 9000)}`,
    })
    if (!id) {
      setSubmitting(false)
      toast.error('분석을 시작할 수 없습니다.')
      return
    }
    toast.success('분석을 시작했습니다.')
    router.push(`/analysis/${id}`)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">영상 업로드</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          교통 카메라 영상을 업로드하면 신호 위반 여부를 자동으로 분석합니다.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>1. 영상 파일</CardTitle>
            <CardDescription>
              MP4, MOV 등 영상 형식을 지원합니다. (데모 환경)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!file ? (
              <div
                role="button"
                tabIndex={0}
                onClick={() => inputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ')
                    inputRef.current?.click()
                }}
                onDragOver={(e) => {
                  e.preventDefault()
                  setDragging(true)
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) acceptFile(f)
                }}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors',
                  dragging
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50 hover:bg-muted/40',
                )}
              >
                <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UploadCloud className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">
                    클릭하거나 파일을 여기로 드래그하세요
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    최대 500MB · 단일 영상 파일
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) acceptFile(f)
                    e.target.value = ''
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileVideo className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatBytes(file.size)} · 재생시간 약{' '}
                    {formatDuration(file.duration)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="파일 제거"
                  onClick={() => setFile(null)}
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. 촬영 정보</CardTitle>
            <CardDescription>
              분석 이력 관리를 위한 메타데이터입니다. (선택)
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="location">촬영 위치</Label>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="location"
                  className="pl-9"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="예) 서울시 강남구 테헤란로"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cameraId">카메라 ID</Label>
              <div className="relative">
                <Video className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cameraId"
                  className="pl-9"
                  value={cameraId}
                  onChange={(e) => setCameraId(e.target.value)}
                  placeholder="예) CAM-1024"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={() => router.back()}
          >
            취소
          </Button>
          <Button type="submit" size="lg" disabled={submitting || !file}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            분석 시작
          </Button>
        </div>
      </form>
    </div>
  )
}
