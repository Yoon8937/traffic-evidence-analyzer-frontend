export type AnalysisStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export type SignalState = 'RED' | 'YELLOW' | 'GREEN'

export interface User {
  id: string
  name: string
  email: string
  password: string
}

export interface TimelineEvent {
  time: string
  signal: SignalState
  label: string
}

export interface ViolationResult {
  violation: boolean
  violationType: string | null
  confidence: number
  vehicleType: string
  plateNumber: string
  speedKmh: number
  signalAtEntry: SignalState
  entryTime: string
  timeline: TimelineEvent[]
}

export interface Analysis {
  id: string
  userId: string
  fileName: string
  fileSizeBytes: number
  durationSec: number
  location: string
  cameraId: string
  createdAt: number
  updatedAt: number
  status: AnalysisStatus
  progress: number
  result: ViolationResult | null
  errorMessage?: string
}
