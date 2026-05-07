'use client'

import React, { useRef, useEffect } from 'react'
import * as echarts from 'echarts'
import 'echarts-gl'
import { resolveDataProp } from '../chemistry/runtimeProps'

type FormatterValue = (...args: unknown[]) => unknown

type FormatterMap = Record<string, FormatterValue>

type EChartsAxis = {
  axisLabel?: {
    formatter?: FormatterValue
  }
}

type EChartsSeries = {
  label?: {
    formatter?: FormatterValue
  }
}

type EChartsOptionWithFormatters = {
  tooltip?: {
    formatter?: FormatterValue
  }
  series?: EChartsSeries[]
  yAxis?: EChartsAxis | EChartsAxis[]
}

interface EChartsComponentProps {
  option?: unknown
  optionBase64?: string
  width?: string | number
  height?: string | number
  className?: string
  theme?: string
  formatters?: FormatterMap
}

export const EChartsComponent: React.FC<EChartsComponentProps> = ({
  option: rawOption,
  optionBase64,
  width = '100%',
  height = 400,
  className = '',
  theme = 'light',
  formatters = {},
}) => {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  // Resolve option from raw value or base64 (runtime MDX compatibility)
  const option = (resolveDataProp(rawOption, optionBase64) ?? {}) as Record<string, unknown>

  useEffect(() => {
    if (!chartRef.current) return undefined

    try {
      // 初始化图表
      chartInstance.current = echarts.init(chartRef.current, theme)
      // 深度克隆option并应用formatters
      const processedOption = JSON.parse(JSON.stringify(option)) as EChartsOptionWithFormatters

    // 应用formatter函数
    if (formatters.tooltip && processedOption.tooltip) {
      processedOption.tooltip.formatter = formatters.tooltip
    }
    if (formatters.label && processedOption.series) {
      processedOption.series.forEach((series) => {
        if (series.label) {
          series.label.formatter = formatters.label
        }
      })
    }
    if (formatters.axisLabel && processedOption.yAxis) {
      if (Array.isArray(processedOption.yAxis)) {
        processedOption.yAxis.forEach((axis) => {
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
    // 延迟 resize：确保 DOM 布局完成后再测量（解决容器初始尺寸为 0 的问题）
    const timer = setTimeout(() => {
      chartInstance.current?.resize()
    }, 0)

    // 响应式处理
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    // 清理
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
      chartInstance.current?.dispose()
    }
    } catch (err) {
      console.error('[ECharts] init/render error:', err)
    }
  }, [option, theme, formatters])

  return (
    <div
      ref={chartRef}
      className={className}
      style={{
        width: width || '100%',
        height: height || 400,
        minWidth: typeof width === 'number' ? width : 300,
        minHeight: typeof height === 'number' ? height : 300,
      }}
    />
  )
}

export default EChartsComponent
