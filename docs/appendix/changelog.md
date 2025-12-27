# 变更日志

本文档记录项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 计划中
- 添加全文搜索功能
- 支持多语言
- 优化图片加载

---

## [1.8.1.1] - 2025-12-27

### 文档
- 📚 **全面整理文档**:
  - 清理 27 个过时文档
  - 整合 15 个测试文档为 3 个综合文档
  - 新增 8 个关键文档
  - 创建文档导航中心

### 新增文档
- ✅ `docs/development/backend/testing.md` - 后端测试综合指南
- ✅ `docs/development/frontend/refine-integration.md` - Refine 集成指南
- ✅ `docs/development/frontend/testing.md` - 前端测试综合指南
- ✅ `docs/development/operations/performance-monitoring.md` - 性能监控指南
- ✅ `docs/development/operations/security-guide.md` - 安全指南
- ✅ `docs/development/operations/troubleshooting-guide.md` - 故障排查指南
- ✅ `docs/development/best-practices.md` - 开发最佳实践
- ✅ `docs/deployment/single-server.md` - 单服务器部署指南
- ✅ `docs/deployment/high-availability.md` - 高可用部署指南
- ✅ `docs/README.md` - 文档导航中心

### 删除文档
- 🗑️ `.docs-backup/` 目录 (27 个过时文档)
- 🗑️ 4 个 backend 测试文档（已整合到 testing.md）
- 🗑️ 11 个 frontend 测试文档（已整合到 refine-integration.md 和 testing.md）

### 文档优化
- 🔧 优化文档结构，增强可导航性
- 🔧 统一文档格式和风格
- 🔧 添加交叉引用和快速查找

---

## [1.8.1] - 2025-12-27

### 新增
- ✨ 评论功能测试通过
- ✨ 添加评论点赞功能
- ✨ 添加评论编辑功能（5 分钟内）

### 改进
- ⚡ 优化评论加载性能
- 🎨 改进评论 UI/UX

### 修复
- 🐛 修复登出功能
- 🐛 修复 Token 刷新逻辑

---

## [1.8.0] - 2025-12-26

### 新增
- ✨ 完整的评论系统
  - 嵌套评论（最多 5 层）
  - 评论审核流程
  - 评论点赞功能
  - Markdown 支持
  - HTML 清理

- ✨ Refine 框架集成
  - 用户管理页面
  - 评论管理页面
  - 仪表板页面
  - 52 个测试，100% 通过

- ✨ 前端测试完善
  - 单元测试
  - 集成测试
  - E2E 测试

- ✨ 后端安全修复
  - IP 提取安全修复
  - 密码强度验证
  - CORS 配置优化
  - Token 刷新逻辑修复

### 改进
- ⚡ 数据库查询优化
- 🎨 前端性能优化
- 🔒 安全性显著提升

### 修复
- 🐛 修复 Token 泄漏问题
- 🐛 修复 IP 记录不准确
- 🐛 修复弱密码问题

---

## [1.7.9.5] - 2025-12-25

### 修复
- 🐛 测试评论功能
- 🐛 修复评论不显示的问题

---

## [1.7.9.4] - 2025-12-24

### 修复
- 🐛 修复登出功能
- ✅ 登出功能正常工作

---

## [1.7.9] - 2025-12-20

### 新增
- ✨ 用户认证系统
  - 注册功能
  - 登录功能
  - 双 Token 机制（Access + Refresh）
  - Token 自动刷新

- ✨ 管理后台
  - 用户管理
  - 评论审核
  - 系统统计

- ✨ 后端 API
  - RESTful API 设计
  - JWT 认证
  - 速率限制
  - CORS 支持

### 改进
- ⚡ API 响应时间 < 100ms
- 🎨 响应式设计

---

## [1.7.8] - 2025-12-15

### 新增
- ✨ Next.js 16 升级
- ✨ Tailwind CSS 4 升级
- ✨ TypeScript 5 升级

### 改进
- ⚡ 构建速度提升 50%
- 🎨 开发体验优化

---

## [1.7.5] - 2025-12-10

### 新增
- ✨ 交互式组件
  - 3D 模型查看器
  - 分子可视化
  - 数据图表
  - 音乐记谱

- ✨ MDX 支持
  - 在 Markdown 中使用 React 组件
  - 代码高亮
  - 数学公式

### 改进
- 🎨 UI/UX 改进
- 📱 移动端优化

---

## [1.7.0] - 2025-12-01

### 新增
- ✨ 博客系统
  - 文章列表
  - 文章详情
  - 标签系统
  - 分类功能

- ✨ 搜索功能
  - Kbar 集成
  - 快捷键支持
  - 实时搜索

- ✨ 主题切换
  - 深色模式
  - 浅色模式
  - 自动切换

### 改进
- ⚡ 性能优化
- 🎨 设计系统

---

## [1.6.0] - 2025-11-15

### 新增
- ✨ 分析系统
  - Umami 集成
  - Google Analytics
  - 文章统计

- ✨ 访客统计
  - 访客地图
  - 浏览统计
  - 实时数据

### 改进
- 📊 数据可视化
- 🔍 搜索引擎优化

---

## [1.5.0] - 2025-11-01

### 新增
- ✨ Excalidraw 集成
- ✨ 音乐播放功能
- ✨ 项目展示页面

### 改进
- 🎨 页面布局优化
- ⚡ 加载性能提升

---

## [1.0.0] - 2025-10-01

### 新增
- 🎉 项目首次发布
- ✨ 基础博客功能
- ✨ Next.js 框架
- ✨ Tailwind CSS 样式

---

## 版本命名规则

### 主版本号 (Major)
- 不兼容的 API 变更
- 架构重构

### 次版本号 (Minor)
- 向后兼容的功能新增
- 重要的功能改进

### 修订号 (Patch)
- 向后兼容的问题修复
- 小的改进

### 预发布版本
- `alpha`: 内部测试版本
- `beta`: 公开测试版本
- `rc`: 发布候选版本

---

## 贡献指南

如果您想贡献代码，请遵循以下流程：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### Commit 规范

提交信息格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type 类型**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试
- `chore`: 构建/工具

---

## 相关文档

- [项目架构](../development/architecture.md) - 系统架构说明
- [开发指南](../development/best-practices.md) - 开发规范
- [部署指南](../deployment/overview.md) - 部署说明

---

**最后更新**: 2025-12-27
**维护者**: Development Team
