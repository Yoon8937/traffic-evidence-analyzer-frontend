'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthSession } from '@/lib/auth/session'
import { useStore } from '@/lib/mock-store'

export default function IndexPage() {
  const router = useRouter()
  const { hydrated, currentUserId } = useStore()
  const auth = useAuthSession()

  useEffect(() => {
    if (!hydrated || !auth.hydrated) return
    const hasSession = Boolean(auth.session?.accessToken || currentUserId)
    router.replace(hasSession ? '/dashboard' : '/login')
  }, [hydrated, currentUserId, auth.hydrated, auth.session?.accessToken, router])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
