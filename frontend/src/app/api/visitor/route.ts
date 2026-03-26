import { NextResponse } from 'next/server'
import { getClientIP, getGeolocation } from '@/lib/utils/ip-geolocation'
import type { VisitorData } from '@/lib/types/visitor'
import { logger } from '@/lib/utils/logger'
import { readVisitorsFile, writeVisitorsFile } from '@/lib/server/visitors-file'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const visitorTrackingEnabled =
      process.env.NODE_ENV === 'production' ||
      process.env.NEXT_PUBLIC_ENABLE_VISITOR_TRACKING === 'true'

    if (!visitorTrackingEnabled) {
      return NextResponse.json({
        success: true,
        message: 'Visitor tracking is disabled in development.',
      })
    }

    const ip = getClientIP(request)
    const isLocal =
      ip === 'unknown' ||
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')

    if (isLocal && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, message: '无法获取IP地址' }, { status: 400 })
    }

    const geolocation = await getGeolocation(ip)

    if (!geolocation) {
      if (process.env.NODE_ENV === 'development') {
        return NextResponse.json({
          success: true,
          message: 'Skipped visitor persistence for local development.',
        })
      }

      return NextResponse.json({ success: false, message: '无法获取地理位置信息' }, { status: 400 })
    }

    const visitors = await readVisitorsFile()
    const existingIndex = visitors.findIndex((visitor) => visitor.ip === ip)
    const now = new Date().toISOString()

    if (existingIndex >= 0) {
      const existing = visitors[existingIndex]
      if (existing) {
        visitors[existingIndex] = {
          ...existing,
          ...geolocation,
          ip: existing.ip,
          firstVisit: existing.firstVisit,
          lastVisit: now,
          visitCount: existing.visitCount + 1,
        }
      }
    } else {
      const newVisitor: VisitorData = {
        ip,
        ...geolocation,
        firstVisit: now,
        lastVisit: now,
        visitCount: 1,
      }
      visitors.push(newVisitor)
    }

    await writeVisitorsFile(visitors)

    return NextResponse.json({ success: true, message: 'Visitor recorded.' })
  } catch (error) {
    logger.error('[Visitor API] Error:', error)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}
