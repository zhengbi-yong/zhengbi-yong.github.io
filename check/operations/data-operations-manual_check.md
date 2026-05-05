# 审查报告：Blog 数据操作完整手册

> 审查时间：2026-05-05
> 文档路径：`docs/operations/data-operations-manual.md`
> 文件大小：26.6 KB / 816 行

## 审查结论：⚠️ 部分偏差

Blog 数据操作完整手册，描述了数据库迁移、备份、数据导出等操作。

## 提到的文件

| 文件 | 状态 |
|------|------|
| `backup-all.sh` | ❌ 不存在 |
| `export-all-posts.py` | ❌ 不存在 |
| `export-posts-to-mdx.sh` | ❌ 不存在 |
| `fix_content_json.py` | ❌ 不存在 |
| `fix_tables.py` | ❌ 不存在 |
| `frontend/scripts/rebuild_content_json.py` | ✅ 存在 |
| `rebuild_content_json.py` | ❌ 不存在 |
| `validate_content_json.py` | ❌ 不存在 |

## 总结

- **总文件数**：8
- **✅ 存在**：1（12.5%）
- **❌ 不存在**：7（87.5%）
