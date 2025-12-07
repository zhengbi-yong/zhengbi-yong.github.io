import { NextResponse } from 'next/server'
import type { VisitorData } from '@/lib/types/visitor'
import { promises as fs } from 'fs'
import path from 'path'

const VISITORS_FILE = path.join(process.cwd(), 'data', 'visitors.json')

/**
 * 获取所有访客数据
 */
export async function GET() {
  try {
    const data = await fs.readFile(VISITORS_FILE, 'utf-8')
    const visitors: VisitorData[] = JSON.parse(data)

    return NextResponse.json({ visitors })
  } catch (error) {
    // 文件不存在或读取失败，返回空数组
    return NextResponse.json({ visitors: [] })
  }
}
