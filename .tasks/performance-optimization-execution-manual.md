# 性能优化执行手册 - AI 可执行步骤

## 项目信息
- **项目名称**: 博客系统性能与兼容性优化
- **执行手册版本**: 1.0
- **创建日期**: 2025-01-XX
- **技术栈**: Next.js 15.1.4 + React 19 + TypeScript + Tailwind CSS 4.0

## 执行说明

本手册包含所有优化步骤的详细 AI 执行 Prompt。每个步骤都可以独立执行，执行前请确保：
1. 已备份当前代码
2. 已理解步骤要求
3. 执行后立即测试验证

---

## 第一阶段：粒子动画性能优化（最高优先级）

### 步骤 1.1：优化距离计算（使用距离平方）

**文件路径**: `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
优化 components/ParticleBackground.tsx 文件中的距离计算逻辑，使用距离平方比较替代 Math.sqrt() 计算。

具体修改要求：
1. 在文件顶部添加常量定义：
   - 定义 `CONNECTION_DISTANCE_SQUARED = 150 * 150` (即 22500)
   - 这个常量表示连接距离的平方值

2. 修改 drawParticles 函数中的距离计算逻辑（第89-105行）：
   - 将第94行的 `const distance = Math.sqrt(dx * dx + dy * dy)` 改为 `const distanceSquared = dx * dx + dy * dy`
   - 将第96行的 `if (distance < 150)` 改为 `if (distanceSquared < CONNECTION_DISTANCE_SQUARED)`
   - 将第100行的透明度计算改为：
     - 先计算：`const opacity = 0.1 * (1 - Math.sqrt(distanceSquared) / 150)`
     - 然后构建 rgba 字符串：`const rgbaColor = particleColor.includes('rgba') ? particleColor.replace(/[\d.]+(?=\))/, String(opacity)) : \`rgba(${particleColor}, ${opacity})\``
     - 使用：`ctx.strokeStyle = rgbaColor`

3. 确保所有功能保持不变，只是优化了计算方式

4. 添加注释说明优化原因：
   - 在常量定义处添加注释："使用距离平方避免 Math.sqrt() 计算，提升性能"

验证要求：
- 运行 yarn dev 启动开发服务器
- 访问包含 ParticleBackground 的页面（如 /experiment）
- 检查粒子连线是否正常显示
- 检查浏览器控制台是否有错误
- 使用浏览器性能工具检查帧率是否提升
```

**预期结果**:
- 消除每次循环中的 Math.sqrt() 调用（1225次/帧）
- 减少约 30-40% 的计算时间
- 粒子连线视觉效果保持不变

---

### 步骤 1.2：实现空间网格分割优化

**文件路径**: `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
在 components/ParticleBackground.tsx 中实现空间网格分割算法，将 O(n²) 复杂度降低到接近 O(n)。

具体实现要求：

1. 在组件顶部添加网格配置常量：
   ```typescript
   const GRID_SIZE = 200 // 网格大小，应该大于连接距离（150）
   ```

2. 在 useEffect 内部，initParticles 函数之后，添加网格分割相关函数：
   ```typescript
   // 获取粒子所在的网格坐标
   const getGridKey = (x: number, y: number): string => {
     const gridX = Math.floor(x / GRID_SIZE)
     const gridY = Math.floor(y / GRID_SIZE)
     return `${gridX},${gridY}`
   }

   // 获取网格及其相邻网格的坐标
   const getNeighborGrids = (gridX: number, gridY: number): Array<[number, number]> => {
     const neighbors: Array<[number, number]> = []
     for (let dx = -1; dx <= 1; dx++) {
       for (let dy = -1; dy <= 1; dy++) {
         neighbors.push([gridX + dx, gridY + dy])
       }
     }
     return neighbors
   }
   ```

