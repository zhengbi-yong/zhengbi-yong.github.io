import { NextResponse } from 'next/server'
import { readVisitorsFile } from '@/lib/server/visitors-file'

export const dynamic = 'force-dynamic'

/**
 * 获取所有访客数据
 */
export async function GET() {
  try {
    const visitors = await readVisitorsFile()
    return NextResponse.json({ visitors })
  } catch {
    return NextResponse.json({ visitors: [] })
  }
}
