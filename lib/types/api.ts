import type { NextRequest } from 'next/server'

export interface ApiError {
  message: string
  code?: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

export interface NewsletterRequestBody {
  email: string
}

export interface NewsletterResponseData {
  message: string
}

export type NewsletterResponse = ApiResponse<NewsletterResponseData>

export function isNewsletterRequestBody(data: unknown): data is NewsletterRequestBody {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof (data as NewsletterRequestBody).email === 'string'
  )
}

export interface AppRequest extends NextRequest {
  json: <T = unknown>() => Promise<T>
}
