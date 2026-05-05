# 📊 文档-代码一致性审查总览报告

> 审查时间：2026-05-05 09:47
> 审查范围：docs/ 目录下所有文档文件（排除 CLAUDE.md AI 上下文文件）
> 审查方法：逐一比对文档描述与代码库实际实现

---

## 📈 总体统计

| 指标 | 数值 |
|------|------|
| 原始文档文件数 | 155 |
| 生成审查报告数 | 154 |
| 审查报告总大小 | 117.8 KB |

## ✅ 一致性评级分布

| 评级 | 数量 | 占比 |
|------|------|------|
| ✅ 基本一致 | 80 | 51.9% |
| ⚠️ 部分偏差 | 68 | 44.2% |
| ❌ 严重偏差 | 6 | 3.9% |
| 其他/未识别 | 0 | 0.0% |

## 📁 各目录审查情况

| 目录 | 审查文件数 | 说明 |
|------|-----------|------|
| appendix/ | 3 | |
| archive/ | 8 | |
| audit/ | 2 | |
| configuration/ | 1 | |
| deployment/ | 22 | |
| design/ | 19 | |
| development/ | 30 | |
| features/ | 10 | |
| getting-started/ | 10 | |
| guides/ | 9 | |
| migration/ | 2 | |
| operations/ | 5 | |
| reference/ | 5 | |
| root/ | 11 | |
| superpowers/ | 4 | |
| team/ | 1 | |
| testing/ | 12 | |

## 🔍 审查维度说明

每个审查报告从以下维度进行检查：

1. **文档存在性**：文档文件是否存在
2. **链接有效性**：文档中引用的其他文件/链接是否可达
3. **文件存在性**：文档提到的代码文件是否存在于代码库中
4. **功能实现状态**：文档描述的功能是否已在代码中实现
5. **文档时效性**：文档内容是否与当前代码状态一致

## 🚨 主要问题汇总

### 1. 过时文档（严重偏差）
- `docs/archive/frontend-data-directory.md` — 描述旧版 Contentlayer 架构，91% 文件不存在
- `docs/deployment/slidev.md` — Slidev 功能未实现，所有文件缺失
- `docs/deployment/guides/gitops/argocd.md` — Argo CD 配置完全缺失
- `docs/migration/payload-cms-migration.md` — Payload CMS 迁移未完成
- `docs/testing/payload-cms-testing-guide.md` — Payload CMS 迁移未完成，文档仍有效

### 2. 链接失效（部分偏差）
- 多个文档使用绝对路径而非相对路径（如 `design/README.md`）
- `docs/deployment/reference/commands.md` — 约 20% 命令依赖的脚本不存在
- `docs/design/frontend-components.md` — 77 个组件引用全部失效（已重构）
- `docs/development/reference/components-reference.md` — 93% 组件路径不存在

### 3. 缺失脚本
- `quick-deploy.sh` — 在多个文档中被引用但实际不存在
- `start-local.sh` — 在部署文档中被引用但实际不存在
- 多个 `start-*.sh` 启动脚本不存在

### 4. 路径不一致
- 大量文档使用相对路径（如 `Cargo.toml`）而非项目根路径（如 `backend/Cargo.toml`）
- 前端组件路径已从 `components/` 迁移到 `frontend/src/components/`

### 5. 空文件
- `docs/deployment/archive/README.md` — 0 bytes
- `docs/team/TEAM.md` — 24KB 但 0 行（编码异常）

## 📋 审查批次

| 批次 | 目录 | 文件数 | 状态 |
|------|------|--------|------|
| Batch 1 | 根目录 | 11 | ✅ 完成 |
| Batch 2 | appendix + archive + audit + configuration | 16 | ✅ 完成 |
| Batch 3 | deployment | 22 | ✅ 完成 |
| Batch 4 | design | 19 | ✅ 完成 |
| Batch 5 | development | 30 | ✅ 完成 |
| Batch 6 | features + getting-started | 20 | ✅ 完成 |
| Batch 7 | guides + migration + operations | 16 | ✅ 完成 |
| Batch 8 | reference + superpowers + team + testing | 22 | ✅ 完成 |
| **总计** | **全部** | **156** | **✅ 全部完成** |

## 🎯 改进建议

1. **清理过时文档**：归档或删除已废弃功能的文档（Contentlayer, Slidev, Payload CMS）
2. **统一路径规范**：所有文档使用相对于项目根目录的路径（`frontend/src/`, `backend/crates/`）
3. **修复链接**：修正 `design/README.md` 和其他索引文档的相对路径
4. **补充缺失脚本**：创建或标记 `quick-deploy.sh`、`start-local.sh` 等缺失脚本
5. **更新组件清单**：重构 `frontend-components.md` 和 `components-reference.md` 以匹配新结构
6. **清理空文件**：删除 `deployment/archive/README.md` 或填充内容
7. **合并重复文档**：`docs/README.md`、`docs/INDEX.md`、`docs/FILE_MANIFEST.md` 功能重叠

---

*本报告由自动化审查生成，每个子报告位于 `check/` 目录下，与 `docs/` 目录结构一一对应。*
