/**
 * IP地址和地理位置工具函数
 */

import type { GeolocationData, IPApiResponse } from '@/lib/types/visitor'
import { logger } from './logger'

/**
 * 从请求中获取客户端真实IP地址
 * 处理代理、CDN等情况
 */
export function getClientIP(request: Request): string {
  // 优先级: x-forwarded-for (第一个IP) > x-real-ip > 连接IP
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const cfConnectingIp = request.headers.get('cf-connecting-ip') // Cloudflare

  if (forwarded) {
    // x-forwarded-for 可能包含多个IP，取第一个
    const ips = forwarded.split(',').map((ip) => ip.trim())
    if (ips[0]) return ips[0]
  }

  if (cfConnectingIp) {
    return cfConnectingIp
  }

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * 检查是否为本地IP地址
 */
function isLocalIP(ip: string): boolean {
  return (
    ip === 'unknown' ||
    ip === '::1' ||
    ip === 'localhost' ||
    ip.startsWith('127.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('10.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.20.') ||
    ip.startsWith('172.21.') ||
    ip.startsWith('172.22.') ||
    ip.startsWith('172.23.') ||
    ip.startsWith('172.24.') ||
    ip.startsWith('172.25.') ||
    ip.startsWith('172.26.') ||
    ip.startsWith('172.27.') ||
    ip.startsWith('172.28.') ||
    ip.startsWith('172.29.') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('169.254.') // 链路本地地址
  )
}

/**
 * 通过IP地址获取地理位置信息
 * 使用 ip-api.com 免费API
 */
export async function getGeolocation(ip: string): Promise<GeolocationData | null> {
  // 对于本地IP，返回默认位置（开发环境）
  if (isLocalIP(ip)) {
    // 开发环境：返回默认位置或null（可选）
    if (process.env.NODE_ENV === 'development') {
      // 开发环境可以选择返回null（不记录）或返回默认位置
      return null
    }
    return null
  }

  try {
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,timezone`,
      {
        // 添加超时
        signal: AbortSignal.timeout(5000), // 5秒超时
      }
    )

    if (!response.ok) {
      logger.warn(`[IP Geolocation] API returned ${response.status}`)
      return null
    }

    const data: IPApiResponse = await response.json()

    if (data.status === 'success' && data.lat && data.lon) {
      return {
        country: data.country || 'Unknown',
        city: data.city || 'Unknown',
        lat: data.lat,
        lon: data.lon,
        timezone: data.timezone || 'Unknown',
      }
    }

    // API返回失败状态
    if (data.message) {
      logger.warn(`[IP Geolocation] API error: ${data.message}`)
    }

    return null
  } catch (error) {
    // 网络错误或超时
    if (error instanceof Error && error.name === 'AbortError') {
      logger.warn('[IP Geolocation] Request timeout')
    } else {
      logger.error('[IP Geolocation] Failed to fetch geolocation:', error)
    }
    return null
  }
}
