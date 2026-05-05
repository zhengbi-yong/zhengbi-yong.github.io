# 审查报告：AST 转换管线

> 审查时间：2026-05-05
> 文档路径：`docs/design/ast-conversion.md`
> 文件大小：4.8 KB / 162 行

## 审查结论：✅ 基本一致

描述了 TipTap JSON ↔ MDX 的双向转换管线。

## 提到的文件

| 文件 | 状态 |
|------|------|
| `backend/crates/api/src/routes/articles.rs` | ✅ 存在 |
| `backend/crates/api/src/routes/mdx_convert.rs` | ✅ 存在 |
| `backend/crates/api/src/routes/posts.rs` | ✅ 存在 |
| `backend/crates/core/src/mdx_convert.rs` | ✅ 存在 |
| `backend/crates/core/src/mdx_to_json.rs` | ✅ 存在 |
| `mdx_convert.rs` | ❌ 路径不明确 |
| `mdx_to_json.rs` | ❌ 路径不明确 |

## 总结

- **总文件数**：7
- **✅ 存在**：5（71%）
- **❌ 路径不明确**：2（29%）
- **核心实现**：双向转换管线已实现
