# 化学可视化组件本地化部署文档

## 概述

本文档记录了将化学可视化组件（KaTeX、RDKit、3Dmol.js）从外部 CDN 迁移到本地部署的完整过程，确保应用可以在完全离线的环境中运行。

## 背景与问题

### 初始问题

1. **CSP（Content Security Policy）违规**：动态加载的外部脚本被 CSP 策略阻止
2. **网络依赖**：化学库从外部 CDN 加载，无法离线使用
3. **WebAssembly 限制**：RDKit WASM 模块需要特殊的 CSP 权限

### 错误示例

```
Loading the script 'https://unpkg.com/3dmol@2.5.3/build/3Dmol-min.js' violates
the following Content Security Policy directive: "script-src-elem 'self' 'unsafe-inline'
'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is"
```

```
Evaluating a string as JavaScript violates the following Content Security Policy
directive because 'unsafe-eval' is not an allowed source of script
```

## 解决方案

### 整体架构

将化学可视化库分为两类处理：

| 库名 | 用途 | 加载方式 |
|------|------|----------|
| **KaTeX + mhchem** | 化学公式渲染 | npm 包动态导入 |
| **RDKit** | 2D 化学结构生成 | 本地文件 + Script 组件 |
| **3Dmol.js** | 3D 分子可视化 | npm 包动态导入 |

### CSP 配置更新

在 `frontend/next.config.js` 中更新 CSP 策略：

```javascript
// 生产环境 CSP 配置
'script-src': "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is",
'script-src-elem': "'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval' giscus.app analytics.umami.is https://cloud.umami.is",
```

**关键权限说明**：
- `'unsafe-eval'`：允许 RDKit WebAssembly 模块动态执行代码
- `'wasm-unsafe-eval'`：允许 WebAssembly 编译和实例化
- `'self'`：允许同源脚本（包括 npm 包 bundled 后的代码）

## 技术实施细节

### 1. KaTeX + mhchem（化学公式）

**组件**：`frontend/components/chemistry/MhchemInit.tsx`

```typescript
// 使用 npm 包动态导入
const katex = await import('katex')

// 确保全局可访问
if (typeof window !== 'undefined') {
  ;(window as any).katex = katex
}

// 导入 mhchem 扩展
await import('katex/contrib/mhchem')
```

**优点**：
- 完全通过 npm 管理，无需额外文件
- 自动 bundled，不违反 CSP
- 支持离线使用

### 2. RDKit（2D 化学结构）

**组件**：`frontend/components/hooks/useChemistryLocal.ts`

```typescript
// 轮询等待 initRDKitModule 函数可用
const waitForRDKit = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const checkRDKit = () => {
      if ((window as any).initRDKitModule) {
        resolve((window as any).initRDKitModule())
      } else if (waitedTime >= maxWaitTime) {
        reject(new Error('RDKit script did not load within 10 seconds'))
      } else {
        waitedTime += checkInterval
        setTimeout(checkRDKit, checkInterval)
      }
    }
    checkRDKit()
  })
}
```

**Script 加载**：在需要的页面中添加

```typescript
import Script from 'next/script'

<Script
  src="/chemistry/rdkit/RDKit_minimal.js"
  strategy="beforeInteractive"
/>
```

**本地文件**：
- `frontend/public/chemistry/rdkit/RDKit_minimal.js` (128 KB)
- `frontend/public/chemistry/rdkit/RDKit_minimal.wasm` (6.9 MB)

**来源**：从 `node_modules/@rdkit/rdkit/dist/` 复制

### 3. 3Dmol.js（3D 分子可视化）

**组件**：`frontend/components/chemistry/ChemicalStructure.tsx`

```typescript
// 直接使用 npm 包导入
const $3Dmol = await import('3dmol')

// 确保全局可访问
if (typeof window !== 'undefined') {
  ;(window as any).$3Dmol = $3Dmol
}

// 创建 viewer
const viewer = $3Dmol.createViewer(container, {
  backgroundColor: backgroundColor || 0xffffff,
} as any)
```

**SimpleChemicalStructure 组件**：同样更新为使用 npm 包

