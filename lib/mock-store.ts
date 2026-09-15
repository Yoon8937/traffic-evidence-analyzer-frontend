'use client'

import { useSyncExternalStore } from 'react'
import type {
  Analysis,
  AnalysisStatus,
  SignalState,
  User,
  ViolationResult,
} from './types'

interface StoreState {
  users: User[]
  currentUserId: string | null
  analyses: Analysis[]
  hydrated: boolean
}

const STORAGE_KEY = 'traffic-violation-store-v1'

const SERVER_STATE: StoreState = {
  users: [],
  currentUserId: null,
  analyses: [],
  hydrated: false,
}

let state: StoreState = SERVER_STATE
const listeners = new Set<() => void>()
const timers = new Set<ReturnType<typeof setInterval>>()

function emit() {
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function persist() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        users: state.users,
        currentUserId: state.currentUserId,
        analyses: state.analyses,
      }),
    )
  } catch {
    /* ignore quota errors in demo */
  }
}

function setState(patch: Partial<StoreState>, options?: { persist?: boolean }) {
  state = { ...state, ...patch }
  if (options?.persist !== false) persist()
  emit()
}

/* ---------- helpers ---------- */

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomPlate() {
  const hangul = ['가', '나', '다', '라', '마', '바', '사', '아']
  return `${randomInt(10, 99)}${pick(hangul)} ${randomInt(1000, 9999)}`
}

function generateResult(): ViolationResult {
  const violation = Math.random() < 0.5
  const vehicleType = pick(['승용차', 'SUV', '트럭', '버스', '이륜차'])
  const plateNumber = randomPlate()
  const speedKmh = randomInt(24, 82)

  const timeline: ViolationResult['timeline'] = [
    { time: '00:00.0', signal: 'GREEN', label: '녹색 신호' },
    { time: '00:03.5', signal: 'YELLOW', label: '황색 신호 전환' },
    { time: '00:06.0', signal: 'RED', label: '적색 신호 전환' },
  ]

  if (violation) {
    const signalAtEntry: SignalState = 'RED'
    timeline.push({
      time: '00:07.8',
      signal: 'RED',
      label: '차량 정지선 통과 (위반)',
    })
    return {
      violation: true,
      violationType: '신호 위반 · 적색 신호 정지선 통과',
      confidence: randomInt(87, 99),
      vehicleType,
      plateNumber,
      speedKmh,
      signalAtEntry,
      entryTime: '00:07.8',
      timeline,
    }
  }

  const signalAtEntry: SignalState = pick(['GREEN', 'YELLOW'])
  timeline.push({
    time: signalAtEntry === 'GREEN' ? '00:02.4' : '00:04.6',
    signal: signalAtEntry,
    label: '차량 정지선 통과 (정상)',
  })
  timeline.sort((a, b) => a.time.localeCompare(b.time))
  return {
    violation: false,
    violationType: null,
    confidence: randomInt(90, 99),
    vehicleType,
    plateNumber,
    speedKmh,
    signalAtEntry,
    entryTime: signalAtEntry === 'GREEN' ? '00:02.4' : '00:04.6',
    timeline,
  }
}

/* ---------- simulation ---------- */

function updateAnalysis(id: string, fn: (a: Analysis) => Analysis) {
  const analyses = state.analyses.map((a) => (a.id === id ? fn(a) : a))
  setState({ analyses })
}

function finalize(id: string) {
  const failed = Math.random() < 0.12
  updateAnalysis(id, (a) =>
    failed
      ? {
          ...a,
          status: 'FAILED',
          progress: 100,
          updatedAt: Date.now(),
          errorMessage:
            '영상 처리 중 오류가 발생했습니다. 프레임 디코딩에 실패했습니다.',
        }
      : {
          ...a,
          status: 'COMPLETED',
          progress: 100,
          updatedAt: Date.now(),
          result: generateResult(),
        },
  )
}

