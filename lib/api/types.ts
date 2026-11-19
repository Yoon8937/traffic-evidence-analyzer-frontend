export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
}

export interface SignupRequest {
  username: string
  email: string
  password: string
}

export interface SignupResponse {
  id: number
  username: string
  email: string
}

export interface FieldErrorDetail {
  field: string
  message: string
}

export interface ErrorResponse {
  code: string
  message: string
  errors: FieldErrorDetail[] | null
}

export interface VideoUploadResponse {
  videoId: string
  originalFilename: string
  fileSize: number
  contentType: string
  durationSeconds: number | null
  width: number | null
  height: number | null
  frameRate: number | null
  createdAt: string
}
