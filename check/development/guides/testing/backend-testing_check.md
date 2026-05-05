# 审查报告：Backend Testing Guide

> 审查时间：2026-05-05
> 文档路径：`docs/development/guides/testing/backend-testing.md`
> 文件大小：9.0 KB / 483 行

## 审查结论：⚠️ 部分偏差

后端测试指南，描述了测试架构和最佳实践。

## 提到的文件

| 文件 | 状态 |
|------|------|
| `Cargo.toml` | ❌ 路径不明确 |
| `crates/api/src/main.rs` | ❌ 路径不明确 |
| `crates/api/src/utils/ip_extractor.rs` | ❌ 不存在 |
| `crates/api/tests/integration_tests.rs` | ❌ 不存在 |
| `crates/core/src/auth.rs` | ❌ 不存在 |
| `crates/shared/src/validators.rs` | ❌ 不存在 |

## 总结

- **总文件数**：6
- **✅ 存在**：0（0%）
- **❌ 路径错误/不存在**：6（100%）
- **问题**：所有路径应为 `backend/crates/` 前缀
