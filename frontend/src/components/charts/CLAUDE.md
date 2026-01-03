# Charts Components Module

## Purpose
Reusable chart components for data visualization using multiple charting libraries.

## Files
- `AntVChart.tsx` - AntV G2 plot integration
- `ECharts3DTest.tsx` - 3D chart testing component
- `EChartsComponent.tsx` - Apache ECharts wrapper
- `index.ts` - Component exports
- `NivoBarChart.tsx` - Nivo bar chart
- `NivoLineChart.tsx` - Nivo line chart
- `NivoPieChart.tsx` - Nivo pie chart

## Architecture

### Supported Libraries

#### Nivo Charts (Primary)
```typescript
// Responsive, declarative charts
<ResponsiveBar />    // Bar charts
<ResponsiveLine />   // Line charts
<ResponsivePie />    // Pie charts
```

#### ECharts
```typescript
// Apache ECharts integration
// Comprehensive charting library
// 3D charts support
```

#### AntV G2
```typescript
// AntV G2Plot integration
// Grammar of Graphics
// Statistical charts
```

### Component Interface

#### NivoBarChart
```typescript
interface NivoBarChartProps {
  data: any[]                    // Chart data
  keys: string[]                 // Data keys to plot
  indexBy: string                // Index/key field
  width?: number                 // Chart width
  height?: number                // Chart height (default 400)
  margin?: {                     // Chart margins
    top: number
    right: number
    bottom: number
    left: number
  }
  colors?: any                   // Color scheme
  theme?: any                    // Nivo theme
  animate?: boolean              // Enable animations (default true)
}
```

#### NivoLineChart
```typescript
interface NivoLineChartProps {
  data: any[]
  // Similar to bar chart
  // Curve type (linear, monotone, etc.)
  // Point size, colors
}
```

#### NivoPieChart
```typescript
interface NivoPieChartProps {
  data: any[]
  // Arc-specific props
  // Inner radius for donut charts
  // Colors, labels
}
```

### Key Features

#### Responsive Design
```typescript
// Automatic resizing
<ResponsiveBar
  data={data}
  keys={keys}
  indexBy={indexBy}
/>
```

#### Theme Support
```typescript
// Dark/light mode themes
const theme = {
  textColor: '#ffffff',
  grid: { stroke: '#444444' }
}
```

#### Animations
```typescript
// Smooth transitions
animate={true}
// Custom animation config
motionConfig="wobbly"
```

#### Accessibility
```typescript
role="application"
ariaLabel="Nivo bar chart"
// Screen reader support
```

### Technologies
- @nivo/bar, @nivo/line, @nivo/pie
- echarts, echarts-for-react
- @antv/g2plot
- React

## Integration Points

### Data Formats
```typescript
// Nivo format
const data = [
  { country: 'USA', value: 100 },
  { country: 'China', value: 200 }
]

// Time series data
const timeSeriesData = [
  { x: '2024-01', y: 10 },
  { x: '2024-02', y: 20 }
]
```

### Color Schemes
```typescript
// Built-in schemes
colors={{ scheme: 'nivo' }}
colors={{ scheme: 'category10' }}
colors={{ scheme: 'paired' }}

// Custom colors
colors={['#ff0000', '#00ff00', '#0000ff']}
```

## Data Flow
```
Data prop → Chart component → Render → User interaction (hover/click) → Tooltip display
```

## Dependencies
- **External**:
  - `@nivo/bar`, `@nivo/line`, `@nivo/pie`
  - `echarts`, `echarts-for-react`
  - `@antv/g2plot`

## Styling
- **Responsive**: Automatic container-based resizing
- **Theming**: Custom themes for dark mode
- **Colors**: Configurable color schemes
- **Legends**: Customizable position and style

## Performance Considerations

#### Optimization
- **Data size**: Limit to ~1000 data points for smooth rendering
- **Debouncing**: Debounce resize events
- **Memoization**: Memo chart configurations
- **Lazy loading**: Load chart libraries on-demand

#### Large Datasets
```typescript
// Sampling for large datasets
const sampledData = data.filter((_, i) => i % 10 === 0)
// Consider aggregation
```

## Usage Examples

#### Bar Chart
```typescript
<NivoBarChart
  data={[
    { category: 'A', value1: 10, value2: 20 },
    { category: 'B', value1: 15, value2: 25 }
  ]}
  keys={['value1', 'value2']}
  indexBy="category"
/>
```

#### Line Chart
```typescript
<NivoLineChart
  data={timeSeriesData}
  xScale={{ type: 'time' }}
  axisBottom={{ format: '%Y-%m-%d' }}
/>
```

#### Pie Chart
```typescript
<NivoPieChart
  data={[
    { id: 'A', value: 10 },
    { id: 'B', value: 20 }
  ]}
  innerRadius={0.5}  // Donut chart
/>
```

## Future Enhancements
- [ ] Chart downloads (PNG/SVG)
- [ ] Interactive filtering
- [ ] Real-time data updates
- [ ] Drill-down functionality
- [ ] Custom tooltips
- [ ] Combination charts
- [ ] Gauge charts
- [ ] Heatmaps
- [ ] Treemaps
- [ ] Sankey diagrams
