# 写作指南

本指南介绍如何使用 Markdown 和 MDX 组件撰写博客文章。

## 目录

- [Markdown 基础](#markdown-基础)
- [MDX 高级用法](#mdx-高级用法)
- [交互式组件](#交互式组件)
- [数学公式](#数学公式)
- [代码高亮](#代码高亮)
- [图片和媒体](#图片和媒体)
- [最佳实践](#最佳实践)

## Markdown 基础

### 标题

``````markdown
# 一级标题（文章标题由 frontmatter title 提供，很少使用）

## 二级标题

### 三级标题

#### 四级标题

##### 五级标题

###### 六级标题
``````

### 文本格式

```markdown
**粗体文本**
*斜体文本*
***粗斜体文本***
~~删除线~~

`行内代码`
```

### 列表

**无序列表**:
```markdown
- 项目 1
- 项目 2
  - 子项目 2.1
  - 子项目 2.2
- 项目 3
```

**有序列表**:
```markdown
1. 第一步
2. 第二步
3. 第三步
```

**任务列表**:
```markdown
- [x] 已完成任务
- [ ] 未完成任务
```

### 链接

```markdown
[链接文本](https://example.com)
[带标题的链接](https://example.com "鼠标悬停显示")

[相对链接](/blog/robotics/my-post)
```

### 引用

```markdown
> 这是一段引用文本
>
> 可以有多行
>
> > 可以嵌套引用
```

### 分隔线

```markdown
---
或
***
或
___
```

## MDX 高级用法

### 导入组件

```mdx
import { MyComponent } from '@/components/MyComponent'
import { Chart } from '@/components/charts/LineChart'

<MyComponent prop="value" />
```

### 导入代码文件

```mdx
import CodeBlock from '@/components/CodeBlock'

<CodeBlock language="rust" meta="main.rs">
  {`fn main() {
    println!("Hello, World!");
  }`}
</CodeBlock>
```

### 使用 JSX

```mdx
<div className="custom-class">
  <h2>自定义样式</h2>
  <p>使用 Tailwind CSS 类名</p>
</div>
```

### 嵌入组件

```mdx
import Alert from '@/components/Alert'

<Alert type="warning">
  这是一个警告提示框
</Alert>
```

## 交互式组件

### 3D 可视化

#### Three.js 模型

```mdx
import { ThreeViewer } from '@/components/3d/ThreeViewer'

<ThreeViewer
  modelPath="/models/robot.glb"
  width="100%"
  height="500px"
  enableControls={true}
/>
```

#### URDF 机器人模型

```mdx
import { URDFViewer } from '@/components/3d/URDFViewer'

<URDFViewer
  urdfPath="/robots/arm.urdf"
  meshesPath="/robots/meshes"
/>
```

### 化学可视化

#### 分子结构

```mdx
import { MoleculeViewer } from '@/components/chemistry/MoleculeViewer'

<!-- PDB 格式 -->
<MoleculeViewer
  pdbFile="/molecules/protein.pdb"
  style="sphere"
  backgroundColor="white"
/>

<!-- SMILES 字符串 -->
<ChemicalStructure smiles="CCO" />
```

#### 化学方程式

```mdx
$$
2H_2 + O_2 \xrightarrow{点燃} 2H_2O
$$
```

使用 mhchem 语法：
```mdx
$\ce{2H2 + O2 ->[\text{点燃}] 2H2O}$
```

### 数据图表

#### Nivo 图表

```mdx
import { LineChart } from '@/components/charts/LineChart'
import { BarChart } from '@/components/charts/BarChart'

<LineChart
  data={chartData}
  xKey="date"
  yKey="value"
  width="100%"
  height={400}
/>

<BarChart
  data={data}
  xKey="category"
  yKey="value"
  layout="horizontal"
/>
```

#### ECharts

```mdx
import { EChart } from '@/components/charts/EChart'

<EChart
  option={{
    xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', data: [150, 230, 224] }]
  }}
  height="400px"
/>
```

#### AntV G2

```mdx
import { G2Chart } from '@/components/charts/G2Chart'

<G2Chart
  data={data}
  type="line"
  xField="date"
  yField="value"
  height={400}
/>
```

#### 图可视化（G6）

```mdx
import { GraphVisualization } from '@/components/charts/GraphVisualization'

<GraphVisualization
  data={graphData}
  layout="force"
  height={500}
/>
```

### 音乐组件

#### 乐谱显示

```mdx
import { MusicNotation } from '@/components/music/MusicNotation'

<MusicNotation
  xmlPath="/music/score.musicxml"
  width="100%"
  height={600}
/>
```

#### 音频合成

```mdx
import { Piano } from '@/components/music/Piano'

<Piano startNote="C4" endNote="C6" />
```

### 地图

```mdx
import { Map } from '@/components/maps/Map'

<Map
  center={[39.9042, 116.4074]}
  zoom={13}
  markers={[
    { position: [39.9042, 116.4074], popup: "北京" }
  ]}
/>
```

### 绘图板

```mdx
import { Excalidraw } from '@/components/drawing/Excalidraw'

<Excalidraw
  id="drawing-1"
  width="100%"
  height={500}
/>
```

## 数学公式

### 行内公式

使用单个 `$` 包裹：

```markdown
爱因斯坦质能方程：$E = mc^2$
```

### 块级公式

使用双个 `$$` 包裹：

``````markdown
$$
\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}
$$
``````

### KaTeX 语法

#### 希腊字母

```markdown
$\alpha, \beta, \gamma, \Delta, \Omega$
```

#### 上标和下标

```markdown
$x^2, x_1, x^{2n}$
```

#### 分数

```markdown
$\frac{a}{b}$
```

#### 根号

```markdown
$\sqrt{x}, \sqrt[3]{x}$
```

#### 求和与积分

```markdown
$\sum_{i=1}^{n} i^2$
$\int_{a}^{b} f(x) dx$
```

#### 矩阵

```markdown
$$
\begin{pmatrix}
a & b \\
c & d
\end{pmatrix}
$$
```

#### 方程组

```markdown
$$
\begin{cases}
3x + 2y = 7 \\
2x - y = 4
\end{cases}
$$
```

## 代码高亮

### 内联代码

```markdown
使用 `const` 声明常量
```

### 代码块

指定语言：

``````markdown
```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```
``````

### 支持的语言

- `javascript` / `js`
- `typescript` / `ts`
- `python`
- `rust`
- `cpp` / `c++`
- `java`
- `go`
- `bash` / `shell`
- `markdown` / `md`
- `yaml` / `yml`
- `json`
- `html`
- `css`
- `sql`

### 显示行号

``````markdown
```python {1,3-5}
def hello():
    print("Line 2")
    print("Line 3")
    print("Line 4")
    print("Line 5")
```
``````

### 代码标题

``````markdown
```python title="hello.py"
print("Hello, World!")
```
``````

## 图片和媒体

### 标准图片

```markdown
![替代文本](/images/blog/post/image.png)
```

### 带标题的图片

```markdown
![替代文本](/images/blog/post/image.png "图片标题")
```

### 响应式图片

```mdx
import Image from 'next/image'

<Image
  src="/images/blog/post/image.png"
  alt="描述"
  width={800}
  height={600}
/>
```

### 视频

```markdown
![视频描述](/videos/demo.mp4)
```

或使用 YouTube 嵌入：

```mdx
<iframe
  width="560"
  height="315"
  src="https://www.youtube.com/embed/VIDEO_ID"
  frameborder="0"
  allowfullscreen
/>
```

## 表格

### 标准表格

```markdown
| 列 1 | 列 2 | 列 3 |
|------|------|------|
| 数据 1 | 数据 2 | 数据 3 |
| 数据 4 | 数据 5 | 数据 6 |
```

### 对齐方式

```markdown
| 左对齐 | 居中 | 右对齐 |
|:-------|:----:|-------:|
| Left   | Center | Right |
```

## 脚注

```markdown
这是一段文本[^1]

[^1]: 这是脚注内容
```

## 最佳实践

### ✅ 推荐做法

1. **结构清晰**：
   - 使用适当的标题层级
   - 段落不宜过长
   - 适当留白

2. **代码示例**：
   - 始终指定语言
   - 添加必要注释
   - 保持简洁

3. **图片优化**：
   - 使用 WebP 格式
   - 压缩图片大小
   - 添加 alt 文本

4. **链接检查**：
   - 使用相对链接（内部）
   - 验证外部链接有效性
   - 添加描述性锚文本

5. **数学公式**：
   - 简单公式使用行内
   - 复杂公式使用块级
   - 保持可读性

### ❌ 避免做法

1. **不要**过度使用加粗
2. **不要**创建过深的标题嵌套（最多 4 级）
3. **不要**使用过大的图片
4. **不要**忘记代码语言标识
5. **不要**忽略可访问性（alt 文本等）

## 快捷键提示

### VS Code

| 快捷键 | 功能 |
|--------|------|
| `Ctrl/Cmd + B` | 加粗 |
| `Ctrl/Cmd + I` | 斜体 |
| `Ctrl/Cmd + K` | 插入链接 |
| `Ctrl/Cmd + Shift + F` | 格式化文档 |

## 相关文档

- [内容管理](content-management.md) - 创建和管理文章
- [前端架构](../development/frontend/overview.md) - 组件开发
- [样式系统](../development/frontend/styling.md) - Tailwind CSS

---

**最后更新**: 2025-12-27
