'use client'

import React from 'react'
import { ResponsiveLine } from '@nivo/line'

interface NivoLineChartProps {
  data: any[]
  width?: number
  height?: number
  margin?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  xScale?: any
  yScale?: any
  curve?: string
  colors?: any
  theme?: any
  animate?: boolean
  enablePoints?: boolean
  enableGridX?: boolean
  enableGridY?: boolean
}

export const NivoLineChart: React.FC<NivoLineChartProps> = ({
  data,
  width,
  height = 400,
  margin = { top: 50, right: 130, bottom: 50, left: 60 },
  xScale = { type: 'point' },
  yScale = {
    type: 'linear',
    min: 'auto',
    max: 'auto',
    stacked: true,
    reverse: false,
  },
  curve = 'monotoneX',
  colors = { scheme: 'nivo' },
  theme,
  animate = true,
  enablePoints = true,
  enableGridX = true,
  enableGridY = true,
}) => {
  return (
    <div style={{ width: width || '100%', height }}>
      <ResponsiveLine
        data={data}
        margin={margin}
        xScale={xScale}
        yScale={yScale}
        curve={curve}
        colors={colors}
        theme={theme}
        animate={animate}
        enablePoints={enablePoints}
        enableGridX={enableGridX}
        enableGridY={enableGridY}
        pointSize={10}
        pointColor={{ theme: 'background' }}
        pointBorderWidth={2}
        pointBorderColor={{ from: 'serieColor' }}
        pointLabelYOffset={-12}
        useMesh={true}
        legends={[
          {
            anchor: 'bottom-right',
            direction: 'column',
            justify: false,
            translateX: 100,
            translateY: 0,
            itemsSpacing: 0,
            itemDirection: 'left-to-right',
            itemWidth: 80,
            itemHeight: 20,
            itemOpacity: 0.75,
            symbolSize: 12,
            symbolShape: 'circle',
            symbolBorderColor: 'rgba(0, 0, 0, .5)',
            effects: [
              {
                on: 'hover',
                style: {
                  itemBackground: 'rgba(0, 0, 0, .03)',
                  itemOpacity: 1,
                },
              },
            ],
          },
        ]}
      />
    </div>
  )
}

export default NivoLineChart
