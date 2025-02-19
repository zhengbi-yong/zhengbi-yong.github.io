"use client";
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
// 优化导入方式（文献5建议）
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js'

const BackgroundCanvas = () => {
  const mountRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!mountRef.current) return // 增加空值保护（文献4推荐）

    // 初始化渲染器配置优化（文献5方案）
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
      logarithmicDepthBuffer: true // 增强深度检测
    })
    
    // 相机参数调整（文献3数据）
    const camera = new THREE.PerspectiveCamera(
      45, // 减小FOV角度
      window.innerWidth / window.innerHeight,
      0.5, // 增大近平面
      50   // 减小远平面
    )
    camera.position.set(0, 8, 15) // 调整观察角度

    // 光照强度增强（文献3优化）
    const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
    const pointLight = new THREE.PointLight(0xff8888, 8.0, 50)
    pointLight.position.set(15, 20, 25)
    
    // 混合模式修正（文献5方案）
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setClearColor(0x000000, 0) // 显式设置透明背景

    // 响应式处理优化
    const handleResize = () => {
      const width = mountRef.current!.clientWidth
      const height = mountRef.current!.clientHeight
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    // 动画循环优化
    let animationId: number
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      torus.rotation.x += 0.004 * Math.sin(Date.now()/1000)
      torus.rotation.y += 0.003
      controls.update()
      renderer.render(scene, camera)
    }

    return () => {
      cancelAnimationFrame(animationId)
      // 增强清理逻辑（文献4建议）
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return (
    <div 
      ref={mountRef}
      className="fixed inset-0 z-0" // 简化CSS类
    />
  )
}