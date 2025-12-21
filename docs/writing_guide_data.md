# 数据可视化写作指南

## 📋 概述

本指南详细介绍了在本博客系统中创建各种数据可视化图表的完整方法。通过集成 ECharts、Nivo、AntV 等专业图表库，您可以创建出美观、交互式的数据图表，让数据讲述生动的故事。

## 🎨 图表库选择指南

### 三大主要图表库对比

| 图表库 | 核心优势 | 最适用场景 | 学习难度 |
|--------|---------|------------|----------|
| **ECharts** | 功能最全面，性能优异 | 大数据量、复杂图表、企业级应用 | ⭐⭐☆☆☆ |
| **Nivo** | React原生，组件化设计 | React项目、快速开发、响应式需求 | ⭐⭐⭐☆☆ |
| **AntV G2** | 高度可定制，图形语法 | 需要深度定制、专业数据分析 | ⭐⭐⭐⭐☆ |

### 选择建议

- **快速开发基础图表** → ECharts
- **React项目集成** → Nivo
- **高度定制需求** → AntV
- **3D/大数据可视化** → ECharts
- **移动端优先** → AntV F2 或 Chart.js

## 📊 ECharts 图表库

ECharts 是功能最丰富的图表库，支持超过30种图表类型。

### 基础组件使用

```tsx
<EChartsComponent
  height={400}
  option={{
    // ECharts配置对象
  }}
/>
```

### 1. 折线图 (Line Chart)

#### 基础折线图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: {
      text: '月度销售趋势',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: {
      type: 'value',
      name: '销售额（万元）'
    },
    series: [{
      data: [120, 200, 150, 80, 70, 110],
      type: 'line',
      smooth: true
    }]
  }}
/>
```

#### 多系列折线图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '产品销售对比' },
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['产品A', '产品B', '产品C'],
      top: 30
    },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '产品A',
        type: 'line',
        data: [120, 132, 101, 134, 90, 230]
      },
      {
        name: '产品B',
        type: 'line',
        data: [220, 182, 191, 234, 290, 330]
      },
      {
        name: '产品C',
        type: 'line',
        data: [150, 232, 201, 154, 190, 330]
      }
    ]
  }}
/>
```

#### 面积图（Area Chart）

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '流量来源分析' },
    tooltip: { trigger: 'axis' },
    legend: { data: ['直接访问', '搜索引擎'] },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '直接访问',
        type: 'line',
        areaStyle: {},
        emphasis: { focus: 'series' },
        data: [320, 332, 301, 334, 390, 330, 320]
      },
      {
        name: '搜索引擎',
        type: 'line',
        areaStyle: {},
        emphasis: { focus: 'series' },
        data: [820, 932, 901, 934, 1290, 1330, 1320]
      }
    ]
  }}
/>
```

### 2. 柱状图 (Bar Chart)

#### 基础柱状图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '季度销售额' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['Q1', 'Q2', 'Q3', 'Q4']
    },
    yAxis: { type: 'value' },
    series: [{
      data: [120, 200, 150, 80],
      type: 'bar',
      showBackground: true,
      backgroundStyle: { color: 'rgba(180, 180, 180, 0.2)' }
    }]
  }}
/>
```

#### 堆叠柱状图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '各产品季度销售' },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    legend: { data: ['产品A', '产品B', '产品C'] },
    xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'] },
    yAxis: { type: 'value' },
    series: [
      {
        name: '产品A',
        type: 'bar',
        stack: 'total',
        data: [120, 132, 101, 134]
      },
      {
        name: '产品B',
        type: 'bar',
        stack: 'total',
        data: [220, 182, 191, 234]
      },
      {
        name: '产品C',
        type: 'bar',
        stack: 'total',
        data: [150, 212, 201, 154]
      }
    ]
  }}
/>
```

#### 横向柱状图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '编程语言流行度' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'value' },
    yAxis: {
      type: 'category',
      data: ['JavaScript', 'Python', 'Java', 'C++', 'Go']
    },
    series: [{
      type: 'bar',
      data: [85, 78, 65, 45, 35],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: '#83bff6' },
          { offset: 0.5, color: '#188df0' },
          { offset: 1, color: '#188df0' }
        ])
      }
    }]
  }}
/>
```

