'use client'

import { useEffect, useRef, useState } from 'react'
import { webGLContextManager } from '@/lib/webgl/WebGLContextManager'

interface GaussianSplatProps {
  /** URL to .spz / .ply / .splat / .ksplat Gaussian Splat file */
  url: string
  height?: number
  /** Auto-rotate the model (default: false — user controls camera) */
  autoRotate?: boolean
  backgroundColor?: string
  className?: string
  /** Start camera position [x, y, z] */
  startPosition?: [number, number, number]
  /** Look-at target [x, y, z] */
  lookAt?: [number, number, number]
  /** View fov in degrees */
  fov?: number
  /** Splat scale multiplier */
  splatScale?: number
  /** Show loading spinner */
  showLoading?: boolean
}

type SparkState = 'loading' | 'ready' | 'error'

// Stable ID counter — avoids useId() which generates new IDs every render
let _gsplatCounter = 0

// Shared promise — all instances share one module load
let sparkLoadPromise: Promise<{ SparkRenderer: any; SplatMesh: any; SparkControls: any; THREE: any }> | null = null

async function loadSparkOnce() {
  if (sparkLoadPromise) return sparkLoadPromise
  sparkLoadPromise = (async () => {
    const THREE = await import('three')
    const spark = await import('@sparkjsdev/spark')
    return {
      SparkRenderer: spark.SparkRenderer,
      SplatMesh: spark.SplatMesh,
      SparkControls: spark.SparkControls,
      THREE,
    }
  })()
  return sparkLoadPromise
}

export default function GaussianSplat({
  url,
  height = 480,
  autoRotate = false,
  backgroundColor,
  className = '',
  startPosition = [0, 0, -3],
  lookAt = [0, 0, 0],
  fov = 60,
  splatScale = 1,
  showLoading = true,
}: GaussianSplatProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<SparkState>('loading')
  const [errorMsg, setErrorMsg] = useState<string>('')
  // Stable instance ID — does NOT change between renders
  const instanceId = useRef(`gsplat-${++_gsplatCounter}`).current

  useEffect(() => {
    let rafId = 0
    let cancelled = false
    let controls: any = null
    let splat: any = null
    // THREE.Clock gives us deltaTime for SparkControls
    let clock: any = null

    async function init(): Promise<() => void> {
      if (!canvasRef.current || !containerRef.current || cancelled) return async () => {}
      const canvas = canvasRef.current
      const container = containerRef.current

      let sparkModule: { SparkRenderer: any; SplatMesh: any; SparkControls: any; THREE: any }
      try {
        sparkModule = await loadSparkOnce()
      } catch (err) {
        if (!cancelled) {
          setState('error')
          setErrorMsg(`Spark module load failed: ${(err as Error).message || String(err)}`)
        }
        return async () => {}
      }

      if (cancelled) return async () => {}
      const { SparkRenderer, SplatMesh, SparkControls, THREE } = sparkModule

      const gl = webGLContextManager.acquire(instanceId, canvas)
      const { width: containerWidth } = container.getBoundingClientRect()
      canvas.width = containerWidth || 800
      canvas.height = height

      try {
        // THREE.Clock is deprecated but still works; suppress the warning
         
        clock = new THREE.Clock()

        const scene = new THREE.Scene()
        scene.background = new THREE.Color(backgroundColor ?? '#111111')

        const camera = new THREE.PerspectiveCamera(fov, canvas.width / canvas.height, 0.01, 1000)
        camera.position.set(...startPosition)
        camera.lookAt(...lookAt)

        const renderer = new THREE.WebGLRenderer({
          canvas,
          context: gl,
          antialias: true,
          preserveDrawingBuffer: true,
        })
        renderer.setSize(canvas.width, canvas.height)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(new THREE.Color(backgroundColor ?? '#111111'))

        // Recover from context loss (e.g. after HMR / tab backgrounding)
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          cancelAnimationFrame(rafId)
        })
        canvas.addEventListener('webglcontextrestored', () => {
          // Re-initialize renderer internals when context is restored
          animate()
        })

        // SparkControls handles mouse drag / scroll / keyboard / gamepad
        // Pass camera as control target (it has position + quaternion)
        controls = new SparkControls({ canvas })

        const spark = new SparkRenderer({ renderer })
        scene.add(spark)

        let resolved = false
        splat = new SplatMesh({
          url,
          onLoad: () => {
            resolved = true
            if (!cancelled) setState('ready')
          },
        })
        splat.scale.setScalar(splatScale)
        scene.add(splat)

        // Safety: 30s timeout
        const timeoutId = setTimeout(() => {
          if (!resolved && !cancelled) {
            const numSplats = (splat as any).numSplats ?? 0
            if (numSplats > 0) {
              resolved = true
              if (!cancelled) setState('ready')
            }
          }
        }, 30000)

        splat.initialized
          .then(() => {
            clearTimeout(timeoutId)
            if (!resolved && !cancelled) {
              resolved = true
              setState('ready')
            }
          })
          .catch((err: Error) => {
            clearTimeout(timeoutId)
            if (!cancelled) {
              setState('error')
              setErrorMsg(err?.message || `Failed to load: ${url}`)
            }
          })

        const animate = () => {
          rafId = requestAnimationFrame(animate)
          const deltaTime = clock.getDelta()
          // SparkControls updates camera position + quaternion from mouse/keyboard
          controls.update(camera, camera)
          // autoRotate spins the model itself (not the camera)
          if (autoRotate && splat) {
            splat.rotation.y += deltaTime * 0.5
          }
          renderer.render(scene, camera)
        }
        rafId = requestAnimationFrame(animate)

        const ro = new ResizeObserver(() => {
          if (!container || !renderer) return
          const { width: w } = container.getBoundingClientRect()
          renderer.setSize(w, height)
          camera.aspect = w / height
          camera.updateProjectionMatrix()
        })
        ro.observe(container)

        return () => {
          ro.disconnect()
          cancelAnimationFrame(rafId)
          clearTimeout(timeoutId)
          controls?.dispose()
          renderer.dispose()
          webGLContextManager.release(instanceId)
        }
      } catch (err) {
        if (!cancelled) {
          setState('error')
          setErrorMsg((err as Error).message || 'Failed to initialize Spark renderer')
        }
        webGLContextManager.release(instanceId)
        return () => {}
      }
    }

    const cleanupPromise = init()
    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      cleanupPromise.then(cleanup => cleanup?.())
      webGLContextManager.release(instanceId)
    }
   
  }, [url, height, fov])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl ${className}`}
      style={{ height }}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {state === 'loading' && showLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100/80 dark:bg-zinc-900/80">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-primary-500" />
            <p className="text-sm text-zinc-500">Loading 3D Gaussian Splat...</p>
          </div>
        </div>
      )}

      {state === 'error' && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
          <div className="flex flex-col items-center gap-2 text-center px-4">
            <span className="text-3xl">⚠️</span>
            <p className="text-sm text-red-500 font-medium">Failed to load 3D model</p>
            <p className="text-xs text-zinc-400 max-w-xs">{errorMsg || 'Unknown error'}</p>
          </div>
        </div>
      )}

      {state === 'ready' && (
        <div className="absolute bottom-2 right-2 text-[10px] text-zinc-300 bg-zinc-900/60 px-2 py-1 rounded backdrop-blur">
          Drag to rotate · Scroll to zoom
        </div>
      )}
    </div>
  )
}
