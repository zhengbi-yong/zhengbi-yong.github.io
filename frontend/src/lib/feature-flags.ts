/**
 * 功能开关配置
 *
 * 用于控制新功能的渐进式发布
 * 可以通过环境变量或直接修改此文件来控制
 */

export const features = {
  // 杂志风格布局
  magazineLayout: process.env.NEXT_PUBLIC_ENABLE_MAGAZINE_LAYOUT === 'true' ?? true,

  // 瀑布流网格
  masonryGrid: process.env.NEXT_PUBLIC_ENABLE_MASONRY === 'true' ?? true,

  // 推荐系统
  recommendations: process.env.NEXT_PUBLIC_ENABLE_RECOMMENDATIONS === 'true' ?? true,

  // 3D悬停效果
  hover3D: process.env.NEXT_PUBLIC_ENABLE_3D_HOVER === 'true' ?? true,

  // 手势支持
  gestures: process.env.NEXT_PUBLIC_ENABLE_GESTURES === 'true' ?? false, // 默认关闭，需要额外依赖

  // 虚拟滚动
  virtualScroll: process.env.NEXT_PUBLIC_ENABLE_VIRTUAL_SCROLL === 'true' ?? true,

  // 图片懒加载
  lazyImages: process.env.NEXT_PUBLIC_ENABLE_LAZY_IMAGES === 'true' ?? true,
} as const

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature]
}

/**
 * 获取所有启用的功能
 */
export function getEnabledFeatures(): string[] {
  return Object.entries(features)
    .filter(([_, enabled]) => enabled)
    .map(([feature]) => feature)
}
