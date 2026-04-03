'use client'

import { useRef, useMemo, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTheme } from 'next-themes'
import * as THREE from 'three'

// Inline shader source (importing .vert/.frag requires webpack loader config)
const vertexShader = `
uniform float uTime;
uniform float uMouseX;
uniform float uMouseY;
uniform float uScroll;
uniform float uReducedMotion;

attribute float aScale;
attribute float aRandomness;
attribute vec3 aColor;

varying vec3 vColor;
varying float vAlpha;

vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod(i, 289.0);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 1.0/7.0;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}

void main() {
  vec3 pos = position;
  float noiseFreq = 0.3;
  float noiseAmp = 0.5;
  float noise = snoise(pos * noiseFreq + uTime * 0.15) * noiseAmp;
  pos += noise * aRandomness;
  pos.x += uMouseX * 0.3 * aRandomness;
  pos.y += uMouseY * 0.3 * aRandomness;
  pos.y += uScroll * 0.5;
  pos.y += sin(uTime * 0.3 + aRandomness * 6.28) * 0.15;
  pos.x += cos(uTime * 0.2 + aRandomness * 6.28) * 0.1;
  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float sizeFactor = aScale * (200.0 / -mvPosition.z);
  gl_PointSize = sizeFactor;
  gl_Position = projectionMatrix * mvPosition;
  vColor = aColor;
  float dist = length(pos) / 5.0;
  vAlpha = smoothstep(1.0, 0.3, dist) * 0.8;
  vAlpha *= smoothstep(1.5, 0.0, uScroll * 0.3);
  if (uReducedMotion > 0.5) {
    vAlpha *= 0.5;
  }
}
`

const fragmentShader = `
uniform float uIsDark;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center);
  if (dist > 0.5) discard;

  if (uIsDark > 0.5) {
    // Dark mode: luminous glow with additive blending
    float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
    float glow = exp(-dist * 4.0) * 0.3;
    gl_FragColor = vec4(vColor + glow, alpha);
  } else {
    // Light mode: soft bokeh with normal blending
    float alpha = smoothstep(0.5, 0.15, dist) * vAlpha * 0.45;
    gl_FragColor = vec4(vColor, alpha);
  }
}
`

interface ParticleBackgroundProps {
  count?: number
  scrollProgress?: number
}

// Color palette: indigo -> purple -> amber
const COLORS_DARK = [
  new THREE.Color('#818cf8'), // indigo-400
  new THREE.Color('#a78bfa'), // violet-400
  new THREE.Color('#c084fc'), // purple-400
  new THREE.Color('#f59e0b'), // amber-500
  new THREE.Color('#6366f1'), // indigo-500
]

const COLORS_LIGHT = [
  new THREE.Color('#818cf8'), // indigo-400
  new THREE.Color('#a78bfa'), // violet-400
  new THREE.Color('#c084fc'), // purple-400
  new THREE.Color('#f59e0b'), // amber-500
  new THREE.Color('#6366f1'), // indigo-500
]

export default function ParticleBackground({ count = 2000, scrollProgress = 0 }: ParticleBackgroundProps) {
  const meshRef = useRef<THREE.Points>(null)
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'
  const colors = isDark ? COLORS_DARK : COLORS_LIGHT

  const reducedMotion = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false

  const effectiveCount = reducedMotion ? Math.min(count, 500) : count

  const { positions, scales, randomness, colors: colorAttrib } = useMemo(() => {
    const positions = new Float32Array(effectiveCount * 3)
    const scales = new Float32Array(effectiveCount)
    const randomness = new Float32Array(effectiveCount)
    const colorAttrib = new Float32Array(effectiveCount * 3)

    for (let i = 0; i < effectiveCount; i++) {
      const i3 = i * 3
      // Distribute in a sphere-like volume
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 3 + Math.random() * 4

      positions[i3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = (Math.random() - 0.5) * 6

      scales[i] = Math.random() * 2 + 0.5
      randomness[i] = Math.random()

      // Pick a random color from palette
      const color = colors[Math.floor(Math.random() * colors.length)]
      colorAttrib[i3] = color.r
      colorAttrib[i3 + 1] = color.g
      colorAttrib[i3 + 2] = color.b
    }

    return { positions, scales, randomness, colors: colorAttrib }
  }, [effectiveCount, isDark])

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouseX: { value: 0 },
    uMouseY: { value: 0 },
    uScroll: { value: 0 },
    uReducedMotion: { value: reducedMotion ? 1.0 : 0.0 },
    uIsDark: { value: isDark ? 1.0 : 0.0 },
  }), [isDark])

  // Mouse tracking
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1
    mouseRef.current.targetY = -(e.clientY / window.innerHeight) * 2 + 1
  }, [])

  // Set up event listener
  useMemo(() => {
    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove)
    }
    return undefined
  }, [handleMouseMove])

  useFrame((state) => {
    if (!meshRef.current) return

    const material = meshRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uScroll.value = scrollProgress
    material.uniforms.uIsDark.value = isDark ? 1.0 : 0.0
    material.blending = isDark ? THREE.AdditiveBlending : THREE.NormalBlending
    material.needsUpdate = true

    // Smooth mouse interpolation
    mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05
    mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05
    material.uniforms.uMouseX.value = mouseRef.current.x
    material.uniforms.uMouseY.value = mouseRef.current.y

    // Slow rotation
    if (!reducedMotion) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.02
      meshRef.current.rotation.z = state.clock.elapsedTime * 0.01
    }
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={effectiveCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-aScale"
          count={effectiveCount}
          array={scales}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aRandomness"
          count={effectiveCount}
          array={randomness}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-aColor"
          count={effectiveCount}
          array={colorAttrib}
          itemSize={3}
        />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </points>
  )
}