3. 修改 drawParticles 函数中的连线绘制逻辑（第89-105行）：
   - 删除原有的嵌套循环（第90-105行）
   - 替换为基于网格的优化算法：
     ```typescript
     // 将粒子分配到网格中
     const gridMap = new Map<string, typeof particlesRef.current>()
     particlesRef.current.forEach((particle) => {
       const gridKey = getGridKey(particle.x, particle.y)
       if (!gridMap.has(gridKey)) {
         gridMap.set(gridKey, [])
       }
       gridMap.get(gridKey)!.push(particle)
     })

     // 只检查同一网格和相邻网格中的粒子
     particlesRef.current.forEach((particle, i) => {
       const gridX = Math.floor(particle.x / GRID_SIZE)
       const gridY = Math.floor(particle.y / GRID_SIZE)
       const neighborGrids = getNeighborGrids(gridX, gridY)

       neighborGrids.forEach(([nx, ny]) => {
         const gridKey = `${nx},${ny}`
         const gridParticles = gridMap.get(gridKey) || []
         
         gridParticles.forEach((otherParticle) => {
           // 避免重复检查（只检查索引大于当前粒子的粒子）
           const otherIndex = particlesRef.current.indexOf(otherParticle)
           if (otherIndex <= i) return

           const dx = particle.x - otherParticle.x
           const dy = particle.y - otherParticle.y
           const distanceSquared = dx * dx + dy * dy

           if (distanceSquared < CONNECTION_DISTANCE_SQUARED) {
             ctx.beginPath()
             ctx.moveTo(particle.x, particle.y)
             ctx.lineTo(otherParticle.x, otherParticle.y)
             const opacity = 0.1 * (1 - Math.sqrt(distanceSquared) / 150)
             const rgbaColor = particleColor.includes('rgba') 
               ? particleColor.replace(/[\d.]+(?=\))/, String(opacity))
               : `rgba(${particleColor}, ${opacity})`
             ctx.strokeStyle = rgbaColor
             ctx.lineWidth = 0.5
             ctx.stroke()
           }
         })
       })
     })
     ```

4. 确保代码逻辑正确，粒子连线效果与之前一致

5. 添加注释说明优化原理

验证要求：
- 运行 yarn dev 启动开发服务器
- 访问包含 ParticleBackground 的页面
- 检查粒子连线是否正常显示
- 检查浏览器控制台是否有错误
- 使用性能工具对比优化前后的帧率
- 确认距离计算次数大幅减少（从1225次降低到约200-300次）
```

**预期结果**:
- 距离计算次数从 1225 次降低到约 200-300 次
- 减少约 70-80% 的距离计算时间
- 粒子连线视觉效果保持不变

---

### 步骤 1.3：缓存主题颜色

**文件路径**: `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
优化 components/ParticleBackground.tsx 中的主题颜色获取逻辑，使用 useRef 缓存颜色值，减少 DOM 查询。

具体修改要求：

1. 在组件顶部，particlesRef 之后添加颜色缓存 ref：
   ```typescript
   const themeColorRef = useRef<string>('')
   const isDarkRef = useRef<boolean>(false)
   ```

2. 修改 getThemeColor 函数（第56-60行）：
   - 将函数改为返回缓存的颜色，并在需要时更新：
     ```typescript
     const getThemeColor = (): string => {
       if (color) return color
       
       const isDark = document.documentElement.classList.contains('dark')
       
       // 如果主题没有变化，返回缓存值
       if (isDark === isDarkRef.current && themeColorRef.current) {
         return themeColorRef.current
       }
       
       // 主题变化，更新缓存
       isDarkRef.current = isDark
       themeColorRef.current = isDark 
         ? 'rgba(255, 255, 255, 0.1)' 
         : 'rgba(0, 0, 0, 0.1)'
       
       return themeColorRef.current
     }
     ```

3. 修改 MutationObserver 回调（第137-140行）：
   - 在主题变化时，先更新颜色缓存，再重新绘制：
     ```typescript
     const observer = new MutationObserver(() => {
       // 清除缓存，强制重新获取主题颜色
       themeColorRef.current = ''
       isDarkRef.current = !isDarkRef.current
       // 主题变化时重新绘制
       drawParticles()
     })
     ```

4. 在 drawParticles 函数中，确保使用 getThemeColor() 获取颜色（第80行保持不变）

