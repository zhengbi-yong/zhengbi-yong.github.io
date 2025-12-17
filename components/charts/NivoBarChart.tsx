'use client'

import React from 'react'
import { ResponsiveBar } from '@nivo/bar'

interface NivoBarChartProps {
  data: any[]
  keys: string[]
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
  data,
  keys,
  indexBy,
  width,
  height = 400,
  margin = { top: 50, right: 130, bottom: 50, left: 60 },
  colors = { scheme: 'nivo' },
  theme,
  animate = true,
}) => {
  return (
    <div style={{ width: width || '100%', height }}>
      <ResponsiveBar
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
