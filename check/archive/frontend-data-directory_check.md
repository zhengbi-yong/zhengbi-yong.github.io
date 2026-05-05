# 审查报告：Frontend Data Directory

> 审查时间：2026-05-05
> 文档路径：`docs/archive/frontend-data-directory.md`
> 文件大小：5.5 KB / 232 行

## 审查结论：❌ 严重偏差

文档描述了前端数据目录结构，但提到的大部分文件已不存在或路径已变更。

## 文件存在性审查

| 文件 | 状态 | 说明 |
|------|------|------|
| `contentlayer.config.js` | ❌ 不存在 | Contentlayer 已废弃 |
| `frontend/lib/mdx-runtime.ts` | ❌ 不存在 | 路径不存在 |
| `headerNavLinks.ts` | ❌ 不存在 | 文件不存在 |
| `musicData.ts` | ❌ 不存在 | 文件不存在 |
| `projectsData.ts` | ❌ 不存在 | 文件不存在 |
| `references-data.bib` | ❌ 不存在 | 文件不存在 |
| `siteMetadata.data.mjs` | ❌ 不存在 | 文件不存在 |
| `siteMetadata.ts` | ❌ 不存在 | 文件不存在 |
| `socialData.ts` | ❌ 不存在 | 文件不存在 |
| `docs/guides/writing-guide.md` | ✅ 存在 | 写作指南存在 |

## 总结

- **总文件数**：11
- **✅ 存在**：1（9%）
- **❌ 不存在**：10（91%）
- **文档过时**：描述的是旧版 Next.js 数据层架构，项目已迁移到 Velite
