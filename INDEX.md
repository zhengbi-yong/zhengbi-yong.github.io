# 项目文档索引

本项目的完整文档集合，涵盖架构、开发、测试和部署的各个方面。

---

## 📚 核心文档

### 1. [快速参考指南](./quick-reference.md) ⭐ 快速入门

**适合人群**：所有开发者

**内容概要**：
- 快速启动命令
- 常用代码片段
- 快捷命令参考
- 常见问题解决方案

**何时使用**：
- 需要快速查找命令
- 日常开发参考
- 忘记某个语法或配置

---

### 2. [前后端开发与测试完整指南](./frontend-backend-guide.md) 📖 核心文档

**适合人群**：新加入团队成员、需要全面了解项目的开发者

**内容概要**：
- 完整的项目架构说明
- 后端开发详细流程
- 前端开发详细流程
- 测试指南（单元、集成、E2E、契约测试）
- CI/CD 流程说明
- 常见问题详解
- API 规范和错误代码表

**何时使用**：
- 第一次接触项目
- 需要了解某个功能的完整实现流程
- 遇到复杂问题需要深入理解
- 进行代码审查

---

### 3. [前后端解耦完成报告](./decoupling-complete.md) ✅ 实施成果

**适合人群**：项目经理、技术负责人、审查人员

**内容概要**：
- 解耦项目完成状态（100%）
- 已实现的核心功能清单
- 文件清单（新建和修改的文件）
- 使用指南
- API 响应示例
- 错误代码参考
- 技术栈总结

**何时使用**：
- 了解项目解耦成果
- 查看已实现的功能列表
- 查找特定文件的位置和用途
- 了解项目成功标准

---

### 4. [文件组织原则指南](./docs/development/FILE_ORGANIZATION_GUIDE.md) 🏗️ 架构规范

**适合人群**：所有开发者、贡献者、维护者

**内容概要**：
- 6个核心组织原则
- 详细的文件放置规则
- 命名规范（文件、目录、代码）
- 扩展性指南
- 决策流程和决策树
- 最佳实践和反模式
- 常见问题解答
- 实际场景示例

**何时使用**：
- 添加新文件前，确定应该放在哪里
- 创建新目录时，遵循命名规范
- 重构代码时，参考组织原则
- 代码审查时，检查文件组织
- 对文件位置不确定时

**重要性**：⭐⭐⭐⭐⭐
- 确保代码库长期保持清晰和可维护
- 所有开发者应遵循的核心规范

---

### 5. [命名规范最佳实践指南](./docs/development/NAMING_CONVENTIONS.md) 📝 命名标准

**适合人群**：所有开发者、代码审查人员

**内容概要**：
- 6个核心命名原则（清晰性、一致性、社区约定等）
- Rust命名规范（Struct、Function、Constant、Module、Lifetime）
- TypeScript/React命名规范（Component、Hook、Interface、Props）
- Next.js路由命名规范（动态路由、路由组、特殊文件）
- 数据库命名规范（Table、Column、Index、Foreign Key、Migration）
- 配置文件命名规范（环境变量、Docker、Nginx、脚本）
- 文档命名规范（指南、API文档、快速参考）
- 快速参考表（所有命名规范速查）
- 13+反模式示例（❌ vs ✅对比）
- 对标世界顶级项目（Rust、TypeScript、React、PostgreSQL等）

**何时使用**：
- 编写新代码时，确定命名规范
- 代码审查时，检查命名是否符合规范
- 不确定如何命名某个变量、函数或文件时
- 学习项目各技术栈的命名约定

**重要性**：⭐⭐⭐⭐⭐
- 确保代码库命名一致性（当前95%，目标99%）
- 所有开发者应遵循的命名标准
- 对标世界顶级项目最佳实践

---

### 6. [前后端解耦进度报告](./decoupling-progress.md) 📊 实施记录

**适合人群**：技术负责人、开发人员

**内容概要**：
- 项目实施进度（70% 前2阶段，100% 核心功能）
- 已完成工作详细记录
- 文件清单和修改内容
- 下一步工作建议
- 成功指标

**何时使用**：
- 查看历史实施记录
- 了解某个功能是如何实现的
- 查看代码变更历史

---

## 🎯 按角色查找文档

### 新加入开发者

**阅读顺序**：
1. [文件组织原则指南](./docs/development/FILE_ORGANIZATION_GUIDE.md) ⭐ **必读** - 了解代码库组织规范
2. [命名规范最佳实践指南](./docs/development/NAMING_CONVENTIONS.md) ⭐ **必读** - 学习命名规范
3. [快速参考指南](./quick-reference.md) - 快速了解项目
4. [前后端开发与测试完整指南](./frontend-backend-guide.md) - 深入学习
5. [前后端解耦完成报告](./decoupling-complete.md) - 了解项目成果

### 前端开发者

