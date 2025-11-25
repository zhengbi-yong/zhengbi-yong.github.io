/**
 * 加载策略工具函数
 * 根据设备性能、网络状态和移动设备检测，返回最优的加载策略
 */

import { isMobileDevice } from './device'

export type LoadingStrategy = 'minimal' | 'standard' | 'enhanced'
export type HeroVisualMode = 'minimal' | 'standard' | 'enhanced'

// 扩展 Navigator 接口以支持设备内存和网络连接 API
interface NavigatorWithDeviceMemory extends Navigator {
  deviceMemory?: number
  connection?: NetworkInformation
  mozConnection?: NetworkInformation
  webkitConnection?: NetworkInformation
}

interface NetworkInformation {
  effectiveType?: '2g' | '3g' | '4g' | 'slow-2g'
  downlink?: number
}

/**
 * 获取加载策略
 * 根据设备性能、网络状态和移动设备检测返回最优策略
 * @returns 加载策略类型
 */
export function getLoadingStrategy(): LoadingStrategy {
  if (typeof window === 'undefined') {
    return 'standard'
  }

  // 移除低性能模式限制，所有设备都使用标准或增强模式
  // 如果用户偏好减少动画，仍然返回 standard（保留可访问性）
  if (prefersReducedMotion()) {
    return 'standard'
  }

  // 移动设备使用 standard 策略（不再使用 minimal）
  if (isMobileDevice()) {
    return 'standard'
  }

  // 检测设备性能
  const hardwareConcurrency = navigator.hardwareConcurrency || 2
  const nav = navigator as NavigatorWithDeviceMemory
  const deviceMemory = nav.deviceMemory || 4 // 默认 4GB

  // 检测网络状态
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection
  const effectiveType = connection?.effectiveType || '4g'
  const downlink = connection?.downlink || 10 // 默认 10 Mbps

  // 高性能设备 + 快速网络 = enhanced
  if (hardwareConcurrency >= 8 && deviceMemory >= 8 && effectiveType === '4g' && downlink >= 10) {
    return 'enhanced'
  }

  // 低性能设备或慢速网络 = standard（不再使用 minimal）
  if (hardwareConcurrency <= 2 || deviceMemory <= 2 || effectiveType === '2g' || downlink < 1) {
    return 'standard'
  }

  // 默认使用 standard
  return 'standard'
}

/**
 * 判断是否应该使用粒子动画
 * @returns 是否应该使用粒子动画（始终返回 true，移除低性能模式限制）
 */
export function shouldUseParticles(): boolean {
  return true
}

/**
 * 获取最优粒子数量
 * @param baseCount 基础粒子数量
 * @returns 优化后的粒子数量（移除 minimal 模式限制）
 */
export function getOptimalParticleCount(baseCount: number): number {
  const strategy = getLoadingStrategy()

  switch (strategy) {
    case 'enhanced':
      return baseCount
    case 'standard':
    default:
      // standard 模式也使用较多的粒子，确保动画连续性
      return Math.floor(baseCount * 0.9)
  }
}

/**
 * 英雄区域是否可以启用 3D（始终返回 true，移除低性能模式限制）
 */
export function shouldUseHero3D(): boolean {
  return true
}

/**
 * 获取英雄区域视觉模式（移除 minimal 模式，始终返回 standard 或 enhanced）
 */
export function getHeroVisualMode(): HeroVisualMode {
  if (typeof window === 'undefined') {
    return 'standard'
  }

  // 如果用户偏好减少动画，返回 standard（保留可访问性）
  if (prefersReducedMotion()) {
    return 'standard'
  }

  const strategy = getLoadingStrategy()
  if (strategy === 'enhanced') {
    return 'enhanced'
  }
  // 不再返回 minimal，统一使用 standard
  return 'standard'
}

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}
