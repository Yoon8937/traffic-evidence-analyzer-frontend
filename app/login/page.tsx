'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, TrafficCone } from 'lucide-react'
import { toast } from 'sonner'
import { logIn, useStore } from '@/lib/mock-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const { hydrated, currentUserId } = useStore()
  const [email, setEmail] = useState('demo@traffic.io')
  const [password, setPassword] = useState('demo1234')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hydrated && currentUserId) router.replace('/dashboard')
  }, [hydrated, currentUserId, router])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const res = logIn({ email, password })
    if (!res.ok) {
      setSubmitting(false)
      toast.error(res.error ?? '로그인에 실패했습니다.')
      return
    }
    toast.success('로그인되었습니다.')
    router.replace('/dashboard')
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <TrafficCone className="size-5" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-semibold">SignalWatch</p>
              <p className="text-xs text-muted-foreground">신호위반 영상 분석</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">로그인</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            계정에 로그인하여 영상 분석을 시작하세요.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              로그인
            </Button>
          </form>

          <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/40 p-3 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">데모 계정</span> ·
            demo@traffic.io / demo1234
          </div>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            아직 계정이 없으신가요?{' '}
            <Link
              href="/signup"
              className="font-medium text-primary hover:underline"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>

      <div className="relative hidden lg:block">
        <Image
          src="/images/auth-visual.png"
          alt="야간 교통 관제 영상"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-slate-950/40" />
        <div className="absolute bottom-0 left-0 right-0 p-10 text-white">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur">
            <ShieldCheck className="size-3.5" />
            AI 기반 신호위반 자동 판독
          </div>
          <h2 className="text-2xl font-semibold leading-snug">
            교통 카메라 영상을 업로드하면
            <br />
            신호 위반 여부를 자동으로 분석합니다.
          </h2>
        </div>
      </div>
    </div>
  )
}