### 3. 饼图 (Pie Chart)

#### 基础饼图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '浏览器市场份额' },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [{
      name: '访问来源',
      type: 'pie',
      radius: '50%',
      data: [
        { value: 1048, name: 'Chrome' },
        { value: 735, name: 'Safari' },
        { value: 580, name: 'Firefox' },
        { value: 484, name: 'Edge' },
        { value: 300, name: '其他' }
      ],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  }}
/>
```

#### 环形图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '技能分布' },
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c}%'
    },
    legend: { orient: 'vertical', right: 10 },
    series: [{
      name: '技能',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false, position: 'center' },
      emphasis: {
        label: {
          show: true,
          fontSize: '40',
          fontWeight: 'bold'
        }
      },
      labelLine: { show: false },
      data: [
        { value: 35, name: '前端开发' },
        { value: 25, name: '后端开发' },
        { value: 20, name: '数据库' },
        { value: 15, name: '运维' },
        { value: 5, name: '其他' }
      ]
    }]
  }}
/>
```

### 4. 散点图 (Scatter Plot)

#### 基础散点图

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '身高体重分布' },
    xAxis: {
      type: 'value',
      name: '身高(cm)',
      nameLocation: 'middle',
      nameGap: 30
    },
    yAxis: {
      type: 'value',
      name: '体重(kg)',
      nameLocation: 'middle',
      nameGap: 30
    },
    series: [{
      type: 'scatter',
      symbolSize: 20,
      data: [
        [161.2, 51.6], [167.5, 59.0], [159.5, 49.2], [157.0, 63.0],
        [155.8, 53.6], [170.0, 59.0], [159.1, 47.6], [166.0, 69.8]
      ]
    }]
  }}
/>
```

#### 气泡图（多维度散点图）

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '产品分析' },
    xAxis: { type: 'value', name: '价格' },
    yAxis: { type: 'value', name: '销量' },
    series: [{
      type: 'scatter',
      symbolSize: function (data) {
        return Math.sqrt(data[2]) * 5;
      },
      data: [
        [10, 100, 20], [20, 80, 15], [30, 60, 30],
        [40, 40, 25], [50, 20, 10]
      ],
      itemStyle: {
        color: new echarts.graphic.RadialGradient(0.4, 0.3, 1, [
          { offset: 0, color: 'rgb(251, 118, 123)' },
          { offset: 1, color: 'rgb(204, 46, 72)' }
        ])
      }
    }]
  }}
/>
```

### 5. 雷达图 (Radar Chart)

```tsx
<EChartsComponent
  height={400}
  option={{
    title: { text: '能力评估' },
    tooltip: {},
    legend: { data: ['预算分配', '实际开销'] },
    radar: {
      indicator: [
        { name: '销售', max: 6500 },
        { name: '管理', max: 16000 },
        { name: '信息技术', max: 30000 },
        { name: '客服', max: 38000 },
        { name: '研发', max: 52000 },
        { name: '市场', max: 25000 }
      ]
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [4200, 3000, 20000, 35000, 50000, 18000],
          name: '预算分配'
        },
        {
          value: [5000, 14000, 28000, 26000, 42000, 21000],
          name: '实际开销'
        }
      ]
    }]
  }}
/>
```

### 6. 3D图表

#### 3D散点图

```tsx
<EChartsComponent
  height={500}
  option={{
    title: { text: '3D数据分布' },
    tooltip: {},
    xAxis3D: { type: 'value', name: 'X轴' },
    yAxis3D: { type: 'value', name: 'Y轴' },
    zAxis3D: { type: 'value', name: 'Z轴' },
    grid3D: {
      boxWidth: 200,
      boxDepth: 80,
      viewControl: {
        projection: 'perspective',
        autoRotate: true
      }
    },
    series: [{
      type: 'scatter3D',
      symbolSize: 12,
      data: [
        [8.5, 1200, 4.5], [7.2, 800, 4.2], [9.1, 2000, 4.8],
        [6.8, 600, 3.9], [8.9, 1800, 4.6], [7.5, 1000, 4.3]
      ]
    }]
  }}
/>
```

