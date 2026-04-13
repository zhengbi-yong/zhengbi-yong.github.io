import { cookies } from 'next/headers'

export async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const isServer = typeof window === 'undefined'
  const headers = new Headers(options.headers)

  if (isServer) {
    // RSC: Bridge HttpOnly Cookie
    const cookieStore = await cookies()
    const session = cookieStore.get('auth_session')
    if (session) {
      headers.set('Cookie', `auth_session=${session.value}`)
    }
  } else {
    options.credentials = 'include'
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'
  const res = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  })

  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`)
  }

  return res.json()
}
