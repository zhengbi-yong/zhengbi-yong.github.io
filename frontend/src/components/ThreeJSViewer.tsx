// @ts-nocheck
'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import URDFLoader from 'urdf-loader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Spinner } from '@/components/loaders'
import { logger } from '@/lib/utils/logger'

interface QualityProfile {
  pixelRatio?: number
  enableShadows?: boolean
  lightIntensity?: number
  maxDistance?: number
}

interface ThreeJSViewerProps {
  className?: string
  modelPath?: string
  qualityProfile?: QualityProfile
}

/**
 * ThreeJSViewer - 3D URDF 模型查看器组件
 * 独立的、可复用的 3D 模型查看器，支持 URDF 格式的机器人模型
 */
export default function ThreeJSViewer({
  className = '',
  modelPath,
  qualityProfile,
}: ThreeJSViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef(new THREE.Scene())
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null)
  const animationId = useRef<number | null>(null)
  const retryCountRef = useRef(0)
  const modelRef = useRef<THREE.Object3D | null>(null)
  const isVisibleRef = useRef<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const maxRetries = 3

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 在 effect 开始时复制 ref 值，避免在清理函数中使用可能已改变的 ref
    const currentScene = sceneRef.current
    const currentContainer = containerRef.current

    // 初始化页面可见性状态
    isVisibleRef.current = !document.hidden

    // 检查容器尺寸
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) {
      logger.warn('ThreeJSViewer: 容器尺寸为 0，等待容器渲染')
      // 等待容器渲染
      const checkSize = setInterval(() => {
        if (container.clientWidth > 0 && container.clientHeight > 0) {
          clearInterval(checkSize)
          // 重新触发 useEffect
          setIsLoading(true)
        }
      }, 100)
      return () => clearInterval(checkSize)
    }

    // 初始化Three.js环境
    const initThree = () => {
      if (!container) return

      // 创建相机
      cameraRef.current = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
      cameraRef.current.position.set(2, 2, 2)
      cameraRef.current.lookAt(0, 0, 0)

      // 初始化渲染器
      rendererRef.current = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true, // 启用透明背景
      })
      rendererRef.current.setSize(width, height)
      const desiredPixelRatio =
        qualityProfile?.pixelRatio ?? Math.min(window.devicePixelRatio || 1, 2)
      rendererRef.current.setPixelRatio(desiredPixelRatio) // 性能优化
      container.appendChild(rendererRef.current.domElement)

      // 轨道控制器配置
      controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement)
      controlsRef.current.enableDamping = true
      controlsRef.current.dampingFactor = 0.05
      controlsRef.current.screenSpacePanning = false
      controlsRef.current.minDistance = 0.2
      controlsRef.current.maxDistance = qualityProfile?.maxDistance ?? 2
      controlsRef.current.maxPolarAngle = Math.PI / 2 // 限制垂直旋转角度

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(
        0xffffff,
        (qualityProfile?.lightIntensity ?? 1) * 0.4
      )
      sceneRef.current.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(
        0xffffff,
        qualityProfile?.lightIntensity ?? 1
      )
      directionalLight.position.set(5, 5, 5)
      directionalLight.castShadow = Boolean(qualityProfile?.enableShadows)
      sceneRef.current.add(directionalLight)
    }

    // 加载URDF模型（带重试机制）
    const loadRobot = (retryCount = 0) => {
      if (retryCount >= maxRetries) {
        setError('模型加载失败，已重试 3 次')
        setIsLoading(false)
        return
      }

      const manager = new THREE.LoadingManager(
        () => {
          logger.log('全部资源加载完成')
          setIsLoading(false)
          setError(null)
        },
        (url, loaded, total) => {
          logger.log(`加载进度: ${((loaded / total) * 100).toFixed(1)}%`)
        },
        (url) => {
          logger.error('资源加载失败:', url)
          // 单个资源失败不中断整个加载过程
        }
      )

      const loader = new URDFLoader(manager)

      // 修正包路径配置
      loader.packages = {
        'SO_5DOF_ARM100_05d.SLDASM': '/models/SO_5DOF_ARM100_05d.SLDASM',
      }

      // 使用传入的 modelPath 或默认路径
      const urdfPath =
        modelPath || '/models/SO_5DOF_ARM100_05d.SLDASM/urdf/SO_5DOF_ARM100_05d.SLDASM.urdf'

      logger.log(`正在加载URDF (尝试 ${retryCount + 1}/${maxRetries}):`, urdfPath)

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (retryCount < maxRetries - 1) {
          logger.warn(`加载超时，准备重试 (${retryCount + 1}/${maxRetries})`)
          setTimeout(() => loadRobot(retryCount + 1), 1000) // 1秒后重试
        } else {
          setError('模型加载超时')
          setIsLoading(false)
        }
      }, 30000) // 30秒超时

      loader.load(
        urdfPath,
        (robot) => {
          clearTimeout(timeoutId)
          logger.log('模型加载成功')
          robot.rotation.x = -Math.PI / 2
          if (modelRef.current) {
            sceneRef.current.remove(modelRef.current)
            disposeObject(modelRef.current)
          }
          modelRef.current = robot
          sceneRef.current.add(robot)

          // 自动调整视角
          const bbox = new THREE.Box3().setFromObject(robot)
          const center = bbox.getCenter(new THREE.Vector3())
          const size = bbox.getSize(new THREE.Vector3())
          const maxDim = Math.max(size.x, size.y, size.z)
          if (cameraRef.current && controlsRef.current) {
            cameraRef.current.position.copy(center).add(new THREE.Vector3(maxDim, maxDim, maxDim))
            controlsRef.current.target.copy(center)
            controlsRef.current.update()
          }
          setIsLoading(false)
          setError(null)
        },
        // 进度回调
        (progress) => {
          if (
            progress &&
            typeof progress.loaded === 'number' &&
            typeof progress.total === 'number'
          ) {
            logger.log(`加载进度: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`)
          } else {
            logger.log('加载中...')
          }
        },
        (error) => {
          clearTimeout(timeoutId)
          logger.error('加载失败:', error)
          if (retryCount < maxRetries - 1) {
            logger.log(`准备重试 (${retryCount + 1}/${maxRetries})`)
            setTimeout(() => loadRobot(retryCount + 1), 1000) // 1秒后重试
          } else {
            setError(`模型加载失败: ${error.message || '未知错误'}`)
            setIsLoading(false)
          }
        }
      )
    }

    // 页面可见性变化处理
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden
    }

    // 渲染循环
    const animate = () => {
      animationId.current = requestAnimationFrame(animate)
      // 仅在页面可见时执行渲染
      if (!isVisibleRef.current) {
        return
      }
      if (controlsRef.current) {
        controlsRef.current.update() // 必须调用以启用阻尼效果
      }
      if (rendererRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }

    // 添加窗口大小调整事件
    const handleResize = () => {
      const container = containerRef.current
      if (!container || !rendererRef.current || !cameraRef.current) return

      const width = container.clientWidth
      const height = container.clientHeight

      if (width === 0 || height === 0) return // 避免无效尺寸

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    try {
      initThree()
      loadRobot()
      animate()
    } catch (err) {
      logger.error('ThreeJSViewer 初始化失败:', err)
      setError(`初始化失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsLoading(false)
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      const currentAnimationId = animationId.current
      const currentControls = controlsRef.current
      const currentRenderer = rendererRef.current

      if (currentAnimationId !== null) {
        cancelAnimationFrame(currentAnimationId)
        animationId.current = null
      }
      if (currentControls) {
        currentControls.dispose() // 重要！释放控制器资源
        controlsRef.current = null
      }
      if (currentRenderer) {
        currentRenderer.dispose()
        // 使用在 effect 开始时复制的 currentScene
        currentScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else if (child.material) {
              child.material.dispose()
            }
          }
        })
        currentScene.clear()
        if (currentContainer && currentRenderer.domElement.parentNode === currentContainer) {
          currentContainer.removeChild(currentRenderer.domElement)
        }
        rendererRef.current = null
      }
      modelRef.current = null
      cameraRef.current = null
    }
  }, [modelPath, qualityProfile])

  return (
    <div
      ref={containerRef}
      className={`relative h-96 w-full overflow-hidden rounded-lg border ${className}`}
      style={{ backgroundColor: '#f0f0f0' }}
    >
      {isLoading && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/90 backdrop-blur-sm dark:bg-gray-800/90">
          <Spinner size="lg" className="mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">加载 3D 模型中...</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">这可能需要几秒钟</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100/80 dark:bg-gray-800/80">
          <p className="mb-2 text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null)
              setIsLoading(true)
              retryCountRef.current = 0
            }}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            重试
          </button>
        </div>
      )}
    </div>
  )
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => material.dispose())
      } else if (child.material) {
        child.material.dispose()
      }
    }
  })
}
