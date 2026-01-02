# 文档归档 / Documentation Archive

本目录包含历史文档和过程记录，已不再作为活跃的用户文档使用。

This directory contains historical documents and process records that are no longer maintained as active user documentation.

---

## 📂 归档内容 / Archived Contents

### migration/ - 迁移文档 / Migration Documents

记录系统迁移和重构的历史文档。

Historical records of system migrations and refactoring.

- **decoupling-complete.md** - 前后端彻底解耦完成报告 / Frontend-Backend Decoupling Complete Report (2025-12)
- **decoupling-progress.md** - 前后端解耦进度记录 / Decoupling Progress Record (2025-12)
- **migration-summary.md** - 迁移总结 / Migration Summary (2025-12)

**说明 / Note**: 这些文档记录了前后端解耦的完整过程，包括API设计、Mock Server、独立CI/CD等。当前系统已完成解耦，这些文档仅作为历史参考。

### operations/ - 运维过程文档 / Operations Process Documents

记录文件重组、系统优化等运维过程的文档。

Records of file reorganization, system optimization, and other operational processes.

- **FILE_REORGANIZATION_2026-01-01.md** - 2026-01-01文件组织整理完成报告 / File Organization Reorganization Report (2026-01-01)
- **REORGANIZATION_VERIFICATION.md** - 重组验证报告 / Reorganization Verification Report
- **monitoring-fix-guide.md** - 监控修复指南 / Monitoring Fix Guide

**说明 / Note**: 这些是内部过程文档，记录了文档重组和系统维护的历史。对于当前文档结构，请参考主文档。

---

## ⚠️ 重要提醒 / Important Notes

### 不要依赖归档文档 / Do Not Rely on Archived Documents

- ❌ 归档文档可能包含过时信息 / Archived documents may contain outdated information
- ❌ 归档文档不再更新 / Archived documents are no longer updated
- ❌ 归档文档可能反映已废弃的做法 / Archived documents may reflect deprecated practices

### 使用当前文档 / Use Current Documentation

对于最新的文档，请参考 / For current documentation, please refer to:

- 📖 **[主文档首页](../README.md)** / **[Main Documentation](../README.md)**
- 🚀 **[快速开始](../quick-start.md)** / **[Quick Start](../quick-start.md)**
- 📚 **[用户指南](../guides/)** / **[User Guides](../guides/)**
- 🔧 **[参考文档](../reference/)** / **[Reference](../reference/)**

---

## 📊 归档标准 / Archiving Criteria

文档被归档的常见原因：

Common reasons for documents to be archived:

1. **功能已完成 / Feature Completed** - 记录已完成的功能开发过程 / Records completed feature development
2. **流程已变更 / Process Changed** - 记录已不再使用的流程 / Records deprecated processes
3. **系统已重构 / System Refactored** - 记录旧系统架构或实现 / Records old system architecture
4. **内部过程 / Internal Process** - 记录内部维护和优化过程 / Records internal maintenance and optimization

---

## 🔍 查找历史信息 / Finding Historical Information

如果您需要查找历史信息 / If you need historical information:

1. **检查归档索引** / **Check Archive Index** - 查看上述归档目录 / Review archived directories above
2. **查看变更日志** / **View Changelog** - 参考 [附录/变更日志](../appendix/changelog.md) / See [Appendix/Changelog](../appendix/changelog.md)
3. **搜索Git历史** / **Search Git History** - 使用 `git log` 查看文件历史 / Use `git log` for file history

```bash
# 查看文件历史 / View file history
git log --follow -- docs/path/to/file.md

# 查看特定日期的提交 / View commits from specific date
git log --after="2025-12-01" --before="2026-01-01"
```

---

## 📝 归档维护 / Archive Maintenance

### 归档原则 / Archiving Principles

- ✅ **保留历史** / **Preserve History** - 不删除有价值的历史记录 / Keep valuable historical records
- ✅ **清晰标记** / **Clear Marking** - 所有归档文档都有说明 / All archived documents have explanations
- ✅ **定期审查** / **Regular Review** - 每年审查一次归档内容 / Review archive contents annually

### 添加新归档 / Adding New Archives

如需添加新的归档文档：

To add new archived documents:

1. 确认文档不再作为活跃文档使用 / Confirm document is no longer active
2. 移动到适当的归档子目录 / Move to appropriate archive subdirectory
3. 更新本 README 的索引 / Update this README index
4. 添加归档说明 / Add archive explanation

```bash
# 示例：归档已完成的功能文档 / Example: Archive completed feature doc
git mv docs/feature-complete.md docs/archive/operations/feature-complete.md
```

---

**最后更新 / Last Updated**: 2026-01-02
**维护者 / Maintained By**: Documentation Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)
