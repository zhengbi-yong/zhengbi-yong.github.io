'use client'

import { useEffect, useRef, useState } from 'react'

interface MatterAnimationProps {
  iconUrls?: string[]
  count?: number
  className?: string
  containerClassName?: string
  pad?: number
  margin?: number
  scaleFactor?: number
  noRotate?: boolean
}

/**
 * MatterAnimation - Matter.js 物理引擎动画组件
 * 参考 Astro 项目的 Matter.js 实现
 * 图标从上方掉落，可以拖拽，有物理碰撞效果
 */
export default function MatterAnimation({
  iconUrls = [],
  count = 15,
  className = '',
  containerClassName = '',
  pad = 2,
  margin = 1,
  scaleFactor = 0.75,
  noRotate = false,
}: MatterAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<HTMLDivElement>(null)
  const canvasHostRef = useRef<HTMLDivElement>(null)
  const domLayerRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const engineRef = useRef<{
    engine: any
    runner: any
    cleanup: () => void
  } | null>(null)

  useEffect(() => {
    if (!viewRef.current || isInitialized) return

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            obs.unobserve(entry.target)
            initTricksAnimation()
          }
        })
      },
      { threshold: 0.1 }
    )

    observer.observe(viewRef.current)

    return () => {
      observer.disconnect()
      // 清理 Matter.js 引擎
      if (engineRef.current) {
        engineRef.current.cleanup()
        engineRef.current = null
      }
    }
  }, [isInitialized])

  async function initTricksAnimation() {
    if (typeof window === 'undefined') return

    // 动态导入 Matter.js
    let Matter: typeof import('matter-js')
    try {
      Matter = await import('matter-js')
    } catch (error) {
      console.error('[MatterAnimation] Failed to load matter-js. Please install: npm install matter-js', error)
      return
    }

    const container = containerRef.current
    const canvasHost = canvasHostRef.current
    const domLayer = domLayerRef.current

    if (!container || !canvasHost || !domLayer) {
      console.error(
        '[MatterAnimation] Missing required containers (containerRef, canvasHostRef, domLayerRef)'
      )
      return
    }

    // 如果图标 URL 为空，使用默认的技术栈图标
    const defaultIconUrls = [
      '/static/images/logo.png',
      '/static/images/github-traffic.png',
      '/static/images/google.png',
    ]

    const finalIconUrls = iconUrls.length > 0 ? iconUrls : defaultIconUrls

    // 获取容器尺寸
    let { width: cw, height: ch } = container.getBoundingClientRect()
    let W = Math.max(cw - pad, 100)
    let H = Math.max(ch - pad, 100)

    // 创建物理引擎
    const engine = Matter.Engine.create()
    const world = engine.world

    // 鼠标拖拽约束
    const mouseConstraint = Matter.MouseConstraint.create(engine, {
      mouse: Matter.Mouse.create(canvasHost),
      constraint: { render: { visible: false }, stiffness: 1 },
    })
    Matter.World.add(world, mouseConstraint)

    // 边界（地面和左右墙）
    let ground = Matter.Bodies.rectangle(W / 2, H - margin, W, 14, { isStatic: true })
    let wallL = Matter.Bodies.rectangle(margin, H / 2, 14, H, { isStatic: true })
    let wallR = Matter.Bodies.rectangle(W - margin, H / 2, 14, H, { isStatic: true })
    Matter.World.add(world, [ground, wallL, wallR])

    // 工具函数
    function clamp(v: number, min: number, max: number) {
      return Math.max(min, Math.min(max, v))
    }

    function randRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    // 预加载图片
    function loadImage(url: string): Promise<HTMLImageElement> {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.decoding = 'async'
        img.loading = 'eager'
        img.src = url
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Image load failed: ' + url))
      })
    }

    let iconsImgs: HTMLImageElement[] = []
    try {
      iconsImgs = await Promise.all(finalIconUrls.map(loadImage))
    } catch (e) {
      console.error('[MatterAnimation] Image load failed:', e)
    }

    // 计算面积范围
    function computeAreaRange() {
      const baseArea = W * H
      const areaMin = clamp(baseArea / 20, 12000, 30000)
      const areaMax = clamp(baseArea / 10, 20000, 50000)
      return { areaMin, areaMax }
    }

    let { areaMin, areaMax } = computeAreaRange()

    // 图标刚体类
    class IconBody {
      w: number
      h: number
      body: Matter.Body
      el: HTMLDivElement

      constructor(img: HTMLImageElement) {
        const x = Math.random() * W
        const y = Math.random() * -H
        const r =
          img.naturalWidth > 0 && img.naturalHeight > 0
            ? img.naturalWidth / img.naturalHeight
            : 1

        // 目标面积（在范围内随机）
        const A = randRange(areaMin, areaMax)

        // 计算宽高：w = sqrt(A*r), h = w/r
        let w = Math.sqrt(A * r)
        let h = w / r

        // 全局缩放
        w *= scaleFactor
        h *= scaleFactor

        this.w = w
        this.h = h

        // 物理矩形刚体
        this.body = Matter.Bodies.rectangle(x, y, this.w, this.h, {
          restitution: 0.35,
          friction: 0.1,
          frictionAir: 0.02,
          density: clamp((this.w * this.h) / 40000, 0.001, 0.02),
          inertia: noRotate ? Infinity : undefined,
        })

        // DOM: 容器 + img
        this.el = document.createElement('div')
        this.el.className = 'tricks-circle'
        this.el.style.width = `${this.w}px`
        this.el.style.height = `${this.h}px`

        const node = img.cloneNode(true) as HTMLImageElement
        node.style.width = '100%'
        node.style.height = '100%'
        node.style.objectFit = 'contain'
        node.alt = node.alt || 'icon'
        this.el.appendChild(node)

        domLayer.appendChild(this.el)
      }

      update() {
        const { x, y } = this.body.position
        const angle = this.body.angle

        if (noRotate) {
          this.el.style.transform = `translate(${x - this.w / 2}px, ${y - this.h / 2}px)`
        } else {
          this.el.style.transform = `translate(${x - this.w / 2}px, ${y - this.h / 2}px) rotate(${angle}rad)`
        }
      }
    }

    // 创建图标刚体
    const total = Math.min(iconsImgs.length, count)
    const iconsBodies: IconBody[] = []

    for (let i = 0; i < total; i++) {
      iconsBodies.push(new IconBody(iconsImgs[i]))
    }

    iconsBodiesRef.current = iconsBodies
    Matter.World.add(world, iconsBodies.map((it) => it.body))

    // 启动引擎
    const runner = Matter.Runner.create()
    Matter.Runner.run(runner, engine)

    // 物理更新后同步 DOM
    Matter.Events.on(engine, 'afterUpdate', () => {
      iconsBodies.forEach((it) => it.update())
    })

    // 响应式处理
    const handleResize = () => {
      if (!container) return
      const rect = container.getBoundingClientRect()
      W = Math.max(rect.width - pad, 100)
      H = Math.max(rect.height - pad, 100)

      Matter.Body.setPosition(ground, Matter.Vector.create(W / 2, H - margin))
      Matter.Body.setPosition(wallL, Matter.Vector.create(margin, H / 2))
      Matter.Body.setPosition(wallR, Matter.Vector.create(W - margin, H / 2))

      const range = computeAreaRange()
      areaMin = range.areaMin
      areaMax = range.areaMax
    }

    window.addEventListener('resize', handleResize)

    // 保存清理函数
    const cleanup = () => {
      window.removeEventListener('resize', handleResize)
      Matter.Runner.stop(runner)
      Matter.Engine.clear(engine)
      iconsBodies.forEach((icon) => {
        if (icon.el.parentNode) {
          icon.el.parentNode.removeChild(icon.el)
        }
      })
    }

    engineRef.current = { engine, runner, cleanup }
    setIsInitialized(true)
  }

  return (
    <div className={`matter-wrapper ${containerClassName}`} ref={containerRef}>
      <div id="matter" className="tricks-spacer zIndex-3d">
        <div className="tricks-view" id="tricks-view" ref={viewRef}></div>
      </div>
      <div className="tricks-matter zIndex-3d">
        <div className={`tricks-canvas ${className}`} ref={canvasHostRef}></div>
        <div className="tricks-elements" ref={domLayerRef}></div>
      </div>
      <style jsx>{`
        .matter-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
        }

        #matter {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .tricks-spacer {
          position: relative;
          display: flex;
          width: 100%;
          height: 100%;
          justify-content: center;
          align-items: center;
        }

        .tricks-view {
          position: absolute;
          left: 0%;
          top: auto;
          right: 0%;
          bottom: 0%;
          height: 99%;
          margin-bottom: 20px;
        }

        .tricks-matter {
          position: absolute;
          left: 0%;
          right: 0%;
          bottom: 0%;
          z-index: 1;
          width: 100%;
          height: 100%;
        }

        .tricks-canvas {
          position: absolute;
          width: 100%;
          height: 100%;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          cursor: grab;
        }

        .tricks-canvas:active {
          cursor: grabbing;
        }

        .tricks-elements,
        .tricks-spacer {
          pointer-events: none;
        }

        .tricks-circle {
          position: absolute;
          overflow: hidden;
          background: transparent;
          will-change: transform;
        }

        .tricks-circle img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      `}</style>
    </div>
  )
}

