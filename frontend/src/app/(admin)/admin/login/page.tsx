import { redirect } from 'next/navigation'

/**
 * Admin login page — redirects to the public /login page while preserving
 * the original redirect target so the user returns to the right page after login.
 *
 * Flow: /admin/xxx → 307 → /admin/login?redirect=%2Fadmin%2Fxxx
 *       /admin/login → 307 → /login?redirect=%2Fadmin%2Fxxx
 */
export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>
}) {
  const params = await searchParams
  const target = params.redirect || '/admin'
  redirect(`/login?redirect=${encodeURIComponent(target)}`)
}