**重点文档**：
1. [快速参考指南 - 前端部分](./quick-reference.md#-前端开发)
2. [完整指南 - 前端开发流程](./frontend-backend-guide.md#前端开发流程)
3. [完整指南 - 前端测试](./frontend-backend-guide.md#前端测试-1)

### 后端开发者

**重点文档**：
1. [快速参考指南 - 后端部分](./quick-reference.md#-后端开发)
2. [完整指南 - 后端开发流程](./frontend-backend-guide.md#后端开发流程)
3. [完整指南 - 后端测试](./frontend-backend-guide.md#后端测试)

### 测试工程师

**重点文档**：
1. [完整指南 - 测试指南](./frontend-backend-guide.md#测试指南)
2. [完整指南 - 契约测试](./frontend-backend-guide.md#契约测试api-contract-testing)
3. [前后端解耦完成报告 - 测试验证](./decoupling-complete.md#-4-契约测试-)

### DevOps 工程师

**重点文档**：
1. [完整指南 - CI/CD 流程](./frontend-backend-guide.md#cicd-流程)
2. [完整指南 - 部署](./frontend-backend-guide.md#部署)
3. [前后端解耦完成报告 - CI/CD](./decoupling-complete.md#-第三阶段独立-cicd-)

---

## 🔍 按任务查找文档

### 添加新的 API 端点

1. [快速参考 - 后端：添加新 API 端点](./quick-reference.md#-添加新-api-端点3-步)
2. [完整指南 - 创建新的 API 端点](./frontend-backend-guide.md#1-创建新的-api-端点)

### 前端开发使用 Mock

1. [快速参考 - 前端：开发新功能](./quick-reference.md#-开发新功能使用-mock)
2. [完整指南 - 使用 Mock Server 开发](./frontend-backend-guide.md#1-使用-mock-server-开发)

### 运行测试

1. [快速参考 - 后端测试](./quick-reference.md#测试-1)
2. [快速参考 - 前端测试](./quick-reference.md#测试-1)
3. [完整指南 - 测试指南](./frontend-backend-guide.md#测试指南)

### API 接口变更

1. [快速参考 - 更新 API 接口](./quick-reference.md#-更新-api-接口)
2. [完整指南 - 更新 OpenAPI 规范](./frontend-backend-guide.md#2-更新-openapi-规范)

### 部署应用

1. [快速参考 - 构建和部署](./quick-reference.md#-构建和部署)
2. [完整指南 - 部署](./frontend-backend-guide.md#部署)

---

## 📖 文档使用建议

### 日常开发

**推荐**：使用 [快速参考指南](./quick-reference.md)
- 快速查找命令
- 复制粘贴代码片段
- 快速解决问题

### 学习项目

**推荐**：使用 [完整开发指南](./frontend-backend-guide.md)
- 系统学习项目架构
- 理解设计决策
- 掌握最佳实践

### 代码审查

**推荐**：结合使用
1. [快速参考](./quick-reference.md) - 查看标准做法
2. [完整指南](./frontend-backend-guide.md) - 理解背后的原理
3. [解耦完成报告](./decoupling-complete.md) - 了解已实现的功能

### 问题排查

**推荐**：
1. [快速参考 - 常见问题](./quick-reference.md#-常见任务)
2. [完整指南 - 常见问题](./frontend-backend-guide.md#常见问题)
3. 查看 [测试报告](./decoupling-complete.md) 中的测试结果

---

## 🔄 文档更新记录

### 2026-01-01
- ✅ 创建 [命名规范最佳实践指南](./docs/development/NAMING_CONVENTIONS.md) - 对标世界顶级项目
- ✅ 创建 [前后端开发与测试完整指南](./frontend-backend-guide.md)
- ✅ 创建 [快速参考指南](./quick-reference.md)
- ✅ 创建 [文档索引](./DOCUMENTATION_INDEX.md)
- ✅ 更新 [前后端解耦完成报告](./decoupling-complete.md)
- ✅ 完成 100% 核心功能测试验证

### 前期文档
- [前后端解耦进度报告](./decoupling-progress.md) - 实施过程记录
- [前后端解耦完成报告](./decoupling-complete.md) - 初始版本

---

## 📝 文档维护

### 文档结构原则

1. **快速参考**：简洁、命令式、代码片段丰富
2. **完整指南**：详细、解释性、包含原理和最佳实践
3. **进度报告**：记录历史、文件清单、成功标准
4. **文档索引**：导航、查找、按角色和任务分类

### 更新建议

当进行以下更改时，请同步更新文档：

- **添加新功能**：更新完整指南和快速参考
- **修改 API**：更新 API 规范和示例
- **新增配置**：更新快速启动和环境设置
- **修复 Bug**：更新常见问题部分
- **改进流程**：更新开发流程说明

---

## 🆘 获取帮助

### 文档内查找

使用浏览器搜索功能（Ctrl+F / Cmd+F）查找关键词：
- 错误信息
- 命令名称
- 文件路径
- 技术术语

### 外部资源

- [Rust 官方文档](https://doc.rust-lang.org/)
- [Axum 文档](https://docs.rs/axum/)
- [Next.js 文档](https://nextjs.org/docs)
- [OpenAPI 规范](https://spec.openapis.org/oas/latest.html)

### 团队协作

- 查看 GitHub Issues
- 提交新的 Issue
- 代码审查时参考文档标准

---

## 📊 文档统计

| 文档 | 页数 | 代码示例 | 字数 |
|------|------|----------|------|
| 快速参考指南 | ~10 页 | 50+ | ~3000 |
| 完整开发指南 | ~50 页 | 100+ | ~15000 |
| 命名规范指南 | ~35 页 | 80+ | ~11000 |
| 文件组织指南 | ~30 页 | 60+ | ~9500 |
| 解耦完成报告 | ~15 页 | 30+ | ~4000 |
| 解耦进度报告 | ~20 页 | 40+ | ~6000 |
| **总计** | **~160 页** | **360+** | **~48500** |

---

**文档维护者**：Claude Code
**最后更新**：2026-01-01
**文档版本**：v1.0.0

如有文档相关问题或建议，请提交 Issue 或 PR。
