import { apiFetch } from './client'
import type { VideoUploadResponse } from './types'

export function uploadVideo(file: File): Promise<VideoUploadResponse> {
  const body = new FormData()
  body.append('file', file)
  return apiFetch<VideoUploadResponse>('/api/videos', {
    method: 'POST',
    body,
    auth: true,
  })
}
