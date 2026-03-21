# 归档目录

此目录包含不再日常使用但值得保留的历史文件、脚本和文档。

## 目录结构

### 📁 windows/
Windows平台特定脚本
- Windows批处理文件（.bat）
- 主要用于Windows开发环境

### 📁 duplicate-scripts/
重复的开发启动脚本
- Linux Bash/Zsh版本
- Nushell版本
- PowerShell版本

**推荐使用**: 根目录的 `start-dev.sh` 作为主要启动脚本

### 📁 implementation-docs/
已完成项目的实施文档和工具使用指南
- MAGAZINE_LAYOUT_IMPLEMENTATION.md - 博客杂志风格优化总结
- MSW_USAGE.md - Mock Service Worker使用指南
- README_STRESS_TESTS.md - 后端压力测试文档

### 📁 migrate_mdx_crate/
已废弃的MDX迁移工具（旧版本）

### 其他归档文件
- migrate_mdx.py - Python版本MDX迁移脚本
- migrate_mdx.sh - Shell版本MDX迁移脚本

## 归档原则

文件被归档当：
1. ✅ 功能已整合到其他工具中
2. ✅ 项目已完成，文档转为历史记录
3. ✅ 特定平台脚本（非主要开发平台）
4. ⚠️ 仍可能需要参考或特殊场景使用

## 使用建议

- **日常开发**: 使用根目录的 `start-dev.sh`, `start-backend.sh`, `start-frontend.sh`
- **文档参考**: 查看 `docs/` 目录的最新文档
- **历史回溯**: 需要时从此处查找旧脚本或实现记录

## 维护建议

- 定期检查归档文件是否仍有价值
- 超过1年未使用的文件可以考虑删除
- 保留README说明每个归档的用途
