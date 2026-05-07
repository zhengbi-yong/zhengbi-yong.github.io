'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Pie } from '@nivo/pie'

import { resolveDataProp } from '../chemistry/runtimeProps'

interface NivoPieChartProps {
  data?: any[]
  dataBase64?: string
  width?: number
  height?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  innerRadius?: number
  padAngle?: number
  cornerRadius?: number
  colors?: any
  theme?: any
  animate?: boolean
  enableArcLabels?: boolean
  enableArcLinkLabels?: boolean
}

export const NivoPieChart: React.FC<NivoPieChartProps> = ({
  data: rawData,
  dataBase64,
  width,
  height = 400,
  margin = { top: 40, right: 80, bottom: 80, left: 80 },
  innerRadius = 0.5,
  padAngle = 0.7,
  cornerRadius = 3,
  colors = { scheme: 'nivo' },
  theme,
  animate = true,
  enableArcLabels = true,
  enableArcLinkLabels = true,
}) => {
  // Resolve data from raw value or base64 (runtime MDX compatibility)
  const data = (resolveDataProp(rawData, dataBase64) ?? []) as any[]

  const containerRef = useRef<HTMLDivElement>(null)
  const [chartWidth, setChartWidth] = useState(width || 400)
  const chartHeight = typeof height === 'number' ? height : 400

  useEffect(() => {
    if (containerRef.current) {
      const w = containerRef.current.clientWidth
      if (w > 0) setChartWidth(w)
    }
  }, [height])

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

  return (
    <div ref={containerRef} style={{ width: '100%', minHeight: chartHeight }}>
      <Pie
        width={chartWidth}
        height={chartHeight}
        data={data}
        margin={margin}
        innerRadius={innerRadius}
        padAngle={padAngle}
        cornerRadius={cornerRadius}
        colors={colors}
        theme={theme}
        animate={animate}
        enableArcLabels={enableArcLabels}
        enableArcLinkLabels={enableArcLinkLabels}
        arcLabelsSkipAngle={10}
        arcLabelsTextColor={{
          from: 'color',
          modifiers: [['darker', 2]],
        }}
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 56,
            itemsSpacing: 0,
            itemWidth: 100,
            itemHeight: 18,
            itemTextColor: 'var(--theme-fg-tertiary)',
            itemDirection: 'left-to-right',
            itemOpacity: 1,
            symbolSize: 18,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: 'var(--theme-fg)',
                },
              },
            ],
          },
        ]}
      />
    </div>
  )
}

export default NivoPieChart
