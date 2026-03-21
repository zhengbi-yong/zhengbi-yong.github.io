'use client'

import React, { useRef, useEffect } from 'react'
import { Chart } from '@antv/g2'

interface AntVChartProps {
  data: any[]
  config: any
  width?: number
  height?: number
  className?: string
}

export const AntVChart: React.FC<AntVChartProps> = ({
  data,
  config,
  width = 400,
  height = 400,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    if (!containerRef.current) return undefined

    // 清理之前的图表
    if (chartRef.current) {
      chartRef.current.destroy()
    }

    // 创建新图表
    const chart = new Chart({
      container: containerRef.current,
      width,
      height,
      ...config,
    })

    // 设置数据
    chart.data(data)

    // 渲染图表
    chart.render()

    chartRef.current = chart

    // 清理函数
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy()
      }
    }
  }, [data, config, width, height])

  return <div ref={containerRef} className={className} style={{ width: width || '100%', height }} />
}

export default AntVChart
