'use client'

import { useEffect, useSyncExternalStore } from 'react'

const STORAGE_KEY = 'tvea-auth-session-v1'

export interface AuthSession {
  accessToken: string
  tokenType: string
}

export interface JwtUser {
  id: string
  username: string
  email: string
}

interface SessionState {
  session: AuthSession | null
  hydrated: boolean
}

const SERVER_STATE: SessionState = {
  session: null,
  hydrated: false,
}

let state: SessionState = SERVER_STATE
const listeners = new Set<() => void>()
let didHydrate = false

function emit() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function setState(next: SessionState) {
  state = next
  emit()
}

function persist(session: AuthSession | null) {
  if (typeof window === 'undefined') return
  try {
    if (!session) {
      window.localStorage.removeItem(STORAGE_KEY)
      return
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
  } catch {
    /* ignore quota errors */
  }
}

function readStoredSession(): AuthSession | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthSession>
    if (!parsed.accessToken || typeof parsed.accessToken !== 'string') {
      return null
    }
    return {
      accessToken: parsed.accessToken,
      tokenType: parsed.tokenType || 'Bearer',
    }
  } catch {
    return null
  }
}

export function hydrateAuthSession() {
  if (didHydrate) return
  didHydrate = true
  setState({ session: readStoredSession(), hydrated: true })
}

export function saveAuthSession(accessToken: string, tokenType: string) {
  const session: AuthSession = {
    accessToken,
    tokenType: tokenType || 'Bearer',
  }
  persist(session)
  setState({ session, hydrated: true })
}

export function clearAuthSession() {
  persist(null)
  setState({ session: null, hydrated: true })
}

export function getAccessToken(): string | null {
  return state.session?.accessToken ?? null
}

/** Returns `Bearer <accessToken>` for authenticated API requests. */
export function getAuthorizationHeader(): string | null {
  if (!state.session?.accessToken) return null
  const type = state.session.tokenType || 'Bearer'
  return `${type} ${state.session.accessToken}`
}

export function getJwtUser(accessToken: string | null | undefined): JwtUser | null {
  if (!accessToken) return null
  const parts = accessToken.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=')
    const payload = JSON.parse(window.atob(padded)) as {
      sub?: string
      username?: string
      email?: string
    }
    if (!payload.sub) return null
    return {
      id: payload.sub,
      username: payload.username ?? '',
      email: payload.email ?? '',
    }
  } catch {
    return null
  }
}

function getSnapshot() {
  return state
}

function getServerSnapshot() {
  return SERVER_STATE
}

export function useAuthSession() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  useEffect(() => {
    hydrateAuthSession()
  }, [])
  return snapshot
}
