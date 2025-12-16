# Excalidraw 集成指南

根据 [Excalidraw GitHub 仓库](https://github.com/excalidraw/excalidraw) 的官方文档，本文档说明如何将 Excalidraw 集成到项目中。

## 目录

1. [安装](#安装)
2. [基本使用](#基本使用)
3. [高级配置](#高级配置)
4. [两种集成方式对比](#两种集成方式对比)
5. [常见问题](#常见问题)

## 安装

项目已经安装了 Excalidraw：

```bash
npm install @excalidraw/excalidraw
# 或
yarn add @excalidraw/excalidraw
```

**注意**：Excalidraw 需要 React 和 ReactDOM，确保已安装：

- `react` >= 16.0.0
- `react-dom` >= 16.0.0

## 基本使用

### 1. 最简单的集成

```tsx
'use client'

import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/dist/excalidraw.css'

export default function MyExcalidraw() {
  return (
    <div style={{ height: '100vh' }}>
      <Excalidraw />
    </div>
  )
}
```

### 2. 在 Next.js 中使用（推荐）

由于 Next.js 的 SSR，需要使用动态导入：

```tsx
'use client'

import dynamic from 'next/dynamic'

const Excalidraw = dynamic(
  async () => {
    const excalidrawModule = await import('@excalidraw/excalidraw')
    // 重要：必须导入 CSS
    await import('@excalidraw/excalidraw/dist/excalidraw.css')
    return { default: excalidrawModule.Excalidraw }
  },
  {
    ssr: false, // 禁用 SSR
    loading: () => <div>加载中...</div>,
  }
)

export default function MyExcalidraw() {
  return (
    <div style={{ height: '100vh' }}>
      <Excalidraw />
    </div>
  )
}
```

### 3. 使用 API 控制

```tsx
'use client'

import { useState, useRef } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import '@excalidraw/excalidraw/dist/excalidraw.css'

export default function MyExcalidraw() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null)

  const handleSave = () => {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements()
      const appState = excalidrawAPI.getAppState()
      console.log('保存数据:', { elements, appState })
    }
  }

  return (
    <div style={{ height: '100vh' }}>
      <button onClick={handleSave}>保存</button>
      <Excalidraw
        ref={(api) => setExcalidrawAPI(api)}
        onChange={(elements, appState) => {
          console.log('变化:', elements, appState)
        }}
      />
    </div>
  )
}
```

## 高级配置

### 主题支持

```tsx
import { Excalidraw } from '@excalidraw/excalidraw'

;<Excalidraw
  theme="dark" // 或 "light"
  // 或者自动检测
  theme={isDark ? 'dark' : 'light'}
/>
```

### 初始数据

```tsx
<Excalidraw
  initialData={{
    elements: [...], // 元素数组
    appState: {...}, // 应用状态
    files: {...}     // 文件
  }}
/>
```

### 只读模式

```tsx
<Excalidraw viewModeEnabled={true} />
```

### 自定义 UI

```tsx
<Excalidraw
  UIOptions={{
    canvasActions: {
      saveToActiveFile: false,
      loadScene: false,
      export: true,
    },
  }}
/>
```

### 导出功能

```tsx
import { exportToPNG, exportToSVG, exportToBlob } from '@excalidraw/excalidraw'

// 导出为 PNG
const pngDataURL = await exportToPNG({
  elements,
  appState,
  files: {},
  getDimensions: (width, height) => ({ width, height }),
})

// 导出为 SVG
const svgString = await exportToSVG({
  elements,
  appState,
  files: {},
})

// 导出为 Blob
const blob = await exportToBlob({
  elements,
  appState,
  files: {},
  mimeType: 'image/png',
})
```

## 两种集成方式对比

### 方式 1: NPM 包集成（推荐用于自定义需求）

**优点：**

- ✅ 完全控制样式和行为
- ✅ 可以深度自定义
- ✅ 可以保存数据到本地存储
- ✅ 可以集成到应用的工作流中
- ✅ 不依赖外部服务

**缺点：**

- ❌ 需要处理 CSS 导入
- ❌ 需要处理 CSP 配置
- ❌ 包体积较大（~500KB）
- ❌ 需要处理初始化问题

**适用场景：**

- 需要自定义 UI
- 需要保存数据到数据库
- 需要集成到应用工作流
- 需要离线功能

### 方式 2: iframe 集成（当前方案）

**优点：**

- ✅ 实现简单
- ✅ 无需处理依赖
- ✅ 自动获得最新功能
- ✅ 无需处理样式问题

**缺点：**

- ❌ 功能受限
- ❌ 依赖外部服务
- ❌ 无法深度自定义
- ❌ 需要网络连接

**适用场景：**

- 快速集成
- 不需要自定义
- 不需要保存数据
- 简单展示需求

## 常见问题

### 1. 样式不显示

**问题**：Excalidraw 显示异常或样式丢失

**解决方案**：

```tsx
// 确保导入 CSS
import '@excalidraw/excalidraw/dist/excalidraw.css'
```

### 2. SSR 错误

**问题**：Next.js 报错 "window is not defined"

**解决方案**：

```tsx
// 使用动态导入并禁用 SSR
const Excalidraw = dynamic(
  () =>
    import('@excalidraw/excalidraw').then((mod) => ({
      default: mod.Excalidraw,
    })),
  { ssr: false }
)
```

### 3. CSP 错误

**问题**：字体或脚本被 CSP 阻止

**解决方案**：
在 `next.config.js` 中更新 CSP：

```js
font-src 'self' data: blob:;
frame-src excalidraw.com;
```

### 4. 初始化问题

**问题**：显示锁图标或空白

**解决方案**：

- 确保传递正确的 `initialData` 格式
- 确保主题正确初始化
- 使用 `excalidrawAPI.updateScene()` 更新场景

### 5. 性能优化

**建议**：

- 使用动态导入减少初始 bundle 大小
- 使用 `React.memo` 包装组件
- 避免在 `onChange` 中执行重操作

## 参考资源

- [Excalidraw GitHub](https://github.com/excalidraw/excalidraw)
- [Excalidraw 文档](https://docs.excalidraw.com/)
- [Excalidraw 网站](https://excalidraw.com)
- [npm 包](https://www.npmjs.com/package/@excalidraw/excalidraw)

## 项目中的实现

当前项目提供了两种实现：

1. **ExcalidrawViewer.tsx** - iframe 方式（当前使用）
2. **ExcalidrawViewerNPM.tsx** - NPM 包方式（示例）

可以根据需求选择合适的方案。
