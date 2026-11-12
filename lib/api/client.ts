import { getAuthorizationHeader } from '@/lib/auth/session'
import type { ErrorResponse } from './types'

const DEFAULT_API_BASE_URL = 'http://localhost:8080'

export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? DEFAULT_API_BASE_URL
  return base.replace(/\/$/, '')
}

export class ApiError extends Error {
  readonly status: number
  readonly code?: string
  readonly details?: ErrorResponse

  constructor(
    message: string,
    status: number,
    options?: { code?: string; details?: ErrorResponse },
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = options?.code
    this.details = options?.details
  }
}

function isErrorResponse(value: unknown): value is ErrorResponse {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return typeof record.message === 'string'
}

async function readError(response: Response): Promise<ApiError> {
  let parsed: unknown
  try {
    parsed = await response.json()
  } catch {
    parsed = null
  }

  if (isErrorResponse(parsed) && parsed.message.trim()) {
    return new ApiError(parsed.message, response.status, {
      code: typeof parsed.code === 'string' ? parsed.code : undefined,
      details: parsed,
    })
  }

  if (response.status >= 500) {
    return new ApiError(
      '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
      response.status,
    )
  }

  return new ApiError('요청을 처리할 수 없습니다.', response.status)
}

export type ApiFetchInit = RequestInit & {
  auth?: boolean
}

export async function apiFetch<T>(
  path: string,
  init: ApiFetchInit = {},
): Promise<T> {
  const { auth, ...requestInit } = init
  const headers = new Headers(requestInit.headers)
  if (requestInit.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  if (auth) {
    const authorization = getAuthorizationHeader()
    if (authorization) {
      headers.set('Authorization', authorization)
    }
  }

  let response: Response
  try {
    response = await fetch(`${getApiBaseUrl()}${path}`, {
      ...requestInit,
      headers,
    })
  } catch {
    throw new ApiError(
      '서버에 연결할 수 없습니다. 네트워크 상태를 확인해 주세요.',
      0,
    )
  }

  if (!response.ok) {
    throw await readError(response)
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(
      '서버 응답을 해석할 수 없습니다.',
      response.status,
    )
  }
}