**优点**：
- 完全通过 npm 管理
- Next.js 自动 bundled
- 不违反 CSP 策略

### 4. Service Worker 更新

**文件**：`frontend/public/sw.js`

```javascript
// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 只处理同源请求
  if (url.origin !== location.origin) {
    return
  }

  // 跳过化学可视化库文件（避免CSP问题）
  if (url.pathname.startsWith('/chemistry/')) {
    return
  }
  // ... 其他处理
})
```

**原因**：避免 Service Worker 拦截化学库请求导致 CSP 检查问题

## 文件修改清单

### 新增文件

1. **`frontend/app/test-3dmol/page.tsx`**
   - 专门的 3Dmol.js 测试页面
   - 包含多个测试用例（水分子、甲烷、乙醇）

2. **本地化学库文件**
   ```
   frontend/public/chemistry/
   ├── katex/
   │   ├── katex.min.js
   │   ├── katex.min.css
   │   ├── fonts/ (*.woff2)
   │   └── contrib/
   │       └── mhchem.min.js
   ├── 3dmol/
   │   └── 3Dmol-min.js
   └── rdkit/
       ├── RDKit_minimal.js
       └── RDKit_minimal.wasm
   ```

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `frontend/next.config.js` | 更新 CSP 配置，添加 `unsafe-eval` 权限 |
| `frontend/components/chemistry/MhchemInit.tsx` | 改用 npm 包导入 |
| `frontend/components/chemistry/ChemicalStructure.tsx` | 改用 npm 包导入 |
| `frontend/components/chemistry/SimpleChemicalStructure.tsx` | 改用 npm 包导入 |
| `frontend/components/hooks/useChemistryLocal.ts` | 添加轮询等待 RDKit 加载 |
| `frontend/app/blog/[...slug]/page.tsx` | 添加 RDKit Script 组件 |
| `frontend/app/test-chemistry/page.tsx` | 添加 RDKit Script 组件 |
| `frontend/public/sw.js` | 排除 `/chemistry/*` 路径 |
| `frontend/tsconfig.json` | 排除 `public/chemistry` 目录 |

## 配置说明

### TypeScript 配置

**文件**：`frontend/tsconfig.json`

```json
{
  "exclude": [
    "node_modules",
    "public/chemistry"
  ]
}
```

**原因**：避免 TypeScript 尝试解析化学库的 JavaScript 文件

### Docker 配置

确保容器可以访问本地文件：

```dockerfile
# frontend/Dockerfile
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 确保 public 目录被正确复制
COPY public/chemistry ./public/chemistry
```

## 测试步骤

### 1. 基础功能测试

#### RDKit 测试（2D 结构）

访问：`http://localhost:3001/test-chemistry`

预期结果：
```
RDKit Status
Loaded: ✓ Yes
Error: None
RDKit Object: ✓ Available
```

点击 "Run All Tests"，所有测试应通过。

#### 3Dmol 测试（3D 结构）

访问：`http://localhost:3001/test-3dmol`

预期结果：
- 看到 3 个可交互的 3D 分子结构
- 可以用鼠标拖拽旋转
- 可以用滚轮缩放

#### 化学公式测试

访问任何包含化学公式的博客文章，例如：
- `http://localhost:3001/blog/chemistry/rdkit-visualization`

预期结果：
- 化学公式正确渲染
- 控制台显示 "mhchem扩展加载成功"

### 2. 离线测试

1. 断开网络连接
2. 刷新页面
3. 所有化学可视化功能应正常工作

### 3. CSP 合规性测试

1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签
3. 确认没有 CSP 违规错误

## 常见问题

### Q1: RDKit 加载失败

**症状**：
```
Error: RDKit script did not load within 10 seconds
```

**解决方案**：
1. 确认 `Script` 组件已添加到页面
2. 确认 RDKit 文件在 `frontend/public/chemistry/rdkit/` 目录
3. 检查浏览器控制台是否有其他错误

### Q2: 3Dmol viewer 初始化失败

**症状**：
```
初始化viewer失败: Event {isTrusted: true, type: 'error', ...}
```