5. 添加注释说明缓存机制

验证要求：
- 运行 yarn dev 启动开发服务器
- 访问包含 ParticleBackground 的页面
- 切换深色/浅色主题，检查粒子颜色是否正确更新
- 检查浏览器控制台是否有错误
- 使用性能工具检查 DOM 查询次数是否减少
```

**预期结果**:
- 减少每次绘制时的 DOM 查询
- 减少字符串操作
- 主题切换功能正常工作

---

### 步骤 1.4：实现帧率控制和页面可见性检测

**文件路径**: `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
在 components/ParticleBackground.tsx 中实现帧率控制和页面可见性检测，优化性能。

具体实现要求：

1. 在组件顶部添加性能监控相关的 ref：
   ```typescript
   const lastFrameTimeRef = useRef<number>(0)
   const frameCountRef = useRef<number>(0)
   const fpsRef = useRef<number>(60)
   const isVisibleRef = useRef<boolean>(true)
   const targetFPSRef = useRef<number>(60)
   const frameSkipRef = useRef<number>(0)
   ```

2. 在 useEffect 内部，添加页面可见性检测：
   ```typescript
   // 页面可见性检测
   const handleVisibilityChange = () => {
     isVisibleRef.current = !document.hidden
     if (!isVisibleRef.current) {
       // 页面不可见时暂停动画
       if (animationFrameRef.current) {
         cancelAnimationFrame(animationFrameRef.current)
         animationFrameRef.current = undefined
       }
     } else {
       // 页面可见时恢复动画
       animate()
     }
   }

   document.addEventListener('visibilitychange', handleVisibilityChange)
   ```

3. 修改 animate 函数（第129-134行），添加帧率控制和性能监控：
   ```typescript
   const animate = (currentTime: number = performance.now()) => {
     if (!isVisibleRef.current) return

     // 计算 FPS
     const deltaTime = currentTime - lastFrameTimeRef.current
     lastFrameTimeRef.current = currentTime
     
     if (deltaTime > 0) {
       const currentFPS = 1000 / deltaTime
       frameCountRef.current++
       
       // 每60帧更新一次 FPS 值
       if (frameCountRef.current % 60 === 0) {
         fpsRef.current = currentFPS
         
         // 根据 FPS 调整目标帧率和跳帧
         if (fpsRef.current < 45) {
           // 低帧率，降低更新频率
           targetFPSRef.current = 30
           frameSkipRef.current = 1 // 每2帧更新一次
         } else if (fpsRef.current < 55) {
           // 中等帧率
           targetFPSRef.current = 45
           frameSkipRef.current = 0 // 每帧更新
         } else {
           // 高帧率
           targetFPSRef.current = 60
           frameSkipRef.current = 0
         }
       }
     }

     // 跳帧控制
     const shouldSkip = frameSkipRef.current > 0 && frameCountRef.current % (frameSkipRef.current + 1) !== 0
     
     if (!shouldSkip) {
       updateParticles()
       drawParticles()
     }

     animationFrameRef.current = requestAnimationFrame(animate)
   }
   ```

4. 修改 animate 函数的初始调用，使用 performance.now()：
   ```typescript
   lastFrameTimeRef.current = performance.now()
   animate(lastFrameTimeRef.current)
   ```

5. 在清理函数中添加页面可见性监听器的移除：
   ```typescript
   return () => {
     window.removeEventListener('resize', resizeCanvas)
     document.removeEventListener('visibilitychange', handleVisibilityChange)
     if (animationFrameRef.current) {
       cancelAnimationFrame(animationFrameRef.current)
     }
     observer.disconnect()
   }
   ```

6. 添加注释说明性能优化机制

验证要求：
- 运行 yarn dev 启动开发服务器
- 访问包含 ParticleBackground 的页面
- 切换到其他标签页，检查动画是否暂停
- 切换回来，检查动画是否恢复
- 使用浏览器性能工具检查帧率
- 在低性能设备上测试，确认自动降级功能
```

**预期结果**:
- 页面不可见时完全停止动画，节省 CPU
- 低性能设备自动降低帧率，保持流畅
- 高性能设备保持 60fps

---

### 步骤 1.5：优化字符串操作

**文件路径**: `components/ParticleBackground.tsx`

**AI 执行 Prompt**:
```
优化 components/ParticleBackground.tsx 中的字符串操作，预计算透明度值，避免在循环中执行字符串替换。