## 🎭 Nivo 图表库

Nivo 是专为 React 设计的图表库，提供优雅的组件化解决方案。

### 基础组件导入

```tsx
import dynamic from 'next/dynamic'

const NivoBarChart = dynamic(() => import('@/components/charts/NivoBarChart'), { ssr: false })
const NivoLineChart = dynamic(() => import('@/components/charts/NivoLineChart'), { ssr: false })
const NivoPieChart = dynamic(() => import('@/components/charts/NivoPieChart'), { ssr: false })
```

### 1. 柱状图 (Bar Chart)

#### 基础柱状图

```tsx
<NivoBarChart
  height={400}
  data={[
    { category: 'A', value: 120 },
    { category: 'B', value: 200 },
    { category: 'C', value: 150 }
  ]}
  keys={['value']}
  indexBy="category"
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
  colors={{ scheme: 'nivo' }}
/>
```

#### 分组柱状图

```tsx
<NivoBarChart
  height={400}
  data={[
    { category: 'Q1', teamA: 120, teamB: 98, teamC: 86 },
    { category: 'Q2', teamA: 156, teamB: 125, teamC: 105 },
    { category: 'Q3', teamA: 189, teamB: 148, teamC: 127 },
    { category: 'Q4', teamA: 239, teamB: 189, teamC: 169 }
  ]}
  keys={['teamA', 'teamB', 'teamC']}
  indexBy="category"
  colors={{ scheme: 'category10' }}
  groupMode="grouped"
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
/>
```

#### 堆叠柱状图

```tsx
<NivoBarChart
  height={400}
  data={data}
  keys={['value1', 'value2', 'value3']}
  indexBy="category"
  groupMode="stacked"
  colors={{ scheme: 'set2' }}
  labelSkipWidth={12}
  labelSkipHeight={12}
/>
```

### 2. 折线图 (Line Chart)

#### 基础折线图

```tsx
<NivoLineChart
  height={400}
  data={[
    {
      id: '系列1',
      data: [
        { x: 'Jan', y: 100 },
        { x: 'Feb', y: 120 },
        { x: 'Mar', y: 150 }
      ]
    }
  ]}
  colors={{ scheme: 'category10' }}
  curve="monotoneX"
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
/>
```

#### 多系列折线图

```tsx
<NivoLineChart
  height={400}
  data={[
    {
      id: '移动端',
      data: [
        { x: '1月', y: 1000 },
        { x: '2月', y: 1200 },
        { x: '3月', y: 1450 },
        { x: '4月', y: 1780 },
        { x: '5月', y: 2100 },
        { x: '6月', y: 2560 }
      ]
    },
    {
      id: '桌面端',
      data: [
        { x: '1月', y: 800 },
        { x: '2月', y: 900 },
        { x: '3月', y: 1050 },
        { x: '4月', y: 1180 },
        { x: '5月', y: 1350 },
        { x: '6月', y: 1520 }
      ]
    }
  ]}
  colors={{ scheme: 'set2' }}
  curve="monotoneX"
  enablePoints={true}
  pointSize={10}
  pointColor={{ theme: 'background' }}
  pointBorderWidth={2}
  pointBorderColor={{ from: 'serieColor' }}
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
/>
```

### 3. 饼图 (Pie Chart)

#### 基础饼图

```tsx
<NivoPieChart
  height={400}
  data={[
    { id: 'A', value: 30 },
    { id: 'B', value: 25 },
    { id: 'C', value: 20 },
    { id: 'D', value: 15 },
    { id: 'E', value: 10 }
  ]}
  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
  innerRadius={0.5}
  padAngle={0.7}
  cornerRadius={3}
  colors={{ scheme: 'pastel1' }}
  borderWidth={1}
  borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
/>
```

#### 径向柱状图

```tsx
<NivoRadialBarChart
  height={400}
  data={[
    { id: 'JavaScript', value: 85 },
    { id: 'Python', value: 78 },
    { id: 'Java', value: 65 },
    { id: 'C++', value: 45 },
    { id: 'Go', value: 35 }
  ]}
  colors={{ scheme: 'category10' }}
  innerRadius={0.2}
  padAngle={0.02}
  cornerRadius={2}
  margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
/>
```

