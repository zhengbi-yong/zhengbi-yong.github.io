'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import URDFLoader from 'urdf-loader'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Spinner } from '@/components/loaders'

interface ThreeJSViewerProps {
  className?: string
  modelPath?: string
}

/**
 * ThreeJSViewer - 3D URDF 模型查看器组件
 * 独立的、可复用的 3D 模型查看器，支持 URDF 格式的机器人模型
 */
export default function ThreeJSViewer({ className = '', modelPath }: ThreeJSViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef(new THREE.Scene())
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<InstanceType<typeof OrbitControls> | null>(null)
  const animationId = useRef<number | null>(null)
  const retryCountRef = useRef(0)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const maxRetries = 3

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    // 在 effect 开始时复制 ref 值，避免在清理函数中使用可能已改变的 ref
    const currentScene = sceneRef.current
    const currentContainer = containerRef.current

    // 检查容器尺寸
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) {
      console.warn('ThreeJSViewer: 容器尺寸为 0，等待容器渲染')
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
      rendererRef.current.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // 性能优化
      container.appendChild(rendererRef.current.domElement)

      // 轨道控制器配置
      controlsRef.current = new OrbitControls(cameraRef.current, rendererRef.current.domElement)
      controlsRef.current.enableDamping = true
      controlsRef.current.dampingFactor = 0.05
      controlsRef.current.screenSpacePanning = false
      controlsRef.current.minDistance = 0.2
      controlsRef.current.maxDistance = 2
      controlsRef.current.maxPolarAngle = Math.PI / 2 // 限制垂直旋转角度

      // 添加环境光
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
      sceneRef.current.add(ambientLight)

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
      directionalLight.position.set(5, 5, 5)
      directionalLight.castShadow = true // 启用阴影
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
          console.log('全部资源加载完成')
          setIsLoading(false)
          setError(null)
        },
        (url, loaded, total) => {
          console.log(`加载进度: ${((loaded / total) * 100).toFixed(1)}%`)
        },
        (url) => {
          console.error('资源加载失败:', url)
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

      console.log(`正在加载URDF (尝试 ${retryCount + 1}/${maxRetries}):`, urdfPath)

      // 设置超时
      const timeoutId = setTimeout(() => {
        if (retryCount < maxRetries - 1) {
          console.warn(`加载超时，准备重试 (${retryCount + 1}/${maxRetries})`)
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
          console.log('模型加载成功')
          robot.rotation.x = -Math.PI / 2
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
            console.log(`加载进度: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`)
          } else {
            console.log('加载中...')
          }
        },
        (error) => {
          clearTimeout(timeoutId)
          console.error('加载失败:', error)
          if (retryCount < maxRetries - 1) {
            console.log(`准备重试 (${retryCount + 1}/${maxRetries})`)
            setTimeout(() => loadRobot(retryCount + 1), 1000) // 1秒后重试
          } else {
            setError(`模型加载失败: ${error.message || '未知错误'}`)
            setIsLoading(false)
          }
        }
      )
    }

    // 渲染循环
    const animate = () => {
      animationId.current = requestAnimationFrame(animate)
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

    try {
      initThree()
      loadRobot()
      animate()
    } catch (err) {
      console.error('ThreeJSViewer 初始化失败:', err)
      setError(`初始化失败: ${err instanceof Error ? err.message : '未知错误'}`)
      setIsLoading(false)
    }

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
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
        if (currentContainer && currentRenderer.domElement.parentNode === currentContainer) {
          currentContainer.removeChild(currentRenderer.domElement)
        }
        rendererRef.current = null
      }
      cameraRef.current = null
    }
  }, [modelPath])

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
