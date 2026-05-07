'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Bar } from '@nivo/bar'

import { resolveDataProp } from '../chemistry/runtimeProps'

interface NivoBarChartProps {
  data?: any[]
  dataBase64?: string
  keys?: string[]
  keysBase64?: string
  indexBy: string
  width?: number
  height?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  colors?: any
  theme?: any
  animate?: boolean
}

export const NivoBarChart: React.FC<NivoBarChartProps> = ({
  data: rawData,
  dataBase64,
  keys: rawKeys,
  keysBase64,
  indexBy,
  width,
  height = 400,
  margin = { top: 50, right: 130, bottom: 50, left: 60 },
  colors = { scheme: 'nivo' },
  theme,
  animate = true,
}) => {
  // Resolve data from raw value or base64 (runtime MDX compatibility)
  const data = (resolveDataProp(rawData, dataBase64) ?? []) as any[]
  const keys = (resolveDataProp(rawKeys, keysBase64) ?? []) as string[]

  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(width || 600)

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth
      if (w > 0) setChartWidth(w)
    }
  }, [height])

  // 用 ResizeObserver 跟踪容器宽度变化
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setChartWidth(w)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const chartHeight = typeof height === 'number' ? height : 400

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: chartHeight }}>
      <Bar
        width={chartWidth}
        height={chartHeight}
        data={data}
        keys={keys}
        indexBy={indexBy}
        margin={margin}
        padding={0.3}
        colors={colors}
        theme={theme}
        animate={animate}
        labelSkipWidth={12}
        labelSkipHeight={12}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1.6]],
        }}
        legends={[
          {
            dataFrom: 'keys',
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 120,
            translateY: 0,
            itemsSpacing: 2,
            itemWidth: 100,
            itemHeight: 20,
            itemDirection: 'left-to-right',
            itemOpacity: 0.85,
            symbolSize: 20,
            effects: [
              {
                on: 'hover',
                style: {
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
        role="application"
        ariaLabel="Nivo bar chart"
      />
    </div>
  )
}

export default NivoBarChart
