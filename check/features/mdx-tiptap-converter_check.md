# 审查报告：MDX ↔ TipTap JSON 双向转换器

> 审查时间：2026-05-05
> 文档路径：`docs/features/mdx-tiptap-converter.md`
> 文件大小：9.2 KB / 265 行

## 审查结论：✅ 基本一致

描述了 MDX 和 TipTap JSON 的双向转换技术实现。

## 提到的文件

| 文件 | 状态 |
|------|------|
| `backend/crates/api/src/main.rs` | ✅ 存在 |
| `backend/crates/api/src/routes/mdx_convert.rs` | ✅ 存在 |
| `backend/crates/api/src/routes/mod.rs` | ✅ 存在 |
| `backend/crates/core/src/lib.rs` | ✅ 存在 |
| `backend/crates/core/src/mdx_convert.rs` | ✅ 存在 |
| `backend/crates/core/src/mdx_to_json.rs` | ✅ 存在 |
| `mdx_common.rs` | ❌ 不存在 |
| `mdx_parser.rs` | ❌ 不存在 |

## 总结

- **总文件数**：10
- **✅ 存在**：8（80%）
- **❌ 不存在**：2（20%）
