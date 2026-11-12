'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2, ShieldCheck, TrafficCone } from 'lucide-react'
import { toast } from 'sonner'
import { signup } from '@/lib/api/auth'
import { ApiError } from '@/lib/api/client'
import { useAuthSession } from '@/lib/auth/session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SignupPage() {
  const router = useRouter()
  const { session, hydrated } = useAuthSession()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hydrated && session?.accessToken) router.replace('/dashboard')
  }, [hydrated, session?.accessToken, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    if (password.length < 8) {
      toast.error('비밀번호는 8자 이상이어야 합니다.')
      return
    }
    if (password !== confirm) {
      toast.error('비밀번호가 일치하지 않습니다.')
      return
    }
    setSubmitting(true)
    try {
      await signup({ username, email, password })
      toast.success('회원가입이 완료되었습니다. 로그인해 주세요.')
      router.replace('/login')
    } catch (error) {
      toast.error(toSignupErrorMessage(error))
      setSubmitting(false)
    }
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

          <h1 className="text-2xl font-semibold tracking-tight">회원가입</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            새 계정을 만들어 분석 시스템을 이용하세요.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">사용자 이름</Label>
              <Input
                id="username"
                required
                autoComplete="username"
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_]+$"
                title="영문, 숫자, 밑줄만 사용할 수 있습니다."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="hong_gildong"
              />
            </div>
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
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8자 이상 입력"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">비밀번호 확인</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
              />
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={submitting}
            >
              {submitting && <Loader2 className="size-4 animate-spin" />}
              회원가입
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="font-medium text-primary hover:underline"
            >
              로그인
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
            신뢰도 기반 위반 판독 리포트
          </div>
          <h2 className="text-2xl font-semibold leading-snug">
            분석 이력과 결과를
            <br />
            한 곳에서 체계적으로 관리하세요.
          </h2>
        </div>
      </div>
    </div>
  )
}

function toSignupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const fieldMessages = error.details?.errors
      ?.map((item) => item.message)
      .filter(Boolean)
    if (error.status === 400 && fieldMessages && fieldMessages.length > 0) {
      return fieldMessages.join(' ')
    }
    if (error.message) return error.message
  }
  if (error instanceof Error && error.message) return error.message
  return '회원가입에 실패했습니다.'
}