### 4. 其他Nivo图表

#### 热力图 (Heatmap)

```tsx
<NivoHeatmap
  height={400}
  data={[
    { x: 'Mon', y: 'Task A', v: 10 },
    { x: 'Mon', y: 'Task B', v: 20 },
    // ... 更多数据
  ]}
  indexBy="y"
  keys={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']}
  colors={{ scheme: 'yellow_orange_red' }}
  margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
/>
```

#### 树图 (Treemap)

```tsx
<NivoTreemap
  height={400}
  data={{
    name: 'root',
    children: [
      {
        name: 'A',
        children: [
          { name: 'A1', value: 100 },
          { name: 'A2', value: 200 }
        ]
      },
      {
        name: 'B',
        value: 300
      }
    ]
  }}
  colors={{ scheme: 'set2' }}
  identity="name"
  value="value"
  margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
/>
```

## 🎨 AntV G2 图表库

AntV G2 基于图形语法理论，提供强大的定制能力。

### 基础组件使用

```tsx
<AntVChart
  data={data}
  height={400}
  config={{
    type: 'interval',
    xField: 'x',
    yField: 'y',
    color: '#5B8FF9'
  }}
/>
```

### 1. 柱状图

```tsx
const data = [
  { technology: 'React', usage: 85 },
  { technology: 'Vue', usage: 65 },
  { technology: 'Angular', usage: 45 }
]

<AntVChart
  data={data}
  height={400}
  config={{
    type: 'interval',
    xField: 'technology',
    yField: 'usage',
    color: '#5B8FF9',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      }
    },
    meta: {
      usage: {
        alias: '使用率(%)',
      }
    }
  }}
/>
```

### 2. 折线图

```tsx
const data = [
  { month: '1月', value: 100 },
  { month: '2月', value: 120 },
  { month: '3月', value: 150 }
]

<AntVChart
  data={data}
  height={400}
  config={{
    type: 'line',
    xField: 'month',
    yField: 'value',
    point: {
      size: 5,
      shape: 'diamond'
    },
    smooth: true
  }}
/>
```

### 3. 散点图

```tsx
const data = [
  { x: 10, y: 20, category: 'A' },
  { x: 15, y: 25, category: 'B' },
  { x: 20, y: 30, category: 'A' }
]

<AntVChart
  data={data}
  height={400}
  config={{
    type: 'point',
    xField: 'x',
    yField: 'y',
    colorField: 'category',
    sizeField: 'y',
    shape: 'circle'
  }}
/>
```

## 🗺️ 地图可视化

### InteractiveMap 组件（基于Leaflet）

#### 基础地图

```tsx
<InteractiveMap
  center={[39.9042, 116.4074]}
  zoom={10}
  markers={[
    {
      id: '1',
      position: [39.9042, 116.4074],
      title: '北京',
      popup: '中国首都'
    }
  ]}
  style={{ height: 400 }}
/>
```

#### 多标记地图

```tsx
<InteractiveMap
  center={[31.2304, 121.4737]}
  zoom={5}
  markers={[
    {
      id: '1',
      position: [39.9042, 116.4074],
      title: '北京',
      popup: '人口：2154万'
    },
    {
      id: '2',
      position: [31.2304, 121.4737],
      title: '上海',
      popup: '人口：2428万'
    },
    {
      id: '3',
      position: [23.1291, 113.2644],
      title: '广州',
      popup: '人口：1530万'
    }
  ]}
  style={{ height: 500 }}
/>
```

## 🔧 高级功能

### 1. 数据格式转换

#### CSV数据处理

```tsx
// 处理CSV数据
function processCSVData(csvText) {
  const lines = csvText.split('\n')
  const headers = lines[0].split(',')
  return lines.slice(1).map(line => {
    const values = line.split(',')
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = isNaN(values[index])
        ? values[index].trim()
        : Number(values[index])
      return obj
    }, {})
  })
}
```

