'use client'

import { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'

interface ThreeViewerProps {
  modelPath?: string
  modelUrl?: string
  className?: string
  autoRotate?: boolean
  width?: number
  height?: number
  cameraPosition?: [number, number, number]
}

export function ThreeViewer({
  modelUrl,
  className = '',
  autoRotate = true,
  width = 800,
  height = 600,
}: ThreeViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient || !mountRef.current) return

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(renderer.domElement)

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4)
    directionalLight.position.set(5, 5, 5)
    scene.add(directionalLight)

    // Add a default cube if no model is provided
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const material = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.5,
      roughness: 0.5,
    })
    const cube = new THREE.Mesh(geometry, material)
    scene.add(cube)

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate)

      if (autoRotate) {
        cube.rotation.x += 0.01
        cube.rotation.y += 0.01
      }

      renderer.render(scene, camera)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height)
    }

    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [isClient, width, height, autoRotate])

  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-200 dark:bg-gray-700 ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-500 dark:text-gray-400">加载 3D 内容中...</div>
      </div>
    )
  }

  return <div ref={mountRef} className={className} style={{ width, height }} />
}
