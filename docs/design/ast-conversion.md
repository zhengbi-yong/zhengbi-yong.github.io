# AST 转换管线

> 来源：EDITOR_SYSTEM_DESIGN.md P4、editor-design.md

## 转换方向

```
TipTap JSON (ProseMirror AST)
        │
        ▼
  remark-prosemirror 转换器
        │
        ▼
   MDAST (Markdown AST)
        │
        ▼
  remark-stringify
        │
        ▼
   MDX 纯文本
```

## json_to_mdx 实现

```typescript
// 核心转换函数
function tiptap_json_to_mdx(json: JSONContent): string {
  // 1. 递归遍历 JSON 节点树
  // 2. 按类型映射为 MDX AST 节点
  // 3. 处理特殊节点：
  //    - inlineMath → $...$
  //    - mathematics → $$...$$
  //    - codeBlock → ```...```
  //    - image → ![alt](url)
  // 4. 序列化为 MDX 字符串
}
```

## 节点类型映射

| TipTap 节点 | MDX 输出 |
|------------|---------|
| `doc` | 根节点，无输出 |
| `paragraph` | 文本 + 换行 |
| `heading` (level) | `#` × level |
| `bulletList` / `orderedList` | `- ` / `1. ` |
| `codeBlock` | ` ```language \n code \n ``` ` |
| `blockquote` | `> ` |
| `image` | `![alt](src)` |
| `inlineMath` (latex) | `$latex$` |
| `mathematics` (latex) | `$$\nlatex\n$$` |
| `horizontalRule` | `---` |
| `hardBreak` | 两个空格 + 换行 |

## 双向转换

```
TipTap JSON  ←──→  MDX 文本
     │                    │
     ▼                    ▼
  数据库写入            数据库读取
  content_json          content_mdx
```

- 写入时：`editor.getJSON()` → `json_to_mdx()` → 保存双轨
- 读取时：`content_mdx` 直供 SSR，`content_json` 供编辑器加载
