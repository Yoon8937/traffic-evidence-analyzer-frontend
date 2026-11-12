import { apiFetch } from './client'
import type {
  LoginRequest,
  LoginResponse,
  SignupRequest,
  SignupResponse,
} from './types'

export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function signup(request: SignupRequest): Promise<SignupResponse> {
  return apiFetch<SignupResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}
