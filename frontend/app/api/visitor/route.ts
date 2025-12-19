import { NextResponse } from 'next/server'
import { getClientIP, getGeolocation } from '@/lib/utils/ip-geolocation'
import type { VisitorData } from '@/lib/types/visitor'
import { promises as fs } from 'fs'
import path from 'path'

// 允许静态导出（API路由在静态导出时不可用，但需要此配置避免构建错误）
export const dynamic = 'force-static'

const VISITORS_FILE = path.join(process.cwd(), 'visitors.json')

/**
 * 读取访客数据文件
 */
async function readVisitors(): Promise<VisitorData[]> {
  try {
    const data = await fs.readFile(VISITORS_FILE, 'utf-8')
    return JSON.parse(data) as VisitorData[]
  } catch (error) {
    // 文件不存在或读取失败，返回空数组
    return []
  }
}

/**
 * 写入访客数据文件
 */
async function writeVisitors(visitors: VisitorData[]): Promise<void> {
  await fs.writeFile(VISITORS_FILE, JSON.stringify(visitors, null, 2), 'utf-8')
}

/**
 * 记录访客IP和地理位置
 */
export async function POST(request: Request) {
  try {
    // 获取客户端IP
    const ip = getClientIP(request)

    // 对于本地IP，在开发环境中允许但不记录地理位置
    const isLocal =
      ip === 'unknown' ||
      ip === '::1' ||
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.')

    if (isLocal && process.env.NODE_ENV === 'production') {
      // 生产环境中，本地IP不应该出现，返回错误
      return NextResponse.json({ success: false, message: '无法获取IP地址' }, { status: 400 })
    }

    // 获取地理位置
    const geolocation = await getGeolocation(ip)

    // 在开发环境中，如果无法获取地理位置，静默失败（不记录）
    if (!geolocation) {
      if (process.env.NODE_ENV === 'development') {
        // 开发环境：静默失败，不记录
        return NextResponse.json(
          { success: false, message: '开发环境：本地IP，跳过记录' },
          { status: 200 }
        )
      }
      // 生产环境：返回错误
      return NextResponse.json({ success: false, message: '无法获取地理位置信息' }, { status: 400 })
    }

    // 读取现有访客数据
    const visitors = await readVisitors()

    // 查找是否已存在该IP
    const existingIndex = visitors.findIndex((v) => v.ip === ip)
    const now = new Date().toISOString()

    if (existingIndex >= 0) {
      // 更新现有访客：更新最后访问时间和访问次数
      visitors[existingIndex] = {
        ...visitors[existingIndex],
        ...geolocation,
        lastVisit: now,
        visitCount: visitors[existingIndex].visitCount + 1,
      }
    } else {
      // 添加新访客
      const newVisitor: VisitorData = {
        ip,
        ...geolocation,
        firstVisit: now,
        lastVisit: now,
        visitCount: 1,
      }
      visitors.push(newVisitor)
    }

    // 写入文件
    await writeVisitors(visitors)

    return NextResponse.json({ success: true, message: '访客记录已保存' })
  } catch (error) {
    console.error('[Visitor API] Error:', error)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}