function runSimulation(id: string) {
  const start = state.analyses.find((a) => a.id === id)
  if (!start || start.status === 'COMPLETED' || start.status === 'FAILED')
    return

  window.setTimeout(() => {
    updateAnalysis(id, (a) =>
      a.status === 'PENDING'
        ? { ...a, status: 'PROCESSING', progress: 6, updatedAt: Date.now() }
        : a,
    )
  }, 1200)

  const interval = setInterval(() => {
    const a = state.analyses.find((x) => x.id === id)
    if (!a || a.status === 'COMPLETED' || a.status === 'FAILED') {
      clearInterval(interval)
      timers.delete(interval)
      return
    }
    if (a.status !== 'PROCESSING') return

    const next = Math.min(96, a.progress + randomInt(7, 16))
    updateAnalysis(id, (cur) => ({
      ...cur,
      progress: next,
      updatedAt: Date.now(),
    }))
    if (next >= 96) {
      clearInterval(interval)
      timers.delete(interval)
      window.setTimeout(() => finalize(id), 1100)
    }
  }, 900)
  timers.add(interval)
}

/* ---------- seed ---------- */

function seed(): StoreState {
  const demoUser: User = {
    id: 'demo-user',
    name: '김관제',
    email: 'demo@traffic.io',
    password: 'demo1234',
  }
  const now = Date.now()
  const mk = (
    partial: Partial<Analysis> & {
      status: AnalysisStatus
      minutesAgo: number
    },
  ): Analysis => {
    const createdAt = now - partial.minutesAgo * 60000
    return {
      id: uid(),
      userId: demoUser.id,
      fileName: partial.fileName ?? 'cam_footage.mp4',
      fileSizeBytes: partial.fileSizeBytes ?? randomInt(40, 320) * 1024 * 1024,
      durationSec: partial.durationSec ?? randomInt(8, 45),
      location: partial.location ?? '서울시 강남구 테헤란로',
      cameraId: partial.cameraId ?? `CAM-${randomInt(1000, 9999)}`,
      createdAt,
      updatedAt: createdAt,
      status: partial.status,
      progress: partial.progress ?? (partial.status === 'COMPLETED' ? 100 : 0),
      result: partial.result ?? null,
      errorMessage: partial.errorMessage,
    }
  }

  const violationResult: ViolationResult = {
    violation: true,
    violationType: '신호 위반 · 적색 신호 정지선 통과',
    confidence: 96,
    vehicleType: 'SUV',
    plateNumber: '32나 7418',
    speedKmh: 54,
    signalAtEntry: 'RED',
    entryTime: '00:07.8',
    timeline: [
      { time: '00:00.0', signal: 'GREEN', label: '녹색 신호' },
      { time: '00:03.5', signal: 'YELLOW', label: '황색 신호 전환' },
      { time: '00:06.0', signal: 'RED', label: '적색 신호 전환' },
      { time: '00:07.8', signal: 'RED', label: '차량 정지선 통과 (위반)' },
    ],
  }

  const cleanResult: ViolationResult = {
    violation: false,
    violationType: null,
    confidence: 94,
    vehicleType: '승용차',
    plateNumber: '17가 2093',
    speedKmh: 38,
    signalAtEntry: 'GREEN',
    entryTime: '00:02.4',
    timeline: [
      { time: '00:00.0', signal: 'GREEN', label: '녹색 신호' },
      { time: '00:02.4', signal: 'GREEN', label: '차량 정지선 통과 (정상)' },
      { time: '00:03.5', signal: 'YELLOW', label: '황색 신호 전환' },
      { time: '00:06.0', signal: 'RED', label: '적색 신호 전환' },
    ],
  }

  const analyses: Analysis[] = [
    mk({
      status: 'COMPLETED',
      minutesAgo: 34,
      fileName: 'gangnam_teheran_0914.mp4',
      location: '서울시 강남구 테헤란로 152',
      result: violationResult,
    }),
    mk({
      status: 'COMPLETED',
      minutesAgo: 190,
      fileName: 'jongno_crossing_am.mp4',
      location: '서울시 종로구 세종대로',
      result: cleanResult,
    }),
    mk({
      status: 'PROCESSING',
      minutesAgo: 2,
      progress: 42,
      fileName: 'yeouido_bridge_night.mp4',
      location: '서울시 영등포구 여의대로',
    }),
    mk({
      status: 'FAILED',
      minutesAgo: 610,
      fileName: 'busan_haeundae_raw.mov',
      location: '부산시 해운대구 해운대로',
      errorMessage: '지원하지 않는 코덱입니다. 프레임 디코딩에 실패했습니다.',
    }),
    mk({
      status: 'COMPLETED',
      minutesAgo: 1500,
      fileName: 'incheon_songdo_cam3.mp4',
      location: '인천시 연수구 컨벤시아대로',
      result: {
        ...violationResult,
        confidence: 91,
        vehicleType: '트럭',
        plateNumber: '81바 5567',
        speedKmh: 47,
      },
    }),
  ]

  return {
    users: [demoUser],
    currentUserId: null,
    analyses,
    hydrated: true,
  }
}

