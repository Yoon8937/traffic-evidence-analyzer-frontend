'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useStore } from '@/lib/mock-store'

export default function IndexPage() {
  const router = useRouter()
  const { hydrated, currentUserId } = useStore()

  useEffect(() => {
    if (!hydrated) return
    router.replace(currentUserId ? '/dashboard' : '/login')
  }, [hydrated, currentUserId, router])

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  )
}
