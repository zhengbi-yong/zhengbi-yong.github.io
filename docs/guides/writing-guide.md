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

## 博客写作工作流程 / Blog Writing Workflow

本章节介绍如何在博客系统中撰写、管理和备份文章。

### 📝 写作方式 / Writing Methods

#### 方式一：使用管理后台（推荐） / Using Admin Panel (Recommended)

访问：`http://localhost:3001/admin` 或 `http://your-domain.com/admin`

**功能 / Features：**
- ✅ 创建新文章（Markdown/MDX格式） / Create new posts
- ✅ 编辑已有文章 / Edit existing posts
- ✅ 上传图片和管理媒体文件 / Upload images and media
- ✅ 设置分类和标签 / Set categories and tags
- ✅ 定时发布 / Schedule publishing
- ✅ 查看文章统计 / View post statistics

**步骤 / Steps：**
1. 登录管理后台 / Login to admin panel
2. 点击 "Posts" 或 "文章管理" / Click "Posts"
3. 点击 "New Post" 或 "新建文章" / Click "New Post"
4. 填写标题、内容、标签等 / Fill in title, content, tags
5. 点击 "Save" 保存草稿 / Click "Save" for draft
6. 点击 "Publish" 发布文章 / Click "Publish" to publish

#### 方式二：本地编辑 + API 上传 / Local Editor + API Upload

如果你喜欢用本地编辑器写文章 / If you prefer local editors:

1. **本地编写MDX文件**（使用VS Code等） / Write MDX locally
2. **通过API上传到数据库** / Upload via API

```bash
# 示例：使用curl创建文章 / Example: Create post via curl
curl -X POST http://localhost:3000/v1/admin/posts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的新文章",
    "content": "# 欢迎阅读\n\n这是文章内容...",
    "summary": "文章简介",
    "status": "draft",
    "tags": ["技术", "教程"]
  }'
```

#### 方式三：导出→编辑→导入（高级用户） / Export → Edit → Import (Advanced)

**工作流程 / Workflow:**

```bash
# 1. 导出所有文章为MDX文件 / Export all posts as MDX
./scripts/export/export-all-posts.py

# 2. 用你喜欢的编辑器编辑MDX文件 / Edit with your favorite editor
code ./exported-posts-mdx/

# 3. 编辑完成后，通过管理后台或API导入 / Import via admin panel or API
```

### 💾 备份策略 / Backup Strategy

#### 自动备份 / Automatic Backup

系统已经配置了自动备份，每天凌晨2点执行 / Auto-backup runs daily at 2 AM:

```bash
# 查看自动备份状态 / Check auto-backup status
crontab -l

# 查看备份日志 / View backup logs
tail -f scripts/logs/backup.log
```

**备份位置 / Backup Location：** `./backups/`
- `db_YYYYMMDD_HHMMSS.sql.gz` - 数据库备份（压缩）
- `redis_YYYYMMDD_HHMMSS.rdb` - Redis缓存备份
- 自动保留最近7天的备份 / Keeps last 7 days

#### 手动备份 / Manual Backup

**方法1: 使用备份脚本 / Method 1: Backup Script**
```bash
# 执行完整备份 / Execute full backup
./scripts/backup/backup-all.sh
```

**方法2: 导出为可读格式 / Method 2: Export to Readable Format**
```bash
# 导出为多种格式 / Export to multiple formats
./scripts/export/export-posts-to-mdx.sh ./my-backup
```

**生成的文件 / Generated Files:**
```
./my-backup/
├── posts_20251230.sql          # 完整数据库备份 / Full DB backup
├── posts_20251230.csv          # CSV格式（可用Excel打开） / CSV format
├── posts_20251230.json         # JSON格式 / JSON format
└── example-post.mdx            # MDX示例文件 / MDX example
```

**方法3: 导出所有文章为MDX / Method 3: Export All as MDX**
```bash
# 需要先安装Python依赖 / Requires Python dependencies
pip install psycopg2-binary

# 导出所有文章为独立MDX文件 / Export all posts as separate MDX files
./scripts/export/export-all-posts.py ./exported-posts-mdx
```

### 📋 备份策略建议 / Backup Strategy Recommendations

#### 日常使用 / Daily Usage
✅ **依赖自动备份**（每天凌晨2点） / Rely on auto-backup
✅ **定期查看备份目录** / Regularly check backup directory
✅ **重要修改后手动备份** / Manual backup after important changes

#### 重要里程碑 / Important Milestones
🎯 发布重大文章前 / Before major posts
🎯 网站改版前 / Before site redesign
🎯 更换服务器前 / Before server migration

**执行 / Execute:**
```bash
# 完整备份 / Full backup
./scripts/backup/backup-all.sh

# 导出为MDX（便于版本控制） / Export as MDX for version control
./scripts/export/export-all-posts.py ./mdx-backup

# 提交到Git（可选） / Commit to Git (optional)
git add ./mdx-backup
git commit -m "backup: 文章快照 $(date)"
```

### 🔄 灾难恢复 / Disaster Recovery

#### 如果数据库损坏 / If Database is Corrupted

```bash
# 1. 停止服务 / Stop services
docker-compose down

# 2. 恢复最近的备份 / Restore latest backup
gunzip -c backups/db_20251230_020000.sql.gz | \
  docker exec -i blog-postgres psql -U blog_user blog_db

# 3. 重启服务 / Restart services
docker-compose up -d
```

#### 如果需要查看旧版本 / If Need to View Old Version

```bash
# 导出指定日期的文章 / Export posts from specific date
docker exec blog-postgres pg_dump -U blog_user blog_db > backup.sql
```

### 💡 常见问题 / FAQ

#### Q: 文章只能在数据库里吗？ / Are posts only in database?
**A:** 不是的！你可以：/ No! You can:
- 随时导出为MDX文件 / Export to MDX anytime
- 用文本编辑器查看和编辑 / View and edit with text editor
- 导出为CSV/JSON等多种格式 / Export to CSV/JSON etc.

#### Q: 我习惯了用本地编辑器写文章 / I prefer local editors
**A:** 你可以：/ You can:
1. 继续用本地编辑器写MDX / Keep writing MDX locally
2. 写完后复制到管理后台 / Copy to admin panel when done
3. 或者使用导出/导入脚本 / Or use export/import scripts

#### Q: 备份文件占用空间大吗？ / Do backups take much space?
**A:**
- 压缩后的SQL备份通常只有几MB / Compressed SQL is usually only a few MB
- MDX文件体积更小 / MDX files are even smaller
- 自动清理7天前的备份 / Auto-cleanup after 7 days

---

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