/* ---------- lifecycle ---------- */

let hydrated = false

export function hydrateStore() {
  if (hydrated) return
  hydrated = true
  let loaded: StoreState | null = null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      loaded = {
        users: parsed.users ?? [],
        currentUserId: parsed.currentUserId ?? null,
        analyses: parsed.analyses ?? [],
        hydrated: true,
      }
    }
  } catch {
    loaded = null
  }

  const next = loaded ?? seed()
  setState(next, { persist: false })
  persist()

  for (const a of next.analyses) {
    if (a.status === 'PENDING' || a.status === 'PROCESSING') runSimulation(a.id)
  }
}

/* ---------- actions ---------- */

export function signUp(input: {
  name: string
  email: string
  password: string
}): { ok: boolean; error?: string } {
  const email = input.email.trim().toLowerCase()
  if (state.users.some((u) => u.email === email)) {
    return { ok: false, error: '이미 등록된 이메일입니다.' }
  }
  const user: User = { id: uid(), name: input.name.trim(), email, password: input.password }
  setState({ users: [...state.users, user], currentUserId: user.id })
  return { ok: true }
}

export function logIn(input: {
  email: string
  password: string
}): { ok: boolean; error?: string } {
  const email = input.email.trim().toLowerCase()
  const user = state.users.find((u) => u.email === email)
  if (!user || user.password !== input.password) {
    return { ok: false, error: '이메일 또는 비밀번호가 올바르지 않습니다.' }
  }
  setState({ currentUserId: user.id })
  return { ok: true }
}

export function logOut() {
  setState({ currentUserId: null })
}

export function createAnalysis(input: {
  fileName: string
  fileSizeBytes: number
  durationSec: number
  location: string
  cameraId: string
}): string | null {
  if (!state.currentUserId) return null
  const id = uid()
  const now = Date.now()
  const analysis: Analysis = {
    id,
    userId: state.currentUserId,
    fileName: input.fileName,
    fileSizeBytes: input.fileSizeBytes,
    durationSec: input.durationSec,
    location: input.location,
    cameraId: input.cameraId,
    createdAt: now,
    updatedAt: now,
    status: 'PENDING',
    progress: 0,
    result: null,
  }
  setState({ analyses: [analysis, ...state.analyses] })
  runSimulation(id)
  return id
}

export function retryAnalysis(id: string) {
  updateAnalysis(id, (a) => ({
    ...a,
    status: 'PENDING',
    progress: 0,
    result: null,
    errorMessage: undefined,
    updatedAt: Date.now(),
  }))
  runSimulation(id)
}

/* ---------- hooks ---------- */

function getSnapshot() {
  return state
}

function getServerSnapshot() {
  return SERVER_STATE
}

export function useStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

export function useCurrentUser(): User | null {
  const s = useStore()
  return s.users.find((u) => u.id === s.currentUserId) ?? null
}
