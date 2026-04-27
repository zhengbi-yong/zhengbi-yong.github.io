'use client'

import { useState, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UploadProgress {
  uploading: boolean
  progress: number // 0-100
  error: string | null
  result: UploadedImage | null
}

export interface UploadedImage {
  url: string
  filename: string
  width: number | null
  height: number | null
}

// ---------------------------------------------------------------------------
// Constants (must match backend/media.rs)
// ---------------------------------------------------------------------------

const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useImageUpload() {
  const [state, setState] = useState<UploadProgress>({
    uploading: false,
    progress: 0,
    error: null,
    result: null,
  })
  const abortRef = useRef<AbortController | null>(null)

  /**
   * Validate and upload a single image file.
   * Returns the uploaded image URL on success, throws on failure.
   */
  const upload = useCallback(async (file: File): Promise<UploadedImage> => {
    // --- Validation ---
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error(
        `不支持的文件类型: ${file.type}。支持的格式: JPG, PNG, WebP, GIF, SVG`
      )
    }
    if (file.size > MAX_IMAGE_SIZE) {
      const mb = (MAX_IMAGE_SIZE / 1024 / 1024).toFixed(0)
      throw new Error(`文件过大（最大 ${mb}MB）: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
    }

    // Cancel any in-flight request
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setState({ uploading: true, progress: 0, error: null, result: null })

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('alt_text', file.name.replace(/\.[^.]+$/, '')) // default alt = filename without ext

      // Use XMLHttpRequest for progress tracking (fetch doesn't support upload progress)
      const result = await new Promise<UploadedImage>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            setState((prev) => ({
              ...prev,
              progress: Math.round((e.loaded / e.total) * 100),
            }))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText) as { url: string; filename: string; width?: number | null; height?: number | null }
              resolve({
                url: data.url,
                filename: data.filename,
                width: data.width ?? null,
                height: data.height ?? null,
              })
            } catch {
              reject(new Error('解析响应失败'))
            }
          } else if (xhr.status === 401) {
            reject(new Error('未登录，请刷新页面后重试'))
          } else if (xhr.status === 413) {
            reject(new Error('文件过大（服务器限制）'))
          } else {
            try {
              const err = JSON.parse(xhr.responseText)
              reject(new Error(err.message || `上传失败 (${xhr.status})`))
            } catch {
              reject(new Error(`上传失败 (${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => reject(new Error('网络错误，请检查网络连接')))
        xhr.addEventListener('abort', () => reject(new Error('上传已取消')))

        xhr.open('POST', '/api/v1/admin/media/upload')
        xhr.withCredentials = true

        // Attach CSRF token from cookie
        const csrfToken = getCsrfToken()
        if (csrfToken) {
          xhr.setRequestHeader('X-CSRF-Token', csrfToken)
        }

        xhr.send(form)
      })

      setState({ uploading: false, progress: 100, error: null, result })
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : '上传失败'
      setState({ uploading: false, progress: 0, error: msg, result: null })
      throw err
    }
  }, [])

  /** Reset state, cancel in-flight upload */
  const reset = useCallback(() => {
    abortRef.current?.abort()
    setState({ uploading: false, progress: 0, error: null, result: null })
  }, [])

  return { ...state, upload, reset }
}

// ---------------------------------------------------------------------------
// CSRF helper
// ---------------------------------------------------------------------------

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}