具体修改要求：

1. 在 drawParticles 函数开始处（第78行之后），添加颜色预处理：
   ```typescript
   const drawParticles = () => {
     ctx.clearRect(0, 0, canvas.width, canvas.height)
     const particleColor = getThemeColor()
     
     // 预处理颜色：提取基础颜色值（去除透明度部分）
     let baseColor: string
     let baseOpacity: number
     
     if (particleColor.includes('rgba')) {
       // 提取 rgba 值
       const rgbaMatch = particleColor.match(/rgba?\(([^)]+)\)/)
       if (rgbaMatch) {
         const values = rgbaMatch[1].split(',').map(v => v.trim())
         baseColor = `rgba(${values[0]}, ${values[1]}, ${values[2]}`
         baseOpacity = parseFloat(values[3] || '0.1')
       } else {
         baseColor = particleColor
         baseOpacity = 0.1
       }
     } else {
       baseColor = particleColor
       baseOpacity = 0.1
     }
   ```

2. 在连线绘制循环中（步骤1.2中实现的网格算法部分），优化透明度计算：
   - 将原来的字符串替换操作改为直接构建 rgba 字符串：
     ```typescript
     const opacity = baseOpacity * (1 - Math.sqrt(distanceSquared) / 150)
     const rgbaColor = `${baseColor}, ${opacity})`
     ctx.strokeStyle = rgbaColor
     ```

3. 确保所有功能保持不变

4. 添加注释说明优化原因

验证要求：
- 运行 yarn dev 启动开发服务器
- 访问包含 ParticleBackground 的页面
- 检查粒子连线是否正常显示，透明度渐变是否正确
- 检查浏览器控制台是否有错误
- 使用性能工具检查字符串操作是否减少
```

**预期结果**:
- 减少字符串操作开销
- 连线透明度渐变效果保持不变
- 性能进一步提升

---

## 第二阶段：加载动画系统（基础方案）

### 步骤 2.1：创建骨架屏组件库

**文件路径**: `components/skeletons/ArticleSkeleton.tsx` (新建)

**AI 执行 Prompt**:
```
创建一个新的骨架屏组件 ArticleSkeleton.tsx，用于文章内容的加载占位符。

文件路径：components/skeletons/ArticleSkeleton.tsx

组件要求：
1. 使用 'use client' 指令
2. 创建 ArticleSkeleton 组件，接受可选的 className prop
3. 组件结构应该模拟文章布局：
   - 标题骨架（高度约 40px，宽度 80%）
   - 元信息骨架（日期、作者等，高度约 20px，宽度 60%）
   - 多个段落骨架（每个高度约 16px，宽度 100%，最后一个宽度 70%）
   - 代码块骨架（高度约 200px，宽度 100%，圆角）
   - 图片骨架（高度约 300px，宽度 100%，圆角）

4. 使用 Tailwind CSS 类名实现样式：
   - 背景色：bg-gray-200 dark:bg-gray-700
   - 圆角：rounded
   - 间距：mb-4, mb-2 等
   - 脉冲动画：animate-pulse

5. 脉冲动画使用 Tailwind 的 animate-pulse 类

6. 支持深色/浅色主题

7. 添加适当的 TypeScript 类型定义

8. 导出组件为默认导出

示例结构：
```tsx
'use client'

interface ArticleSkeletonProps {
  className?: string
}

export default function ArticleSkeleton({ className = '' }: ArticleSkeletonProps) {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* 标题骨架 */}
      <div className="h-10 w-4/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      
      {/* 元信息骨架 */}
      <div className="h-5 w-3/5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      
      {/* 段落骨架 */}
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      
      {/* 代码块骨架 */}
      <div className="h-48 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      
      {/* 图片骨架 */}
      <div className="h-72 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
    </div>
  )
}
```