#### 数据聚合

```tsx
// 数据聚合示例
function aggregateData(data, groupBy, aggregateBy) {
  return data.reduce((acc, item) => {
    const key = item[groupBy]
    if (!acc[key]) {
      acc[key] = { category: key, value: 0, count: 0 }
    }
    acc[key].value += item[aggregateBy]
    acc[key].count += 1
    return acc
  }, {})
}
```

### 2. 动态数据更新

#### ECharts动态更新

```tsx
import { useEffect, useRef } from 'react'

function DynamicChart() {
  const chartRef = useRef(null)

  useEffect(() => {
    const interval = setInterval(() => {
      // 生成新数据
      const newData = Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 300)
      )

      // 更新图表
      if (chartRef.current) {
        chartRef.current.setOption({
          series: [{ data: newData }]
        })
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <EChartsComponent
      ref={chartRef}
      height={400}
      option={{
        series: [{ type: 'line', data: [] }]
      }}
    />
  )
}
```

### 3. 主题定制

#### ECharts主题

```tsx
// 定义深色主题
const darkTheme = {
  backgroundColor: '#1a1a1a',
  textStyle: {},
  title: {
    textStyle: {
      color: '#ffffff'
    }
  },
  legend: {
    textStyle: {
      color: '#ffffff'
    }
  },
  xAxis: {
    axisLine: {
      lineStyle: {
        color: '#ffffff'
      }
    },
    axisLabel: {
      color: '#ffffff'
    }
  },
  yAxis: {
    axisLine: {
      lineStyle: {
        color: '#ffffff'
      }
    },
    axisLabel: {
      color: '#ffffff'
    }
  }
}

<EChartsComponent
  height={400}
  theme={darkTheme}
  option={chartOption}
/>
```

#### Nivo主题

```tsx
const customTheme = {
  background: '#ffffff',
  text: {
    fontSize: 12,
    fill: '#333333',
    outlineWidth: 0,
    outlineColor: 'transparent'
  },
  axis: {
    domain: {
      line: {
        stroke: '#777777',
        strokeWidth: 1
      }
    },
    ticks: {
      line: {
        stroke: '#777777',
        strokeWidth: 1
      }
    }
  }
}

<NivoBarChart
  data={data}
  theme={customTheme}
  // ...其他props
/>
```

### 4. 响应式设计

#### 自适应容器

```tsx
import { useState, useEffect } from 'react'

function ResponsiveChart({ data }) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 })

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById('chart-container')
      if (container) {
        setDimensions({
          width: container.offsetWidth,
          height: 400
        })
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div id="chart-container" style={{ width: '100%' }}>
      <EChartsComponent
        width={dimensions.width}
        height={dimensions.height}
        option={chartOption}
      />
    </div>
  )
}
```

### 5. 导出功能

#### ECharts导出

```tsx
function ChartWithExport({ data }) {
  const chartRef = useRef(null)

  const exportChart = (type) => {
    if (chartRef.current) {
      const url = chartRef.current.getDataURL({
        type: type === 'png' ? 'png' : 'jpeg',
        pixelRatio: 2,
        backgroundColor: '#fff'
      })

      const link = document.createElement('a')
      link.download = `chart.${type}`
      link.href = url
      link.click()
    }
  }

  return (
    <div>
      <div className="mb-4">
        <button onClick={() => exportChart('png')}>
          导出PNG
        </button>
        <button onClick={() => exportChart('jpeg')}>
          导出JPEG
        </button>
      </div>
      <EChartsComponent ref={chartRef} option={chartOption} />
    </div>
  )
}
```

## 📚 数据处理最佳实践

### 1. 数据准备

#### 数据清洗

```tsx
// 数据清洗函数
function cleanData(rawData) {
  return rawData
    .filter(row => row && Object.keys(row).length > 0) // 移除空行
    .map(row => {
      const cleaned = {}
      Object.keys(row).forEach(key => {
        // 清理键名
        const cleanKey = key.trim().replace(/\s+/g, '_')
        // 转换数值
        const value = row[key]
        cleaned[cleanKey] = isNaN(value) ? value : Number(value)
      })
      return cleaned
    })
}
```