**解决方案**：
1. 确认正在使用 npm 包导入（不是 CDN）
2. 检查 CSP 配置是否包含 `'unsafe-eval'`
3. 清除浏览器缓存并硬刷新

### Q3: 化学公式不显示

**症状**：
化学公式显示为原始 LaTeX 代码

**解决方案**：
1. 确认 `MhchemInit` 组件已加载
2. 检查浏览器控制台是否有 mhchem 加载日志
3. 确认 KaTeX CSS 已导入（通常在 MDX 文件中）

### Q4: TypeScript 编译错误

**症状**：
```
Module not found: Can't resolve 'fs'
```

**解决方案**：
确认 `frontend/tsconfig.json` 已排除 `public/chemistry` 目录

### Q5: Service Worker 缓存问题

**症状**：
更新后仍加载旧版本的化学库

**解决方案**：
1. 打开 DevTools > Application > Service Workers
2. 点击 "Unregister" 注销旧 Service Worker
3. DevTools > Application > Storage > "Clear site data"
4. 硬刷新页面（Ctrl+Shift+R）

## 部署检查清单

### 开发环境

- [ ] 确认所有化学库文件在 `frontend/public/chemistry/` 目录
- [ ] 确认 CSP 配置正确
- [ ] 确认 TypeScript 配置已更新
- [ ] 运行 `pnpm build` 确认无编译错误
- [ ] 测试所有化学可视化功能

### 生产环境

- [ ] 确认 `NEXT_PUBLIC_NODE_ENV` 环境变量设置正确
- [ ] 确认 Docker 容器可以访问 `public/chemistry` 目录
- [ ] 确认 CSP 响应头正确发送
- [ ] 执行离线测试确认无网络依赖
- [ ] 检查浏览器控制台确认无 CSP 违规

## 性能优化建议

### 1. 代码分割

化学库已通过动态导入自动分割：

```typescript
// KaTeX + mhchem
await import('katex')
await import('katex/contrib/mhchem')

// 3Dmol.js
await import('3dmol')
```

### 2. 预加载

对于关键的化学库页面，可以考虑预加载：

```typescript
// 在 layout 或页面中预加载
import dynamic from 'next/dynamic'

const ChemicalStructure = dynamic(
  () => import('@/components/chemistry/ChemicalStructure'),
  { ssr: false }
)
```

### 3. 缓存策略

RDKit WASM 文件较大（6.9 MB），确保：
- 浏览器缓存已正确配置
- Service Worker 缓存策略已优化
- CDN（如果使用）已正确缓存大文件

## 维护指南

### 更新化学库版本

#### 更新 KaTeX

```bash
cd frontend
pnpm update katex
```

#### 更新 RDKit

```bash
cd frontend
pnpm update @rdkit/rdkit

# 复制新的 WASM 文件到 public 目录
cp node_modules/@rdkit/rdkit/dist/RDKit_minimal.js public/chemistry/rdkit/
cp node_modules/@rdkit/rdkit/dist/RDKit_minimal.wasm public/chemistry/rdkit/
```

#### 更新 3Dmol.js

```bash
cd frontend
pnpm update 3dmol
```

### 重新构建

```bash
# 重新构建 Docker 镜像
docker-compose build frontend

# 重启服务
docker-compose up -d frontend
```

## 相关资源

### 官方文档

- [KaTeX 文档](https://katex.org/)
- [RDKit.js 文档](http://www.rdkit.org/js/)
- [3Dmol.js 文档](https://3dmol.org/)

### 相关文件

- CSP 配置：`frontend/next.config.js`
- KaTeX 组件：`frontend/components/chemistry/MhchemInit.tsx`
- RDKit Hook：`frontend/components/hooks/useChemistryLocal.ts`
- 3Dmol 组件：`frontend/components/chemistry/ChemicalStructure.tsx`

## 更新日志

### v1.0.0 (2025-01-29)

- ✅ 完成所有化学库本地化
- ✅ 修复所有 CSP 违规问题
- ✅ 实现完全离线支持
- ✅ 更新 Service Worker 策略
- ✅ 添加完整的测试页面

---

**文档维护者**：Claude & Zhengbi Yong
**最后更新**：2025-01-29
**版本**：1.0.0
