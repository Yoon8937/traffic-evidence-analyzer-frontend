'use client'

import { useEffect } from 'react'
import { hydrateStore } from '@/lib/mock-store'

export function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    hydrateStore()
  }, [])

  return <>{children}</>
}