#### 数据验证

```tsx
// 数据验证函数
function validateChartData(data, requiredFields) {
  if (!Array.isArray(data)) {
    throw new Error('数据必须是数组格式')
  }

  if (data.length === 0) {
    throw new Error('数据不能为空')
  }

  requiredFields.forEach(field => {
    if (!data[0].hasOwnProperty(field)) {
      throw new Error(`缺少必需字段: ${field}`)
    }
  })

  return true
}
```

### 2. 性能优化

#### 数据采样

```tsx
// 大数据采样函数
function sampleData(data, maxPoints = 1000) {
  if (data.length <= maxPoints) return data

  const step = Math.ceil(data.length / maxPoints)
  return data.filter((_, index) => index % step === 0)
}

// 使用示例
const sampledData = sampleData(largeDataSet, 500)
```

#### 懒加载

```tsx
import dynamic from 'next/dynamic'

// 动态导入图表组件
const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  {
    ssr: false,
    loading: () => <div>加载图表中...</div>
  }
)
```

### 3. 错误处理

#### 错误边界

```tsx
import { Component } from 'react'

class ChartErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    console.error('图表渲染错误:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-4">
          <p>图表加载失败，请刷新页面重试</p>
          <button onClick={() => this.setState({ hasError: false })}>
            重试
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 使用示例
<ChartErrorBoundary>
  <EChartsComponent option={chartOption} />
</ChartErrorBoundary>
```

## 🎯 图表选择指南

### 根据数据类型选择

| 数据类型 | 推荐图表 | 说明 |
|---------|---------|------|
| **时间序列** | 折线图、面积图 | 展示随时间变化的趋势 |
| **分类比较** | 柱状图、条形图 | 比较不同类别的数值 |
| **占比分析** | 饼图、环形图 | 显示部分与整体的关系 |
| **相关性** | 散点图、气泡图 | 展示两个或多个变量的关系 |
| **多维度** | 雷达图、平行坐标图 | 同时比较多个维度 |
| **地理数据** | 地图、热力图 | 展示地理位置相关的数据 |
| **层次结构** | 树图、旭日图 | 显示数据的层级关系 |

### 根据信息传达目的选择

- **展示趋势** → 折线图、面积图
- **比较数据** → 柱状图、条形图
- **展示分布** -> 直方图、箱线图
- **显示关系** -> 散点图、网络图
- **展示构成** -> 饼图、堆叠柱状图
- **显示过程** -> 桑基图、流程图

## 🔗 相关资源

### 官方文档
- [ECharts 官方文档](https://echarts.apache.org/)
- [Nivo 官方网站](https://nivo.rocks/)
- [AntV G2 文档](https://g2.antv.vision/en)
- [Leaflet 文档](https://leafletjs.com/)

### 学习资源
- [Data-to-Viz](https://www.data-to-viz.com/) - 图表类型选择指南
- [D3.js Gallery](https://observablehq.com/@d3/gallery) - 数据可视化灵感
- [Chart.js Docs](https://www.chartjs.org/docs/) - Chart.js 学习文档

### 工具推荐
- [Datawrapper](https://www.datawrapper.de/) - 在线图表生成工具
- [Flourish](https://flourish.studio/) - 交互式数据可视化平台
- [RawGraphs](https://rawgraphs.io/) - 数据可视化工具

### 颜色方案
- [ColorBrewer](https://colorbrewer2.org/) - 地图配色方案
- [Coolors](https://coolors.co/) - 配色方案生成器
- [Adobe Color](https://color.adobe.com/) - 专业配色工具

---

## 总结

通过本指南，您已经了解了如何在博客中使用各种数据可视化工具。记住以下关键点：

1. **选择合适的图表类型**：根据数据特征和传达目的选择最合适的图表
2. **保持简洁清晰**：避免过度装饰，让数据说话
3. **注重交互体验**：合理使用动画和交互功能
4. **确保可访问性**：提供文字说明和键盘导航支持
5. **优化性能**：对大数据进行采样和优化

持续练习和探索，您将能够创建出专业、美观、富有洞察力的数据可视化内容。