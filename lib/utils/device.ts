/**
 * 设备检测工具函数
 * 用于检测是否为移动设备，以便优化动画性能
 */

/**
 * 检测是否为移动设备
 * @returns {boolean} 如果是移动设备返回 true，否则返回 false
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false

  // 检查用户代理
  const userAgent = navigator.userAgent || navigator.vendor
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  if (mobileRegex.test(userAgent)) {
    return true
  }

  // 检查屏幕宽度（移动设备通常 < 768px）
  if (window.innerWidth < 768) {
    return true
  }

  return false
}

/**
 * 获取移动设备优化的动画参数
 * @param baseDistance 基础距离（桌面设备）
 * @param baseDuration 基础时长（桌面设备，秒）
 * @returns 优化后的参数对象
 */
export function getMobileOptimizedAnimationParams(
  baseDistance: number = 20,
  baseDuration: number = 0.5
) {
  const isMobile = isMobileDevice()
  return {
    distance: isMobile ? baseDistance * 0.5 : baseDistance, // 移动设备减少距离
    duration: isMobile ? baseDuration * 0.7 : baseDuration, // 移动设备缩短时长
  }
}
