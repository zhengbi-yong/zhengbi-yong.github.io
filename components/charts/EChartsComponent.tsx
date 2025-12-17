'use client'

import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import 'echarts-gl'

interface EChartsComponentProps {
  option: any
  width?: string | number
  height?: string | number
  className?: string
  theme?: string
  formatters?: {
    [key: string]: Function
  }
}

export const EChartsComponent: React.FC<EChartsComponentProps> = ({
  option,
  width = '100%',
  height = 400,
  className = '',
  theme = 'light',
  formatters = {},
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    chartInstance.current = echarts.init(chartRef.current, theme)

    // 深度克隆option并应用formatters
    const processedOption = JSON.parse(JSON.stringify(option))

    // 应用formatter函数
    if (formatters.tooltip && processedOption.tooltip) {
      processedOption.tooltip.formatter = formatters.tooltip
    }
    if (formatters.label && processedOption.series) {
      processedOption.series.forEach((series: any) => {
        if (series.label) {
          series.label.formatter = formatters.label
        }
      })
    }
    if (formatters.axisLabel && processedOption.yAxis) {
      if (Array.isArray(processedOption.yAxis)) {
        processedOption.yAxis.forEach((axis: any) => {
          if (axis.axisLabel) {
            axis.axisLabel.formatter = formatters.axisLabel
          }
        })
      } else if (processedOption.yAxis.axisLabel) {
        processedOption.yAxis.axisLabel.formatter = formatters.axisLabel
      }
    }

    // 设置选项
    chartInstance.current.setOption(processedOption)

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
  }, [option, theme, formatters])

  return <div ref={chartRef} className={className} style={{ width, height }} />
}

export default EChartsComponent
