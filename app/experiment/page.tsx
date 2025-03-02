'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import URDFLoader from 'urdf-loader'
import projectsData from '@/data/projectsData'
import Card from '@/components/Card'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Button } from '@/components/components/ui/button'
export default function Projects() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef(new THREE.Scene())
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const animationId = useRef<number | null>(null)

  useEffect(() => {
    // 初始化Three.js环境
    const initThree = () => {
      const container = containerRef.current
      if (!container) return
      const width = container.clientWidth
      const height = container.clientHeight

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

      // 轨道控制器配置（综合网页[1][2][6][7]最佳实践）
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

    // 加载URDF模型
    const loadRobot = () => {
      const manager = new THREE.LoadingManager(
        () => console.log('全部资源加载完成'),
        (url, loaded, total) => console.log(`加载进度: ${((loaded / total) * 100).toFixed(1)}%`)
      )
      const loader = new URDFLoader(manager)

      // 修正包路径配置
      loader.packages = {
        'SO_5DOF_ARM100_05d.SLDASM': '/models/SO_5DOF_ARM100_05d.SLDASM',
      }

      // 修正URDF文件路径
      const urdfPath = '/models/SO_5DOF_ARM100_05d.SLDASM/urdf/SO_5DOF_ARM100_05d.SLDASM.urdf'

      console.log('正在加载URDF:', urdfPath)

      // 修改加载过程，移除可能有问题的进度回调
      loader.load(
        urdfPath,
        (robot) => {
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
          sceneRef.current.add(robot)
        },
        // 修改进度回调，增加安全检查
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
          console.error('加载失败:', error)
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

      cameraRef.current.aspect = width / height
      cameraRef.current.updateProjectionMatrix()
      rendererRef.current.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    initThree()
    loadRobot()
    animate()

    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      if (animationId.current !== null) {
        cancelAnimationFrame(animationId.current)
      }
      if (controlsRef.current) {
        controlsRef.current.dispose() // 重要！释放控制器资源
      }
      if (rendererRef.current) {
        rendererRef.current.dispose()
        sceneRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry.dispose()
            if (Array.isArray(child.material)) {
              child.material.forEach((material) => material.dispose())
            } else if (child.material) {
              child.material.dispose()
            }
          }
        })
        containerRef.current?.removeChild(rendererRef.current.domElement)
      }
    }
  }, [])

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      <div className="space-y-2 pt-6 pb-8 md:space-y-5">
        <h1 className="text-3xl leading-9 font-extrabold tracking-tight text-gray-900 sm:text-4xl sm:leading-10 md:text-6xl md:leading-14 dark:text-gray-100">
          实验
        </h1>
        <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">网站新功能试验场</p>
      </div>
      {/* 3D渲染容器 */}
      <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">3D URDF模型加载</p>
      <div
        ref={containerRef}
        className="my-4 h-96 w-full overflow-hidden rounded-lg border"
        style={{ backgroundColor: '#f0f0f0' }}
      />
      <p className="text-lg leading-7 text-gray-500 dark:text-gray-400">Shadcn 组件集成</p>
      <div>
        <Button>点击我</Button>
      </div>
    </div>
  )
}