验证要求：
- 创建文件后，运行 yarn dev
- 在某个页面中临时导入并使用该组件
- 检查样式是否正确
- 检查动画是否流畅
- 检查深色/浅色主题切换是否正常
```

**预期结果**:
- 创建 ArticleSkeleton 组件
- 样式和动画正常
- 支持主题切换

---

### 步骤 2.2：创建卡片骨架屏组件

**文件路径**: `components/skeletons/CardSkeleton.tsx` (新建)

**AI 执行 Prompt**:
```
创建一个新的骨架屏组件 CardSkeleton.tsx，用于卡片列表的加载占位符。

文件路径：components/skeletons/CardSkeleton.tsx

组件要求：
1. 使用 'use client' 指令
2. 创建 CardSkeleton 组件，接受可选的 className prop
3. 组件结构应该模拟卡片布局：
   - 图片骨架（高度约 200px，宽度 100%，圆角顶部）
   - 标题骨架（高度约 24px，宽度 80%，margin-top）
   - 描述骨架（2-3行，每行高度约 16px，宽度 100%）
   - 标签骨架（3个小块，每个高度约 20px，宽度约 60px）

4. 使用 Tailwind CSS 类名实现样式
5. 使用 animate-pulse 实现脉冲动画
6. 支持深色/浅色主题
7. 添加 TypeScript 类型定义
8. 导出为默认导出

验证要求：
- 创建文件后测试样式和动画
- 检查主题切换是否正常
```

**预期结果**:
- 创建 CardSkeleton 组件
- 样式和动画正常

---

### 步骤 2.3：创建图片骨架屏组件

**文件路径**: `components/skeletons/ImageSkeleton.tsx` (新建)

**AI 执行 Prompt**:
```
创建一个新的骨架屏组件 ImageSkeleton.tsx，用于图片的加载占位符。

文件路径：components/skeletons/ImageSkeleton.tsx

组件要求：
1. 使用 'use client' 指令
2. 创建 ImageSkeleton 组件，接受以下 props：
   - className?: string
   - width?: number (默认 400)
   - height?: number (默认 300)
   - aspectRatio?: string (可选，如 '16/9')

3. 组件结构：
   - 一个矩形占位符，使用指定的宽高或宽高比
   - 可以显示一个简化的图片图标（可选）

4. 使用 Tailwind CSS 和 animate-pulse
5. 支持深色/浅色主题
6. 添加 TypeScript 类型定义
7. 导出为默认导出

验证要求：
- 创建文件后测试不同尺寸
- 检查动画效果
```

**预期结果**:
- 创建 ImageSkeleton 组件
- 支持自定义尺寸
- 动画流畅

---

### 步骤 2.4：创建列表骨架屏组件

**文件路径**: `components/skeletons/ListSkeleton.tsx` (新建)

**AI 执行 Prompt**:
```
创建一个新的骨架屏组件 ListSkeleton.tsx，用于列表的加载占位符。

文件路径：components/skeletons/ListSkeleton.tsx

组件要求：
1. 使用 'use client' 指令
2. 创建 ListSkeleton 组件，接受以下 props：
   - className?: string
   - itemCount?: number (默认 5)

3. 组件结构：
   - 渲染指定数量的列表项骨架
   - 每个列表项包含：
     - 圆形头像骨架（直径约 40px）
     - 标题骨架（高度约 20px，宽度 60%）
     - 描述骨架（高度约 16px，宽度 80%）

4. 使用 Tailwind CSS 和 animate-pulse
5. 支持深色/浅色主题
6. 添加 TypeScript 类型定义
7. 导出为默认导出

验证要求：
- 创建文件后测试不同数量的列表项
- 检查布局是否正确
```

**预期结果**:
- 创建 ListSkeleton 组件
- 支持自定义列表项数量
- 布局正确

---

### 步骤 2.5：创建骨架屏组件索引文件

**文件路径**: `components/skeletons/index.ts` (新建)

**AI 执行 Prompt**:
```
创建一个索引文件，导出所有骨架屏组件。

