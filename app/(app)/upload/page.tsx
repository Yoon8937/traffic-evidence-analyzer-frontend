'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CircleCheck,
  FileVideo,
  Loader2,
  MapPin,
  UploadCloud,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadVideo } from '@/lib/api/videos'
import { ApiError } from '@/lib/api/client'
import type { VideoUploadResponse } from '@/lib/api/types'
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

const MAX_FILE_SIZE_BYTES = 509_715_200
const ALLOWED_EXTENSIONS = ['mov', 'mp4']
const ALLOWED_CONTENT_TYPES = ['video/quicktime', 'video/mp4']

export default function UploadPage() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [location, setLocation] = useState('')
  const [cameraId, setCameraId] = useState('')
  const [dragging, setDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<VideoUploadResponse | null>(null)

  function acceptFile(f: File) {
    const error = validateVideoFile(f)
    if (error) {
      toast.error(error)
      return
    }
    setResult(null)
    setFile(f)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (!file) {
      toast.error('분석할 영상을 선택하세요.')
      return
    }
    setSubmitting(true)
    setResult(null)
    try {
      const uploaded = await uploadVideo(file)
      setResult(uploaded)
      toast.success('업로드가 완료되었습니다.')
    } catch (error) {
      toast.error(toUploadErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
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
              MOV, MP4 형식만 업로드할 수 있습니다.
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
                    최대 약 500MB · MOV, MP4 · 단일 영상 파일
                  </p>
                </div>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".mov,.mp4,video/quicktime,video/mp4"
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
                    {formatBytes(file.size)}
                    {file.type ? ` · ${file.type}` : ''}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="파일 제거"
                  disabled={submitting}
                  onClick={() => {
                    setFile(null)
                    setResult(null)
                  }}
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

        {result && (
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="flex flex-col items-start gap-3 py-6">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CircleCheck className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">업로드가 완료되었습니다</p>
                  <p className="text-sm text-muted-foreground">
                    영상이 저장되었습니다.
                  </p>
                </div>
              </div>
              <dl className="w-full space-y-1.5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">videoId</dt>
                  <dd className="truncate font-mono text-xs">{result.videoId}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">파일명</dt>
                  <dd className="truncate font-medium">
                    {result.originalFilename}
                  </dd>
                </div>
                {result.fileSize != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">크기</dt>
                    <dd>{formatBytes(result.fileSize)}</dd>
                  </div>
                )}
                {result.durationSeconds != null && (
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">재생시간</dt>
                    <dd>
                      {formatDuration(Number(result.durationSeconds))}
                    </dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>
        )}

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
            업로드
          </Button>
        </div>
      </form>
    </div>
  )
}

function validateVideoFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase()
  if (!extension || !ALLOWED_EXTENSIONS.includes(extension)) {
    return '지원하지 않는 파일 형식입니다. MOV, MP4 파일만 업로드할 수 있습니다.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return '업로드 가능한 최대 파일 크기를 초과했습니다.'
  }
  if (file.type) {
    const normalized = file.type.split(';')[0].trim().toLowerCase()
    if (!ALLOWED_CONTENT_TYPES.includes(normalized)) {
      return '지원하지 않는 파일 형식입니다. MOV, MP4 파일만 업로드할 수 있습니다.'
    }
  }
  return null
}

function toUploadErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.message) return error.message
  if (error instanceof Error && error.message) return error.message
  return '영상 업로드에 실패했습니다.'
}
