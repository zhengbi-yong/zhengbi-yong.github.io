'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { webGLContextManager } from '@/lib/webgl/WebGLContextManager'

interface ThreeViewerProps {
  modelPath?: string
  modelUrl?: string
  className?: string
  autoRotate?: boolean
  width?: number
  height?: number
  cameraPosition?: [number, number, number]
  /** Activity visibility state - when false, WebGL is paused */
  isActive?: boolean
}

/**
 * Three.js viewer with Activity-aware rendering
 *
 * GOLDEN_RULES 2.3: Activity cleanup must be idempotent (pause, not destroy)
 * GOLDEN_RULES 2.4: Max 6 WebGL contexts with LRU eviction
 *
 * Key behaviors:
 * - When isActive=false: saves snapshot, pauses rendering, keeps context alive
 * - When isActive=true: resumes rendering from snapshot
 * - Uses WebGLContextManager for LRU context management
 */
export function ThreeViewer({
  modelUrl: _modelUrl,
  className = '',
  autoRotate: _autoRotate = true,
  width = 800,
  height = 600,
  isActive = true,
}: ThreeViewerProps) {
  void _modelUrl
  void _autoRotate
  const mountRef = useRef<HTMLDivElement>(null)
  const [isClient, setIsClient] = useState(false)
  const [snapshot, setSnapshot] = useState<string | null>(null)

  // Store Three.js objects in refs to avoid re-creation
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cubeRef = useRef<THREE.Mesh | null>(null)
  const animationIdRef = useRef<number | null>(null)
  const contextIdRef = useRef<string | null>(null)

  // Generate unique context ID for this instance
  const contextId = useCallback(() => {
    if (!contextIdRef.current) {
      contextIdRef.current = `three-viewer-${Math.random().toString(36).substr(2, 9)}`
    }
    return contextIdRef.current
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Handle Activity visibility changes
  useEffect(() => {
    if (!isClient) return

    const id = contextId()

    if (!isActive) {
      // Activity hidden: pause rendering, save snapshot
      const savedSnapshot = webGLContextManager.pause(id)
      if (savedSnapshot) {
        setSnapshot(savedSnapshot)
      }
    } else {
      // Activity visible: resume rendering
      webGLContextManager.resume(id)
      setSnapshot(null)
    }
  }, [isActive, isClient, contextId])

  // Initialize Three.js scene
  useEffect(() => {
    if (!isClient || !mountRef.current) return undefined

    const id = contextId()

    // Scene setup
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0xf0f0f0)
    sceneRef.current = scene

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000)
    camera.position.z = 5
    cameraRef.current = camera

    // Create canvas for WebGL context acquisition
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    // Acquire WebGL context through manager (handles LRU eviction)
    const gl = webGLContextManager.acquire(id, canvas)
    if (!gl) {
      console.error('[ThreeViewer] Failed to acquire WebGL context')
      return undefined
    }

    // Create renderer using the managed context
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      context: gl as WebGLRenderingContext,
    })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2x for performance
    rendererRef.current = renderer

    // Add canvas to DOM
    mountRef.current.appendChild(canvas)

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
    cubeRef.current = cube

    // Animation loop
    const animate = () => {
      // Only animate when active to save resources
      if (isActive && cubeRef.current) {
        cubeRef.current.rotation.x += 0.01
        cubeRef.current.rotation.y += 0.01
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }

      animationIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    // Handle resize
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = width / height
        cameraRef.current.updateProjectionMatrix()
        rendererRef.current.setSize(width, height)
      }
    }

    window.addEventListener('resize', handleResize)

    // Register context event callbacks
    const unsubscribe = webGLContextManager.onContextEvent(id, (ctxId, event) => {
      if (event.type === 'webglcontextlost') {
        console.warn(`[ThreeViewer] Context ${ctxId} lost`)
      } else if (event.type === 'webglcontextrestored') {
        console.info(`[ThreeViewer] Context ${ctxId} restored`)
      }
    })

    // Cleanup - GOLDEN_RULES 2.3: Only pause, don't destroy (Activity may restore)
    return () => {
      window.removeEventListener('resize', handleResize)
      unsubscribe()

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }

      // Pause context (keeps it alive for potential restore)
      webGLContextManager.pause(id)

      // Remove canvas from DOM
      if (mountRef.current && canvas.parentNode === mountRef.current) {
        mountRef.current.removeChild(canvas)
      }

      // Clear refs (but don't dispose renderer - context is managed by manager)
      sceneRef.current = null
      cameraRef.current = null
      rendererRef.current = null
      cubeRef.current = null
    }
  }, [isClient, width, height, isActive, contextId])

  // Show snapshot when paused (Activity hidden)
  if (snapshot && !isActive) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--surface-subtle)] ${className}`}
        style={{ width, height }}
      >
        <img
          src={snapshot}
          alt="3D viewer paused"
          className="max-h-full max-w-full object-contain"
        />
      </div>
    )
  }

  if (!isClient) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--surface-subtle)] ${className}`}
        style={{ width, height }}
      >
        <div className="text-[var(--text-secondary)]">加载 3D 内容中...</div>
      </div>
    )
  }

  return <div ref={mountRef} className={className} style={{ width, height }} />
}
