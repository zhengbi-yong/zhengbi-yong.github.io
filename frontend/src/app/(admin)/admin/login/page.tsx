import { redirect } from 'next/navigation'

/**
 * Admin login page — redirects to the public /login page.
 * After successful login, the user is sent back to /admin.
 */
export default function AdminLoginPage() {
  redirect('/login?redirect=%2Fadmin')
}
