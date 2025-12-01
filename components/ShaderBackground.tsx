'use client'

import { useEffect, useRef } from 'react'

interface ShaderBackgroundProps {
  className?: string
  intensity?: number
}

/**
 * ShaderBackground - WebGL 着色器背景组件
 * 实现渐变流动效果，基于 Shadertoy 风格的着色器
 */
export default function ShaderBackground({
  className = '',
  intensity = 1.0,
}: ShaderBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const programRef = useRef<WebGLProgram | null>(null)
  const startTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 获取 WebGL 上下文
    const gl = canvas.getContext('webgl', {
      alpha: true,
      antialias: true,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
    })

    if (!gl) {
      // WebGL 不支持时，使用 CSS 渐变作为降级方案
      canvas.style.background =
        'radial-gradient(circle at 20% 30%, rgba(30, 20, 50, 0.8), rgba(20, 10, 40, 0.6), rgba(10, 5, 30, 0.8))'
      return
    }

    glRef.current = gl

    // 顶点着色器代码
    const vertexShaderSource = `
      attribute vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `

    // 片段着色器代码 - 来自 Shadertoy (wdyczG)
    const fragmentShaderSource = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_intensity;

      #define S(a,b,t) smoothstep(a,b,t)

      mat2 Rot(float a) {
        float s = sin(a);
        float c = cos(a);
        return mat2(c, -s, s, c);
      }

      // Created by inigo quilez - iq/2014
      // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License.
      vec2 hash(vec2 p) {
        p = vec2(dot(p, vec2(2127.1, 81.17)), dot(p, vec2(1269.5, 283.37)));
        return fract(sin(p) * 43758.5453);
      }

      float noise(in vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        
        vec2 u = f * f * (3.0 - 2.0 * f);
        float n = mix(
          mix(
            dot(-1.0 + 2.0 * hash(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)),
            u.x
          ),
          mix(
            dot(-1.0 + 2.0 * hash(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
            dot(-1.0 + 2.0 * hash(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)),
            u.x
          ),
          u.y
        );
        return 0.5 + 0.5 * n;
      }

      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution.xy;
        float ratio = u_resolution.x / u_resolution.y;
        vec2 tuv = uv;
        tuv -= 0.5;
        
        // rotate with Noise
        float degree = noise(vec2(u_time * 0.1, tuv.x * tuv.y));
        tuv.y *= 1.0 / ratio;
        tuv *= Rot(radians((degree - 0.5) * 720.0 + 180.0));
        tuv.y *= ratio;
        
        // Wave warp with sin
        float frequency = 5.0;
        float amplitude = 30.0;
        float speed = u_time * 2.0;
        tuv.x += sin(tuv.y * frequency + speed) / amplitude;
        tuv.y += sin(tuv.x * frequency * 1.5 + speed) / (amplitude * 0.5);
        
        // draw the image
        vec3 colorYellow = vec3(0.957, 0.804, 0.623);
        vec3 colorDeepBlue = vec3(0.192, 0.384, 0.933);
        vec3 layer1 = mix(colorYellow, colorDeepBlue, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
        
        vec3 colorRed = vec3(0.910, 0.510, 0.8);
        vec3 colorBlue = vec3(0.350, 0.71, 0.953);
        vec3 layer2 = mix(colorRed, colorBlue, S(-0.3, 0.2, (tuv * Rot(radians(-5.0))).x));
        
        vec3 finalComp = mix(layer1, layer2, S(0.5, -0.3, tuv.y));
        
        vec3 col = finalComp;
        
        // 应用强度控制
        col *= u_intensity;
        
        gl_FragColor = vec4(col, 1.0);
      }
    `

    // 创建着色器
    function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
      const shader = gl.createShader(type)
      if (!shader) return null

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader))
        gl.deleteShader(shader)
        return null
      }

      return shader
    }

    // 创建程序
    function createProgram(
      gl: WebGLRenderingContext,
      vertexShader: WebGLShader,
      fragmentShader: WebGLShader
    ): WebGLProgram | null {
      const program = gl.createProgram()
      if (!program) return null

      gl.attachShader(program, vertexShader)
      gl.attachShader(program, fragmentShader)
      gl.linkProgram(program)

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program))
        gl.deleteProgram(program)
        return null
      }

      return program
    }

    // 编译着色器
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource)
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource)

    if (!vertexShader || !fragmentShader) {
      console.error('Failed to create shaders')
      return
    }

    // 创建程序
    const program = createProgram(gl, vertexShader, fragmentShader)
    if (!program) {
      console.error('Failed to create program')
      return
    }

    programRef.current = program

    // 设置顶点数据（全屏四边形）
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1])
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW)

    // 设置视口和分辨率
    const resize = () => {
      if (!canvas || !gl) return
      // 使用窗口尺寸而不是 canvas 的 bounding rect，确保覆盖整个视口
      const width = window.innerWidth
      const height = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // 限制最大 DPR 以提高性能
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    // 初始设置尺寸
    resize()
    
    // 延迟一帧确保尺寸正确设置
    requestAnimationFrame(() => {
      resize()
    })
    
    // 使用 ResizeObserver 如果可用，否则回退到 window resize 事件
    let resizeObserver: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(canvas)
    }
    window.addEventListener('resize', resize)

    // 渲染函数
    const render = () => {
      if (!gl || !program) return

      const currentTime = (Date.now() - startTimeRef.current) / 1000

      // 使用程序
      gl.useProgram(program)

      // 设置属性
      const positionLocation = gl.getAttribLocation(program, 'a_position')
      gl.enableVertexAttribArray(positionLocation)
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)

      // 设置 uniform
      const timeLocation = gl.getUniformLocation(program, 'u_time')
      const resolutionLocation = gl.getUniformLocation(program, 'u_resolution')
      const intensityLocation = gl.getUniformLocation(program, 'u_intensity')

      gl.uniform1f(timeLocation, currentTime)
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height)
      gl.uniform1f(intensityLocation, intensity)

      // 清除并绘制
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLES, 0, 6)

      animationFrameRef.current = requestAnimationFrame(render)
    }

    // 开始渲染
    startTimeRef.current = Date.now()
    render()

    // 清理函数
    return () => {
      if (resizeObserver && canvas) {
        resizeObserver.unobserve(canvas)
        resizeObserver.disconnect()
      }
      window.removeEventListener('resize', resize)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (gl && program) {
        gl.deleteProgram(program)
      }
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none fixed inset-0 w-full h-full ${className}`}
      style={{ zIndex: 0 }}
    />
  )
}

