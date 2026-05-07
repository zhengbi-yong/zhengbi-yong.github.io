'use client'

import React, { useRef, useEffect, useMemo } from 'react'
import { Chart } from '@antv/g2'
import { resolveDataProp } from '../chemistry/runtimeProps'

interface AntVChartProps {
  data?: any[]
  dataBase64?: string
  config?: any
  width?: number
  height?: number
  className?: string
  [k: string]: any
}

export const AntVChart: React.FC<AntVChartProps> = ({
  data: rawData,
  dataBase64,
  config: explicitConfig,
  width,
  height,
  className = '',
  ...rest
}) => {
  const data = (resolveDataProp(rawData, dataBase64) ?? []) as any[]
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<Chart | null>(null)

  // 合并 props：优先 explicitConfig，否则用 rest 展开（type/xField/yField 等來自 MDX）
  const chartConfig = useMemo(
    () => explicitConfig ?? rest,
    [explicitConfig, rest.type, rest.xField, rest.yField]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container || !data?.length) return

    // 销毁旧图表
    if (chartRef.current) {
      chartRef.current.destroy()
      chartRef.current = null
    }

    try {
      const chartType = chartConfig.type as string
      const xField = chartConfig.xField as string
      const yField = chartConfig.yField as string

      // 官方 G2 v5 API: new Chart({ container }) → mark方法 → .data() → .encode() → .render()
      const chart = new Chart({ container })

      if (chartType && xField && yField) {
        // type 'column'/'bar' → interval mark; 'line' → line mark; etc.
        const markFn = (chart as any)[chartType === 'column' || chartType === 'bar' ? 'interval' : chartType]
        if (typeof markFn === 'function') {
          markFn.call(chart)
            .data(data)
            .encode('x', xField)
            .encode('y', yField)
        }
      } else {
        // 降级：仅设数据
        chart.data(data)
      }

      chart.render()
      chartRef.current = chart
    } catch (err) {
      console.error('[AntVChart] render error:', err)
    }

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [data, chartConfig])

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: width || '100%',
        height: height || 300,
      }}
    />
  )
}

export default AntVChart
