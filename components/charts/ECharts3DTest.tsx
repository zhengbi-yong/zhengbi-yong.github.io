'use client'

import React, { useEffect } from 'react'
import * as echarts from 'echarts'
import 'echarts-gl'

interface ECharts3DTestProps {
  className?: string
}

export const ECharts3DTest: React.FC<ECharts3DTestProps> = ({ className = '' }) => {
  useEffect(() => {
    // 检查3D图表是否正确注册
    const chart = echarts.init(document.createElement('div'))

    try {
      // 尝试创建一个简单的3D散点图来测试
      const testOption = {
        xAxis3D: { type: 'value' },
        yAxis3D: { type: 'value' },
        zAxis3D: { type: 'value' },
        grid3D: {},
        series: [
          {
            type: 'scatter3D',
            data: [[1, 2, 3]],
          },
        ],
      }

      chart.setOption(testOption)
      console.log('✅ ECharts 3D组件加载成功')
      chart.dispose()
    } catch (error) {
      console.error('❌ ECharts 3D组件加载失败:', error)
      chart.dispose()
    }
  }, [])

  return <div className={className}>3D图表测试组件</div>
}

export default ECharts3DTest