文件路径：components/skeletons/index.ts

要求：
1. 导出所有骨架屏组件：
   - ArticleSkeleton
   - CardSkeleton
   - ImageSkeleton
   - ListSkeleton

2. 使用命名导出

示例：
```typescript
export { default as ArticleSkeleton } from './ArticleSkeleton'
export { default as CardSkeleton } from './CardSkeleton'
export { default as ImageSkeleton } from './ImageSkeleton'
export { default as ListSkeleton } from './ListSkeleton'
```

验证要求：
- 创建文件后，测试导入是否正常
- 检查是否有 TypeScript 错误
```

**预期结果**:
- 创建索引文件
- 所有组件可以正常导入

---

### 步骤 2.6：优化 ThreeJSViewer 加载状态

**文件路径**: `components/ThreeJSViewer.tsx`

**AI 执行 Prompt**:
```
优化 components/ThreeJSViewer.tsx 中的加载状态显示，使用更美观的加载动画。

具体修改要求：

1. 导入必要的组件和图标：
   ```typescript
   import { Loader2 } from 'lucide-react'
   ```

2. 修改加载状态显示（第265-269行）：
   - 将简单的文本替换为更美观的加载界面：
     ```tsx
     {isLoading && !error && (
       <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/90 dark:bg-gray-800/90 backdrop-blur-sm">
         <Loader2 className="h-12 w-12 text-primary-500 dark:text-primary-400 animate-spin mb-4" />
         <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
           加载 3D 模型中...
         </p>
         <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
           这可能需要几秒钟
         </p>
       </div>
     )}
     ```

3. 确保样式与整体设计一致
4. 支持深色/浅色主题
5. 动画流畅

验证要求：
- 运行 yarn dev
- 访问包含 ThreeJSViewer 的页面
- 检查加载动画是否正常显示
- 检查主题切换是否正常
- 检查动画是否流畅
```

**预期结果**:
- 加载状态更美观
- 动画流畅
- 主题支持正常

---

### 步骤 2.7：创建全局页面加载组件

**文件路径**: `components/PageLoader.tsx` (新建)

**AI 执行 Prompt**:
```
创建一个全局页面加载组件 PageLoader.tsx，使用粒子系统作为加载动画。

文件路径：components/PageLoader.tsx

组件要求：
1. 使用 'use client' 指令
2. 创建 PageLoader 组件，接受以下 props：
   - isLoading?: boolean
   - progress?: number (0-100，可选)
   - message?: string (可选)

3. 组件结构：
   - 全屏覆盖层（fixed，inset-0，z-50）
   - 背景：半透明深色或浅色，根据主题
   - 中心内容区域：
     - 简化的粒子动画（可以使用简化版的 ParticleBackground）
     - 或使用旋转的加载图标
     - 加载文本或进度条
     - 可选的进度百分比

4. 使用 Framer Motion 实现淡入淡出动画
5. 支持深色/浅色主题
6. 添加 TypeScript 类型定义
7. 导出为默认导出

简化实现方案（如果粒子系统太复杂）：
- 使用多个小圆点，从中心向外扩散的动画
- 或使用旋转的粒子图标
- 配合进度条显示加载进度

验证要求：
- 创建文件后，在某个页面中测试
- 检查动画是否流畅
- 检查主题切换是否正常
- 检查淡入淡出效果
```

**预期结果**:
- 创建 PageLoader 组件
- 动画流畅美观
- 支持进度显示

---

## 第三阶段：渐进式内容加载

### 步骤 3.1：优化博客列表页使用骨架屏

**文件路径**: `layouts/ListLayout.tsx`

**AI 执行 Prompt**:
```
优化 layouts/ListLayout.tsx，在内容加载时显示骨架屏。

具体修改要求：

1. 导入骨架屏组件：
   ```typescript
   import { CardSkeleton } from '@/components/skeletons'
   ```

2. 在组件中添加加载状态管理（如果需要）：
   - 如果数据是异步加载的，添加 loading 状态
   - 如果数据是同步的，可以跳过此步骤

