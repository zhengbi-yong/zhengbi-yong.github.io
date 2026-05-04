# BlockNote 0.49.0 数据结构参考

> 博客系统所有内容的唯一存储格式。任何导入、导出、迁移、编辑操作都必须输出符合此规范的数据。

**适用版本**: BlockNote 0.49.0  
**源码依据**: `@blocknote/core/dist/blocks-_lpGWKOa.cjs` (ProseMirror schema)

---

## 顶级结构

```json
[
  { "id": "uuid", "type": "<block-type>", "props": {...}, "content": [...], "children": [] },
  ...
]
```

每个文档是一个 blocks 数组。每个 block 必须有 `id`、`type`、`props`、`content`、`children` 字段。

---

## 块类型参考

### 文本类 (content = inline)

| 类型 | 说明 | props | content |
|------|------|-------|---------|
| `paragraph` | 段落 | `textColor`, `textAlignment`, `backgroundColor` | `inline[]` |
| `heading` | 标题 | `level` (1-3), `textColor`, `textAlignment`, `backgroundColor`, `isToggleable` | `inline[]` |
| `bulletListItem` | 无序列表 | — | `inline[]` |
| `numberedListItem` | 有序列表 | `start` (optional) | `inline[]` |
| `checkListItem` | 任务列表 | `checked` (boolean) | `inline[]` |
| `toggleListItem` | 折叠列表 | — | `inline[]` |

**示例**:
```json
{
  "type": "heading",
  "props": { "level": 2, "textColor": "default", "textAlignment": "left", "backgroundColor": "default" },
  "content": [
    { "type": "text", "text": "Hello ", "styles": {} },
    { "type": "text", "text": "World", "styles": { "bold": {} } }
  ]
}
```

### 容器类

| 类型 | 说明 | content |
|------|------|---------|
| `blockquote` | 引用块 | `blocks[]` (嵌套段落) |

**示例**:
```json
{
  "type": "blockquote",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "引用文本", "styles": { "italic": {} } }]
    }
  ]
}
```

### 媒体类 (content = none)

| 类型 | 说明 | 必需 props |
|------|------|------------|
| `codeBlock` | 代码块 | `language` (string, 无语言时用 `"plaintext"`) |
| `image` | 图片 | `url`, `caption` (optional), `showPreview`, `previewWidth` |
| `video` | 视频 | `url`, `caption` (optional), `showPreview` |
| `audio` | 音频 | `url` |
| `file` | 文件 | `url`, `name` |
| `divider` | 分割线 | — |

### 表格

```
table → content: tableRow[]
  └── tableRow → content: (tableHeader | tableCell)[]
       ├── tableHeader → content: tableParagraph[]
       └── tableCell → content: tableParagraph[]
            └── tableParagraph → content: inline[]
```

**示例**:
```json
{
  "type": "table",
  "content": [
    {
      "type": "tableRow",
      "content": [
        {
          "type": "tableHeader",
          "content": [
            { "type": "tableParagraph", "content": [{ "type": "text", "text": "列A", "styles": {} }] }
          ]
        }
      ]
    }
  ]
}
```

---

## 内联节点

### text

```json
{ "type": "text", "text": "内容", "styles": { "bold": {}, "italic": {} } }
```

### link

```json
{
  "type": "link",
  "href": "https://example.com",
  "content": [{ "type": "text", "text": "链接文字", "styles": {} }]
}
```

### mention (BlockNote 内置)

```json
{ "type": "mention", "id": "user-id", "name": "用户名" }
```

---

## 样式规范

### ✅ 正确 — 空对象

```json
{ "bold": {}, "italic": {}, "code": {}, "strike": {}, "highlight": {}, "underline": {} }
```

### ❌ 错误 — Boolean 值（BlockNote 0.49.0 拒绝）

```json
{ "bold": true, "italic": false }
```

---

## 验证脚本

```bash
# 验证数据库中所有文章的 content_json
./scripts/validate_db.sh

# 或直接调用 Python 验证器
python3 scripts/validate_content_json.py --db

# 验证单个 JSON 文件
python3 scripts/validate_content_json.py --json-file article.blocks.json
```

**期望输出**:
```
✅ All 144 articles validate cleanly against BlockNote 0.49.0 schema!
```

---

## 常见错误

| 错误 | 原因 | 修复 |
|------|------|------|
| `tableCell ... ONLY accepts tableParagraph, got 'text'` | tableCell 直接放 text | 加 `tableParagraph` 包装 |
| `codeBlock missing props.language` | 无 language | 设 `"plaintext"` |
| `blockquote ... unknown block type 'text'` | blockquote 直接放 inline | 用 paragraph 包裹 |
| `heading level 4 not in {1, 2, 3}` | 标题层级 > 3 | 截断到 3 |
| `style 'bold' must be object, got bool` | boolean styles | 改为 `{}` |

---

## 相关文档

- [数据操作完整手册](../operations/data-operations-manual.md) — 8 个实用场景
- [BlockNote 官方文档](https://www.blocknotejs.org/docs)
