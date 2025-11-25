/**
 * GSAP 工具函数
 * 提供 GSAP 动画相关的工具函数和配置
 */

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { isMobileDevice } from './device'

/**
 * 注册 GSAP 插件
 * 需要在组件挂载时调用
 */
export function registerGSAPPlugins() {
  if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
  }
}

/**
 * 获取移动设备优化的动画参数
 * @param baseDuration 基础动画时长（秒）
 * @param baseEase 基础缓动函数
 * @returns 优化后的动画参数
 */
export function getGSAPMobileOptimizedParams(
  baseDuration: number = 1,
  baseEase: string = 'power2.out'
) {
  const isMobile = isMobileDevice()
  return {
    duration: isMobile ? baseDuration * 0.7 : baseDuration,
    ease: isMobile ? 'power1.out' : baseEase, // 移动设备使用更简单的缓动
  }
}

/**
 * 创建 ScrollTrigger 配置
 * @param options 自定义配置选项
 * @returns ScrollTrigger 配置对象
 */
export interface ScrollTriggerConfig {
  trigger?: string | Element
  start?: string
  end?: string
  scrub?: boolean | number
  pin?: boolean | string
  markers?: boolean
  once?: boolean
  toggleActions?: string
}

export function createScrollTriggerConfig(options: ScrollTriggerConfig = {}): ScrollTriggerConfig {
  const isMobile = isMobileDevice()

  return {
    trigger: options.trigger,
    start: options.start || 'top 80%',
    end: options.end || 'bottom 20%',
    scrub: options.scrub ?? false,
    pin: options.pin ?? false,
    markers: process.env.NODE_ENV === 'development' ? options.markers : false,
    once: options.once ?? true,
    toggleActions: options.toggleActions || 'play none none none',
    ...options,
  }
}

/**
 * 清理 ScrollTrigger 实例
 * 在组件卸载时调用
 */
export function cleanupScrollTrigger() {
  if (typeof window !== 'undefined') {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
  }
}

/**
 * 刷新 ScrollTrigger
 * 在 DOM 更新后调用
 */
export function refreshScrollTrigger() {
  if (typeof window !== 'undefined') {
    ScrollTrigger.refresh()
  }
}