3. 在渲染博客列表的地方，添加条件渲染：
   - 如果正在加载，显示 CardSkeleton 组件（显示3-5个）
   - 如果加载完成，显示实际内容

4. 使用 FadeIn 或 SlideIn 动画组件包装实际内容，实现渐进式出现

5. 确保布局一致，避免布局偏移（CLS）

验证要求：
- 运行 yarn dev
- 访问博客列表页
- 检查骨架屏是否正确显示
- 检查内容加载后的动画效果
- 检查是否有布局偏移
```

**预期结果**:
- 博客列表页使用骨架屏
- 内容渐进式加载
- 无布局偏移

---

### 步骤 3.2：优化博客文章页使用骨架屏

**文件路径**: `layouts/PostLayout.tsx`

**AI 执行 Prompt**:
```
优化 layouts/PostLayout.tsx，在内容加载时显示骨架屏。

具体修改要求：

1. 导入骨架屏组件：
   ```typescript
   import { ArticleSkeleton } from '@/components/skeletons'
   ```

2. 在内容渲染处添加条件渲染：
   - 如果内容正在加载，显示 ArticleSkeleton
   - 如果加载完成，显示实际内容

3. 使用 FadeIn 动画组件包装实际内容

4. 确保布局一致

验证要求：
- 运行 yarn dev
- 访问博客文章页
- 检查骨架屏是否正确显示
- 检查内容加载动画
```

**预期结果**:
- 博客文章页使用骨架屏
- 内容渐进式加载

---

## 实施清单

### 第一阶段：粒子动画优化（必须完成）

1. ✅ 步骤 1.1：优化距离计算（使用距离平方）
2. ✅ 步骤 1.2：实现空间网格分割优化
3. ✅ 步骤 1.3：缓存主题颜色
4. ✅ 步骤 1.4：实现帧率控制和页面可见性检测
5. ✅ 步骤 1.5：优化字符串操作

### 第二阶段：加载动画系统（基础方案）

6. ✅ 步骤 2.1：创建 ArticleSkeleton 组件
7. ✅ 步骤 2.2：创建 CardSkeleton 组件
8. ✅ 步骤 2.3：创建 ImageSkeleton 组件
9. ✅ 步骤 2.4：创建 ListSkeleton 组件
10. ✅ 步骤 2.5：创建骨架屏组件索引文件
11. ✅ 步骤 2.6：优化 ThreeJSViewer 加载状态
12. ✅ 步骤 2.7：创建全局页面加载组件

### 第三阶段：渐进式内容加载

13. ✅ 步骤 3.1：优化博客列表页使用骨架屏
14. ✅ 步骤 3.2：优化博客文章页使用骨架屏

---

## 验证和测试

### 每个步骤完成后必须验证：

1. **功能验证**：
   - 运行 `yarn dev` 启动开发服务器
   - 访问相关页面，检查功能是否正常
   - 检查浏览器控制台是否有错误

2. **性能验证**：
   - 使用浏览器开发者工具的性能面板
   - 检查帧率是否提升
   - 检查内存使用是否正常

3. **视觉验证**：
   - 检查视觉效果是否与预期一致
   - 检查深色/浅色主题切换是否正常
   - 检查响应式布局是否正常

4. **兼容性验证**：
   - 在不同浏览器中测试（Chrome、Firefox、Safari、Edge）
   - 在移动设备上测试
   - 检查是否有兼容性问题

### 最终验证：

1. 运行 `yarn build` 确保构建成功
2. 运行 `yarn lint` 确保代码质量
3. 使用 Lighthouse 测试性能分数
4. 检查所有页面功能正常

---

## 注意事项

1. **按顺序执行**：步骤之间有依赖关系，必须按顺序执行
2. **及时测试**：每个步骤完成后立即测试，不要累积多个步骤
3. **备份代码**：执行前确保代码已提交或备份
4. **错误处理**：如果某个步骤失败，立即停止并检查问题
5. **性能监控**：每个步骤都要检查性能影响

---

**最后更新**: 2025-01-XX
**状态**: 规划完成，等待执行

